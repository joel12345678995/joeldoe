import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Banknote,
  Bell,
  BookOpen,
  Clock,
  FileWarning,
  Home,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { ScreenId, User } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import emblemUrl from '../assets/images/vendorguard_emblem_1794513738359.jpg';

interface LayoutShellProps {
  user: User;
  activeScreen: ScreenId;
  canGoBack: boolean;
  unreadAlerts: number;
  onNavigate: (screen: ScreenId) => void;
  onBack: () => void;
  onLogout: () => void;
  children: ReactNode;
}

const SCREEN_TITLES: Record<ScreenId, string> = {
  dashboard: 'Dashboard',
  banknote: 'Banknote Verification',
  mobile_money: 'Mobile Money Check',
  report_fraud: 'Report Fraud',
  history: 'Activity History',
  alerts: 'Alerts & Notifications',
  education: 'Fraud Awareness',
  profile: 'Vendor Profile',
  admin: 'Administrator Console',
};

export function LayoutShell({
  user,
  activeScreen,
  canGoBack,
  unreadAlerts,
  onNavigate,
  onBack,
  onLogout,
  children,
}: LayoutShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const handleBackRequest = (e: Event) => {
      if (drawerOpen) {
        e.preventDefault();
        setDrawerOpen(false);
      }
    };
    window.addEventListener('vendorguard:back-request', handleBackRequest);
    return () =>
      window.removeEventListener('vendorguard:back-request', handleBackRequest);
  }, [drawerOpen]);

  const navItems: Array<{
    id: ScreenId;
    label: string;
    icon: typeof Home;
    badge?: number;
    adminOnly?: boolean;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'banknote', label: 'Banknote Check', icon: Banknote },
    { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
    { id: 'report_fraud', label: 'Report Fraud', icon: FileWarning },
    { id: 'history', label: 'History', icon: Clock },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: Bell,
      badge: unreadAlerts > 0 ? unreadAlerts : undefined,
    },
    { id: 'education', label: 'Fraud Education', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    {
      id: 'admin',
      label: 'Admin Console',
      icon: ShieldAlert,
      adminOnly: true,
    },
  ];

  const visibleNav = navItems.filter(
    (item) => !item.adminOnly || user.role === 'admin'
  );

  function go(id: ScreenId) {
    setDrawerOpen(false);
    onNavigate(id);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-950 text-slate-200 border-r border-slate-800 z-30">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            {!logoFailed ? (
              <img
                src={emblemUrl}
                alt="VendorGuard"
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            VendorGuard
          </span>
        </div>

        <nav
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
          aria-label="Main navigation"
        >
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold ${
                      active ? 'text-white' : 'text-amber-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 space-y-2.5">
          <div className="px-1">
            <div className="text-sm font-semibold text-white truncate">
              {user.name}
            </div>
            <div className="text-xs text-slate-400 truncate mt-0.5">
              {user.marketLocation}
            </div>
          </div>
          <PWAInstallButton variant="sidebar" />
          <button
            type="button"
            onClick={onLogout}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white text-sm font-medium flex items-center gap-2.5 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Compact Mobile Top Bar (48px) + Desktop Header (64px) */}
        <header className="sticky top-0 z-20 h-12 lg:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {canGoBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="min-h-[40px] min-w-[40px] sm:px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go('dashboard')}
                className="lg:hidden flex items-center justify-center shrink-0 min-h-[40px] min-w-[40px]"
                aria-label="VendorGuard Home"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </button>
            )}
            <h1 className="text-base lg:text-xl font-bold text-slate-900 truncate">
              {SCREEN_TITLES[activeScreen]}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="lg:hidden">
              <PWAInstallButton variant="compact" />
            </div>

            <button
              type="button"
              onClick={() => go('alerts')}
              aria-label={`View alerts (${unreadAlerts} unread)`}
              className="min-h-[42px] min-w-[42px] px-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts > 0 && (
                <span className="text-xs font-mono tabular-nums font-bold text-red-600">
                  {unreadAlerts}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => go('profile')}
              className="hidden sm:flex min-h-[42px] px-3 py-1.5 rounded-xl hover:bg-slate-100 items-center gap-2 text-sm font-medium text-slate-700 transition-colors"
            >
              <UserIcon className="w-4 h-4 text-slate-500" />
              <span className="max-w-[140px] truncate">{user.name}</span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8 pb-20 lg:pb-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Compact Mobile Bottom Navigation Bar (54px) */}
      <nav
        aria-label="Mobile thumb navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center"
      >
        {[
          { id: 'dashboard' as ScreenId, label: 'Home', icon: Home },
          { id: 'banknote' as ScreenId, label: 'Cash', icon: Banknote },
          { id: 'mobile_money' as ScreenId, label: 'MoMo', icon: Smartphone },
          { id: 'report_fraud' as ScreenId, label: 'Report', icon: FileWarning },
          { id: 'history' as ScreenId, label: 'History', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => go(tab.id)}
              className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold leading-none whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Full Menu Sheet */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900">VendorGuard Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="text-sm font-bold text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                {user.phone}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {user.marketLocation}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.id)}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between ${
                      active
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span className="text-xs font-mono tabular-nums font-bold text-red-600">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onLogout}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-100 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out &amp; Switch Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
