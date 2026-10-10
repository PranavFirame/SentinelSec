from fastapi import APIRouter
from backend.app.api.endpoints import health, scans, findings, analytics, reports, settings

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(scans.router, prefix="/scans", tags=["Scans"])
api_router.include_router(findings.router, prefix="/findings", tags=["Findings"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings"])
