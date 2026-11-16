import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AlertsView } from './components/AlertsView';
import { AuthScreen } from './components/AuthScreen';
import { BanknoteVerifyView } from './components/BanknoteVerifyView';
import { DashboardView } from './components/DashboardView';
import { EducationView } from './components/EducationView';
import { FraudReportView } from './components/FraudReportView';
import { HistoryView } from './components/HistoryView';
import { LayoutShell } from './components/LayoutShell';
import { MobileMoneyVerifyView } from './components/MobileMoneyVerifyView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProfileView } from './components/ProfileView';
import { SplashScreen } from './components/SplashScreen';
import { api, getStoredToken, setStoredToken } from './lib/api';
import type {
  AlertItem,
  DashboardSummary,
  HistoryItem,
  ReportPrefill,
  ScreenId,
  User,
} from './types';

declare global {
  interface Window {
    __VG_HANDLE_BACK?: () => 'handled' | 'exit';
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [navStack, setNavStack] = useState<ScreenId[]>(['dashboard']);

  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [reportPrefill, setReportPrefill] = useState<ReportPrefill | null>(
    null
  );

  const activeScreen = navStack[navStack.length - 1] || 'dashboard';
  const navStackRef = useRef<ScreenId[]>(navStack);
  navStackRef.current = navStack;

  // Check active session token on mount
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    api
      .me()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  const refreshAllData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setDataError('');
    try {
      const [dashRes, histRes, alertRes] = await Promise.all([
        api.getDashboard(),
        api.getHistory(),
        api.getAlerts(),
      ]);
      setDashboard(dashRes);
      setHistory(histRes.history);
      setAlerts(alertRes.alerts);
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : 'Unable to load dashboard data.'
      );
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user, refreshAllData]);

  // Seed initial browser history state when authenticated
  useEffect(() => {
    if (!user) return;
    window.history.replaceState({ vgIndex: 0, vgScreen: 'dashboard' }, '');
  }, [user]);

  const navigateTo = useCallback((screen: ScreenId) => {
    setNavStack((prev) => {
      const current = prev[prev.length - 1];
      if (current === screen) return prev;
      const next =
        screen === 'dashboard' ? (['dashboard'] as ScreenId[]) : [...prev, screen];
      try {
        window.history.pushState(
          { vgIndex: next.length - 1, vgScreen: screen },
          ''
        );
      } catch {
        // ignore history errors in restricted frames
      }
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback((): boolean => {
    // Allow open modals or drawers to intercept Back first
    const backEvt = new CustomEvent('vendorguard:back-request', {
      cancelable: true,
    });
    const notCancelled = window.dispatchEvent(backEvt);
    if (!notCancelled) {
      return true;
    }

    const currentStack = navStackRef.current;
    if (currentStack.length > 1) {
      setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    return false;
  }, []);

  // Listen for browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // First close any open modal/drawer without navigating away if possible
      const backEvt = new CustomEvent('vendorguard:back-request', {
        cancelable: true,
      });
      const notCancelled = window.dispatchEvent(backEvt);
      if (!notCancelled) {
        return;
      }

      const state = event.state as { vgScreen?: ScreenId } | null;
      if (state?.vgScreen) {
        setNavStack((prev) => {
          if (state.vgScreen === 'dashboard') return ['dashboard'];
          const idx = prev.lastIndexOf(state.vgScreen!);
          if (idx >= 0) return prev.slice(0, idx + 1);
          return [...prev, state.vgScreen!];
        });
      } else {
        setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : ['dashboard']));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Expose back handler for Android native MainActivity hardware Back button
  useEffect(() => {
    window.__VG_HANDLE_BACK = () => {
      if (!user) {
        const backEvt = new CustomEvent('vendorguard:back-request', {
          cancelable: true,
        });
        const notCancelled = window.dispatchEvent(backEvt);
        return notCancelled ? 'exit' : 'handled';
      }
      return goBack() ? 'handled' : 'exit';
    };
    return () => {
      delete window.__VG_HANDLE_BACK;
    };
  }, [user, goBack]);

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
  }, []);

  function handleAuthenticated(authenticatedUser: User) {
    setUser(authenticatedUser);
    setNavStack(['dashboard']);
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
    setDashboard(null);
    setHistory([]);
    setAlerts([]);
    setNavStack(['dashboard']);
  }

  function handleReportSuspicious(prefill: ReportPrefill) {
    setReportPrefill(prefill);
    navigateTo('report_fraud');
  }

  const clearPrefill = useCallback(() => {
    setReportPrefill(null);
  }, []);

  if (showSplash) {
    return <SplashScreen onContinue={handleSplashDone} />;
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-600">
        Loading VendorGuard...
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const unreadAlerts = alerts.filter(
    (a) => !a.readBy.includes(user.id)
  ).length;

  return (
    <LayoutShell
      user={user}
      activeScreen={activeScreen}
      canGoBack={navStack.length > 1 || activeScreen !== 'dashboard'}
      unreadAlerts={unreadAlerts}
      onNavigate={navigateTo}
      onBack={() => {
        if (!goBack() && activeScreen !== 'dashboard') {
          navigateTo('dashboard');
        }
      }}
      onLogout={handleLogout}
    >
      {activeScreen === 'dashboard' && (
        <DashboardView
          user={user}
          summary={dashboard}
          loading={dataLoading}
          error={dataError}
          onNavigate={navigateTo}
          onRetry={refreshAllData}
          onSwitchAccount={handleLogout}
        />
      )}

      {activeScreen === 'banknote' && (
        <BanknoteVerifyView
          onRecorded={refreshAllData}
          onReportSuspicious={handleReportSuspicious}
        />
      )}

      {activeScreen === 'mobile_money' && (
        <MobileMoneyVerifyView
          onRecorded={refreshAllData}
          onReportSuspicious={handleReportSuspicious}
        />
      )}

      {activeScreen === 'report_fraud' && (
        <FraudReportView
          user={user}
          prefill={reportPrefill}
          onClearPrefill={clearPrefill}
          onSubmitted={refreshAllData}
          onViewHistory={() => navigateTo('history')}
        />
      )}

      {activeScreen === 'history' && (
        <HistoryView items={history} loading={dataLoading} />
      )}

      {activeScreen === 'alerts' && (
        <AlertsView
          user={user}
          alerts={alerts}
          loading={dataLoading}
          onChanged={refreshAllData}
        />
      )}

      {activeScreen === 'education' && <EducationView />}

      {activeScreen === 'profile' && (
        <ProfileView
          user={user}
          onUserUpdated={setUser}
          onLogout={handleLogout}
        />
      )}

      {activeScreen === 'admin' && user.role === 'admin' && (
        <AdminDashboardView onAlertsChanged={refreshAllData} />
      )}
      <OfflineIndicator />
    </LayoutShell>
  );
}
