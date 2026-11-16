import { localBackend } from './localBackend';
import type {
  AdminOverview,
  AlertItem,
  AlertSeverity,
  BanknoteChecklist,
  BanknoteCheckRecord,
  BanknoteDenomination,
  DashboardSummary,
  FraudReport,
  HistoryItem,
  MobileMoneyCheckRecord,
  MobileMoneyProvider,
  MobileMoneySample,
  ReportStatus,
  User,
} from '../types';

const TOKEN_KEY = 'vendorguard_session_token';

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (
    window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean };
    }
  ).Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  if (window.location.protocol === 'capacitor:') return true;
  return false;
}

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const method = (options.method || 'GET').toUpperCase();
  const maxAttempts = method === 'GET' ? 2 : 1;
  let res: Response | null = null;
  let lastNetworkErr: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      res = await fetch(path, { ...options, headers });
      lastNetworkErr = null;
      break;
    } catch (err) {
      lastNetworkErr = err;
      if (attempt + 1 < maxAttempts) {
        await new Promise((r) => window.setTimeout(r, 350));
      }
    }
  }

  if (!res) {
    const detail =
      lastNetworkErr instanceof Error ? lastNetworkErr.message : '';
    throw new Error(
      detail && !detail.toLowerCase().includes('networkerror')
        ? detail
        : 'Unable to reach the VendorGuard server. Please check your connection and try again.'
    );
  }

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register(payload: {
    name: string;
    phone: string;
    password: string;
    marketLocation: string;
  }) {
    if (isNativeApp()) return localBackend.register(payload);
    return apiFetch<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(payload: { phone: string; password: string }) {
    if (isNativeApp()) return localBackend.login(payload);
    return apiFetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  me() {
    if (isNativeApp()) return localBackend.me();
    return apiFetch<{ user: User }>('/api/auth/me');
  },

  updateProfile(payload: {
    name?: string;
    phone?: string;
    marketLocation?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    if (isNativeApp()) return localBackend.updateProfile(payload);
    return apiFetch<{ user: User }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  logout() {
    if (isNativeApp()) return localBackend.logout();
    return apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  },

  getDashboard() {
    if (isNativeApp()) return localBackend.getDashboard();
    return apiFetch<DashboardSummary>('/api/dashboard');
  },

  verifyBanknote(payload: {
    denomination: BanknoteDenomination;
    checklist: BanknoteChecklist;
    serialPrefix: string;
    notes: string;
    imageEvidence?: string;
  }) {
    if (isNativeApp()) return localBackend.verifyBanknote(payload);
    return apiFetch<{ record: BanknoteCheckRecord }>(
      '/api/verifications/banknote',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  getMobileMoneySamples() {
    if (isNativeApp()) return localBackend.getMobileMoneySamples();
    return apiFetch<{ samples: MobileMoneySample[] }>(
      '/api/demo/mobile-money-samples'
    );
  },

  verifyMobileMoney(payload: {
    provider: MobileMoneyProvider;
    transactionRef: string;
    amount: string | number;
    senderPhone: string;
    senderName: string;
    smsText: string;
  }) {
    if (isNativeApp()) return localBackend.verifyMobileMoney(payload);
    return apiFetch<{ record: MobileMoneyCheckRecord }>(
      '/api/verifications/mobile-money',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  submitFraudReport(payload: {
    fraudType: string;
    description: string;
    transactionRef: string;
    amount: string | number | null;
    location: string;
    suspectPhone: string;
    evidenceImage?: string;
  }) {
    if (isNativeApp()) return localBackend.submitFraudReport(payload);
    return apiFetch<{ report: FraudReport }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getHistory() {
    if (isNativeApp()) return localBackend.getHistory();
    return apiFetch<{ history: HistoryItem[] }>('/api/history');
  },

  getAlerts() {
    if (isNativeApp()) return localBackend.getAlerts();
    return apiFetch<{ alerts: AlertItem[] }>('/api/alerts');
  },

  markAlertRead(id: string) {
    if (isNativeApp()) return localBackend.markAlertRead(id);
    return apiFetch<{ ok: boolean }>(`/api/alerts/${id}/read`, {
      method: 'POST',
    });
  },

  markAllAlertsRead() {
    if (isNativeApp()) return localBackend.markAllAlertsRead();
    return apiFetch<{ ok: boolean }>('/api/alerts/read-all', {
      method: 'POST',
    });
  },

  getAdminOverview() {
    if (isNativeApp()) return localBackend.getAdminOverview();
    return apiFetch<AdminOverview>('/api/admin/overview');
  },

  updateAdminReport(
    id: string,
    payload: { status: ReportStatus; reviewerNote: string }
  ) {
    if (isNativeApp()) return localBackend.updateAdminReport(id, payload);
    return apiFetch<{ report: FraudReport }>(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  publishAdminAlert(payload: {
    title: string;
    message: string;
    severity: AlertSeverity;
    marketScope: string;
  }) {
    if (isNativeApp()) return localBackend.publishAdminAlert(payload);
    return apiFetch<{ alert: AlertItem }>('/api/admin/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export function formatUgx(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return '—';
  }
  return `UGX ${amount.toLocaleString('en-UG')}`;
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-UG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
