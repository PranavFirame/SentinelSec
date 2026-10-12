export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type FindingStatus = 'open' | 'resolved' | 'accepted_risk';
export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface FindingSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
  total: number;
}

export interface ScoreDeduction {
  rule_id: string;
  title: string;
  severity: string;
  confidence: string;
  occurrence: number;
  penalty: number;
}

export interface ScoreBreakdown {
  final_score: number;
  base_score: number;
  total_penalty: number;
  severity_penalties: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  total_findings_evaluated: number;
  unique_rules_evaluated: number;
  deductions: ScoreDeduction[];
  rating: string;
  methodology: string;
}

export interface Scan {
  id: string;
  target: string;
  profile: string;
  status: ScanStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  security_score?: number;
  score_breakdown?: ScoreBreakdown;
  checks_executed: number;
  checks_passed: number;
  checks_failed: number;
  checks_skipped: number;
  checks_errored: number;
  target_ip?: string;
  error_summary?: string;
  findings_summary?: FindingSummary;
}

export interface Finding {
  id: string;
  scan_id: string;
  rule_id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  category: string;
  confidence: string;
  status: FindingStatus;
  affected_component: string;
  evidence?: Record<string, any>;
  risk_explanation: string;
  remediation: string;
  references?: string[];
  cwe_id?: string;
  first_observed_at: string;
  last_observed_at: string;
}

export interface CheckExecution {
  id: string;
  scan_id: string;
  check_id: string;
  check_name: string;
  category: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped' | 'error';
  started_at: string;
  completed_at?: string;
  execution_time_ms: number;
  result_details?: Record<string, any>;
  error_message?: string;
}

export interface CheckDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  default_severity: string;
  profiles: string[];
  is_network_check: boolean;
}

export interface ScanProgress {
  scan_id: string;
  status: ScanStatus;
  checks_executed: number;
  checks_total: number;
  percent_complete: number;
  current_check?: string;
  duration_seconds?: number;
}

export interface TopIssue {
  rule_id: string;
  title: string;
  severity: string;
  category: string;
  count: number;
}

export interface OverviewMetrics {
  overall_score: number;
  total_scans: number;
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  info_findings: number;
  passed_checks: number;
  failed_checks: number;
  warning_checks: number;
  running_scans: number;
  recent_scans: Scan[];
  recent_findings: Finding[];
  top_issues: TopIssue[];
  is_demo_mode: boolean;
}

export interface TrendDataPoint {
  date: string;
  average_score?: number;
  total_scans: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  percentage: number;
}

export interface AnalyticsTrends {
  trends: TrendDataPoint[];
  category_breakdown: CategoryCount[];
  severity_distribution: Record<string, number>;
  checks_ratio: {
    passed: number;
    failed: number;
  };
}

export interface ScanComparisonResult {
  scan_a_id: string;
  scan_b_id: string;
  scan_a_target: string;
  scan_b_target: string;
  scan_a_date: string;
  scan_b_date: string;
  scan_a_score?: number;
  scan_b_score?: number;
  score_delta?: number;
  new_findings: Finding[];
  resolved_findings: Finding[];
  recurring_findings: Finding[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token?: string;
}

