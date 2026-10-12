import {
  Scan,
  Finding,
  CheckDefinition,
  ScanProgress,
  OverviewMetrics,
  AnalyticsTrends,
  ScanComparisonResult
} from '../types';

const envApiUrl = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim() : '';
const API_BASE = envApiUrl
  ? (envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) errorDetail = body.detail;
      else if (body.message) errorDetail = body.message;
    } catch {
      // response body was not json
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string; service: string; version: string }>(res);
  },

  // Scans
  getScans: async (params?: { status?: string; profile?: string; q?: string; limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.profile) searchParams.append('profile', params.profile);
    if (params?.q) searchParams.append('q', params.q);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.skip) searchParams.append('skip', String(params.skip));
    
    const res = await fetch(`${API_BASE}/scans?${searchParams.toString()}`);
    return handleResponse<Scan[]>(res);
  },

  getScan: async (id: string) => {
    const res = await fetch(`${API_BASE}/scans/${id}`);
    return handleResponse<Scan>(res);
  },

  getScanProgress: async (id: string) => {
    const res = await fetch(`${API_BASE}/scans/${id}/progress`);
    return handleResponse<ScanProgress>(res);
  },

  getScanFindings: async (id: string, params?: { severity?: string; category?: string; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);

    const res = await fetch(`${API_BASE}/scans/${id}/findings?${searchParams.toString()}`);
    return handleResponse<Finding[]>(res);
  },

  createScan: async (data: {
    target: string;
    profile: string;
    enabled_checks?: string[];
    timeout_seconds?: number;
    permission_confirmed: boolean;
  }) => {
    const res = await fetch(`${API_BASE}/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Scan>(res);
  },

  cancelScan: async (id: string) => {
    const res = await fetch(`${API_BASE}/scans/${id}/cancel`, { method: 'POST' });
    return handleResponse<{ message: string; status: string }>(res);
  },

  compareScans: async (scanId: string, otherScanId: string) => {
    const res = await fetch(`${API_BASE}/scans/${scanId}/compare/${otherScanId}`, { method: 'POST' });
    return handleResponse<ScanComparisonResult>(res);
  },

  getAvailableChecks: async () => {
    const res = await fetch(`${API_BASE}/scans/checks/available`);
    return handleResponse<CheckDefinition[]>(res);
  },

  // Dependencies
  scanDependencies: async (data: { file?: File; rawContent?: string; filename?: string }) => {
    const formData = new FormData();
    if (data.file) {
      formData.append('file', data.file);
    } else if (data.rawContent) {
      formData.append('raw_content', data.rawContent);
      if (data.filename) formData.append('filename', data.filename);
    }
    const res = await fetch(`${API_BASE}/scans/dependencies/scan`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<any>(res);
  },

  // Findings
  getFinding: async (id: string) => {
    const res = await fetch(`${API_BASE}/findings/${id}`);
    return handleResponse<Finding>(res);
  },

  updateFindingStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/findings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Finding>(res);
  },

  // Analytics
  getAnalyticsOverview: async () => {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    return handleResponse<OverviewMetrics>(res);
  },

  getAnalyticsTrends: async () => {
    const res = await fetch(`${API_BASE}/analytics/trends`);
    return handleResponse<AnalyticsTrends>(res);
  },

  // Reports
  downloadReportJson: (scanId: string) => {
    window.open(`${API_BASE}/reports/${scanId}/json?download=true`, '_blank');
  },

  // Settings & Demo
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse<any>(res);
  },

  updateSettings: async (payload: { allow_local_targets: boolean; default_timeout: number }) => {
    const res = await fetch(`${API_BASE}/settings/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  seedDemoData: async () => {
    const res = await fetch(`${API_BASE}/settings/demo/seed`, { method: 'POST' });
    return handleResponse<{ message: string; scans_created: number }>(res);
  },

  clearDemoData: async () => {
    const res = await fetch(`${API_BASE}/settings/demo/clear`, { method: 'POST' });
    return handleResponse<{ message: string; deleted_count: number }>(res);
  },
};
