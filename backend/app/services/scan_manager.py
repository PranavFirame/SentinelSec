import asyncio
from datetime import datetime, timezone
from typing import Dict, Optional, List, Any
import uuid

from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.db.session import SessionLocal
from backend.app.models.scan import Scan
from backend.app.models.finding import Finding
from backend.app.models.check_execution import CheckExecution
from backend.app.scanner.engine import SecurityScanEngine, ScannerExecutionResult
from backend.app.scanner.checks.base import CheckStatus


def utcnow():
    return datetime.now(timezone.utc)


class BackgroundScanManager:
    """
    Manages asynchronous scan execution with bounded concurrency,
    persisted state, cooperative cancellation, and live progress reporting.
    """
    def __init__(self):
        self._cancellation_tokens: Dict[str, bool] = {}
        self._active_tasks: Dict[str, asyncio.Task] = {}
        self._progress_cache: Dict[str, Dict[str, Any]] = {}
        self._semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_SCANS)

    def is_cancelled(self, scan_id: str) -> bool:
        return self._cancellation_tokens.get(scan_id, False)

    def cancel_scan(self, scan_id: str) -> bool:
        """Requests cooperative cancellation of a queued or running scan."""
        if scan_id in self._active_tasks or scan_id in self._cancellation_tokens:
            self._cancellation_tokens[scan_id] = True
            if scan_id in self._active_tasks:
                task = self._active_tasks[scan_id]
                # Also signal the task
            logger.info(f"Cancellation requested for scan {scan_id}")
            return True
        return False

    def get_progress(self, scan_id: str) -> Optional[Dict[str, Any]]:
        return self._progress_cache.get(scan_id)

    async def start_scan_job(
        self,
        scan_id: str,
        target: str,
        profile: str,
        enabled_checks: Optional[List[str]] = None,
        timeout_seconds: int = 15,
        allow_local: Optional[bool] = None
    ):
        """
        Launches background async worker task for the scan.
        """
        self._cancellation_tokens[scan_id] = False
        task = asyncio.create_task(
            self._run_scan_worker(
                scan_id=scan_id,
                target=target,
                profile=profile,
                enabled_checks=enabled_checks,
                timeout_seconds=timeout_seconds,
                allow_local=allow_local
            )
        )
        self._active_tasks[scan_id] = task

        def _cleanup(t):
            self._active_tasks.pop(scan_id, None)
            self._cancellation_tokens.pop(scan_id, None)

        task.add_done_callback(_cleanup)

    async def _run_scan_worker(
        self,
        scan_id: str,
        target: str,
        profile: str,
        enabled_checks: Optional[List[str]],
        timeout_seconds: int,
        allow_local: Optional[bool]
    ):
        async with self._semaphore:
            db: Session = SessionLocal()
            try:
                scan = db.query(Scan).filter(Scan.id == scan_id).first()
                if not scan:
                    logger.error(f"Scan {scan_id} not found in database.")
                    return

                if self.is_cancelled(scan_id):
                    scan.status = "cancelled"
                    scan.completed_at = utcnow()
                    db.commit()
                    return

                scan.status = "running"
                scan.started_at = utcnow()
                db.commit()

                # Progress callback
                def update_progress(executed: int, total: int, current_check: str):
                    pct = int((executed / max(total, 1)) * 100)
                    self._progress_cache[scan_id] = {
                        "scan_id": scan_id,
                        "status": "running",
                        "checks_executed": executed,
                        "checks_total": total,
                        "percent_complete": pct,
                        "current_check": current_check
                    }

                engine = SecurityScanEngine(allow_local=allow_local)
                result: ScannerExecutionResult = await engine.execute_scan(
                    target=target,
                    profile=profile,
                    enabled_checks=enabled_checks,
                    timeout_seconds=timeout_seconds,
                    progress_callback=update_progress,
                    is_cancelled=lambda: self.is_cancelled(scan_id)
                )

                # Persist results in DB
                scan.target_ip = result.resolved_ip
                scan.completed_at = utcnow()
                scan.duration_seconds = result.duration_seconds
                scan.security_score = result.score_data["final_score"]
                scan.score_breakdown = result.score_data

                # Count check statuses
                scan.checks_executed = len(result.check_results)
                scan.checks_passed = sum(1 for c in result.check_results if c.status == CheckStatus.PASS)
                scan.checks_failed = sum(1 for c in result.check_results if c.status == CheckStatus.FAIL)
                scan.checks_skipped = sum(1 for c in result.check_results if c.status == CheckStatus.SKIPPED)
                scan.checks_errored = sum(1 for c in result.check_results if c.status == CheckStatus.ERROR)

                if self.is_cancelled(scan_id):
                    scan.status = "cancelled"
                    scan.error_summary = "Scan cancelled cooperatively by user."
                elif result.error_summary:
                    scan.status = "failed"
                    scan.error_summary = result.error_summary
                else:
                    scan.status = "completed"

                # Persist check executions
                for c_res in result.check_results:
                    chk_exec = CheckExecution(
                        scan_id=scan.id,
                        check_id=c_res.check_id,
                        check_name=c_res.check_name,
                        category=c_res.category,
                        status=c_res.status.value,
                        execution_time_ms=c_res.execution_time_ms,
                        result_details=c_res.details,
                        error_message=c_res.error_message
                    )
                    db.add(chk_exec)

                # Persist findings
                for f_draft in result.all_findings:
                    finding = Finding(
                        scan_id=scan.id,
                        rule_id=f_draft.rule_id,
                        title=f_draft.title,
                        description=f_draft.description,
                        severity=f_draft.severity.value,
                        category=f_draft.category,
                        confidence=f_draft.confidence,
                        status="open",
                        affected_component=f_draft.affected_component,
                        evidence=f_draft.evidence,
                        risk_explanation=f_draft.risk_explanation,
                        remediation=f_draft.remediation,
                        references=f_draft.references,
                        cwe_id=f_draft.cwe_id,
                        first_observed_at=scan.created_at,
                        last_observed_at=scan.completed_at or utcnow()
                    )
                    db.add(finding)

                db.commit()
                logger.info(f"Scan {scan_id} finished with status '{scan.status}' and score {scan.security_score}")

            except Exception as e:
                db.rollback()
                logger.error(f"Scan execution exception for {scan_id}: {str(e)}", exc_info=True)
                scan = db.query(Scan).filter(Scan.id == scan_id).first()
                if scan:
                    scan.status = "failed"
                    scan.completed_at = utcnow()
                    scan.error_summary = f"Execution error: {str(e)}"
                    db.commit()
            finally:
                db.close()
                self._progress_cache.pop(scan_id, None)


# Singleton scan manager
scan_manager = BackgroundScanManager()
