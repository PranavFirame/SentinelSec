import {
  Scan,
  Finding,
  CheckDefinition,
  ScanProgress,
  OverviewMetrics,
  AnalyticsTrends,
  ScanComparisonResult,
  User,
  AuthResponse
} from '../types';

const envApiUrl = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim() : '';
const API_BASE = envApiUrl
  ? (envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

// Session storage for bearer token fallback across cross-origin deployments (e.g. Render)
const TOKEN_KEY = 'sentinelsec_auth_token';
let inMemoryToken: string | null = null;
try {
  inMemoryToken = localStorage.getItem(TOKEN_KEY);
} catch {
  // localStorage disabled or not available
}

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
};

export const getAuthToken = () => inMemoryToken;


async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) {
        if (Array.isArray(body.detail)) {
          // Pydantic validation errors: array of { msg, loc, type }
          errorDetail = body.detail
            .map((err: any) => err.msg || (typeof err === 'string' ? err : JSON.stringify(err)))
            .join('; ');
        } else if (typeof body.detail === 'object') {
          errorDetail = body.detail.message || JSON.stringify(body.detail);
        } else {
          errorDetail = String(body.detail);
        }
      } else if (body.message) {
        errorDetail = typeof body.message === 'string' ? body.message : JSON.stringify(body.message);
      }
    } catch {
      // response body was not json
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}


// Wrapper to always send credentials (cookies) and Authorization Bearer header
function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (inMemoryToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensures sentinelsec_session cookie is sent
  });
}

export const api = {
  // Auth
  register: async (data: { full_name: string; email: string; password: string; confirm_password: string; terms_accepted: boolean }) => {
    const res = await authFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<AuthResponse>(res);
    if (result.token) setAuthToken(result.token);
    return result;
  },

  login: async (data: { email: string; password: string; remember_me?: boolean }) => {
    const res = await authFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<AuthResponse>(res);
    if (result.token) setAuthToken(result.token);
    return result;
  },

  logout: async () => {
    try {
      await authFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
    return { message: 'Logged out' };
  },

  getMe: async () => {
    const res = await authFetch(`${API_BASE}/auth/me`);
    return handleResponse<User>(res);
  },

  updateProfile: async (data: { full_name?: string }) => {
    const res = await authFetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  changePassword: async (data: { current_password: string; new_password: string; confirm_new_password: string }) => {
    const res = await authFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(res);
  },

  forgotPassword: async (data: { email: string }) => {
    const res = await authFetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; dev_token?: string }>(res);
  },

  resetPassword: async (data: { token: string; new_password: string; confirm_new_password: string }) => {
    const res = await authFetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(res);
  },

  deleteAccount: async (data: { password: string }) => {
    const res = await authFetch(`${API_BASE}/auth/account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setAuthToken(null);
    return handleResponse<{ message: string }>(res);
  },

  // Health
  getHealth: async () => {
    const res = await authFetch(`${API_BASE}/health`);
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
    
    const res = await authFetch(`${API_BASE}/scans?${searchParams.toString()}`);
    return handleResponse<Scan[]>(res);
  },

  getScan: async (id: string) => {
    const res = await authFetch(`${API_BASE}/scans/${id}`);
    return handleResponse<Scan>(res);
  },

  getScanProgress: async (id: string) => {
    const res = await authFetch(`${API_BASE}/scans/${id}/progress`);
    return handleResponse<ScanProgress>(res);
  },

  getScanFindings: async (id: string, params?: { severity?: string; category?: string; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);

    const res = await authFetch(`${API_BASE}/scans/${id}/findings?${searchParams.toString()}`);
    return handleResponse<Finding[]>(res);
  },

  createScan: async (data: {
    target: string;
    profile: string;
    enabled_checks?: string[];
    timeout_seconds?: number;
    permission_confirmed: boolean;
  }) => {
    const res = await authFetch(`${API_BASE}/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Scan>(res);
  },

  cancelScan: async (id: string) => {
    const res = await authFetch(`${API_BASE}/scans/${id}/cancel`, { method: 'POST' });
    return handleResponse<{ message: string; status: string }>(res);
  },

  deleteScan: async (id: string) => {
    const res = await authFetch(`${API_BASE}/scans/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete scan');
    return true;
  },

  compareScans: async (scanId: string, otherScanId: string) => {
    const res = await authFetch(`${API_BASE}/scans/${scanId}/compare/${otherScanId}`, { method: 'POST' });
    return handleResponse<ScanComparisonResult>(res);
  },

  getAvailableChecks: async () => {
    const res = await authFetch(`${API_BASE}/scans/checks/available`);
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
    const res = await authFetch(`${API_BASE}/scans/dependencies/scan`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<any>(res);
  },

  // Findings
  getFinding: async (id: string) => {
    const res = await authFetch(`${API_BASE}/findings/${id}`);
    return handleResponse<Finding>(res);
  },

  updateFindingStatus: async (id: string, status: string) => {
    const res = await authFetch(`${API_BASE}/findings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Finding>(res);
  },

  // Analytics
  getAnalyticsOverview: async () => {
    const res = await authFetch(`${API_BASE}/analytics/overview`);
    return handleResponse<OverviewMetrics>(res);
  },

  getAnalyticsTrends: async () => {
    const res = await authFetch(`${API_BASE}/analytics/trends`);
    return handleResponse<AnalyticsTrends>(res);
  },

  // Reports
  downloadReportJson: (scanId: string) => {
    window.open(`${API_BASE}/reports/${scanId}/json?download=true`, '_blank');
  },

  // Settings
  getSettings: async () => {
    const res = await authFetch(`${API_BASE}/settings`);
    return handleResponse<any>(res);
  },

  updateSettings: async (payload: { allow_local_targets: boolean; default_timeout: number }) => {
    const res = await authFetch(`${API_BASE}/settings/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },
};
