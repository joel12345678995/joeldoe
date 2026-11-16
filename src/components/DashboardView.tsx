import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  FileWarning,
  ShieldAlert,
  Smartphone,
  User as UserIcon,
} from 'lucide-react';
import { formatRelativeDate, formatUgx } from '../lib/api';
import type { DashboardSummary, ScreenId, User } from '../types';

interface DashboardViewProps {
  user: User;
  summary: DashboardSummary | null;
  loading: boolean;
  error: string;
  onNavigate: (screen: ScreenId) => void;
  onRetry: () => void;
  onSwitchAccount?: () => void;
}

export function DashboardView({
  user,
  summary,
  loading,
  error,
  onNavigate,
  onRetry,
  onSwitchAccount,
}: DashboardViewProps) {
  const stats = summary?.stats || {
    totalChecks: 0,
    suspiciousCount: 0,
    reportsCount: 0,
    unreadAlerts: 0,
  };

  const quickServices: Array<{
    id: ScreenId;
    title: string;
    desc: string;
    icon: typeof Banknote;
    tone: string;
  }> = [
    {
      id: 'banknote',
      title: 'Banknote Verification',
      desc: 'Inspect UGX notes using security checklists and camera capture.',
      icon: Banknote,
      tone: 'text-emerald-700 bg-emerald-50',
    },
    {
      id: 'mobile_money',
      title: 'Mobile Money Verification',
      desc: 'Check MTN MoMo and Airtel Money payment references & SMS.',
      icon: Smartphone,
      tone: 'text-slate-800 bg-slate-100',
    },
    {
      id: 'report_fraud',
      title: 'Report Fraud',
      desc: 'Log counterfeit cash, fake confirmations, or scam attempts.',
      icon: FileWarning,
      tone: 'text-red-700 bg-red-50',
    },
    {
      id: 'history',
      title: 'Transaction History',
      desc: 'Review past inspections, verifications, and report statuses.',
      icon: Clock,
      tone: 'text-slate-700 bg-slate-100',
    },
    {
      id: 'alerts',
      title: 'Alerts & Notifications',
      desc: 'Read market-wide warnings and updates on your submitted cases.',
      icon: Bell,
      tone: 'text-amber-700 bg-amber-50',
    },
    {
      id: 'education',
      title: 'Fraud Awareness',
      desc: 'Learn how to spot fake notes, spoofed SMS, and reversal scams.',
      icon: BookOpen,
      tone: 'text-emerald-700 bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Primary Action Panel */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className="font-semibold text-emerald-300">
              {user.marketLocation}
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-slate-300 font-mono tabular-nums">
              {user.phone}
            </span>
            {onSwitchAccount && (
              <>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <button
                  type="button"
                  onClick={onSwitchAccount}
                  className="text-slate-300 hover:text-white underline underline-offset-4 font-medium transition-colors"
                >
                  Switch Account
                </button>
              </>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
            Hello, {user.name}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Verify cash banknotes and Mobile Money confirmations before handing
            over goods to customers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('banknote')}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Banknote className="w-4 h-4 shrink-0" />
            <span>Check Banknote</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('mobile_money')}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Verify Mobile Money</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-4">
          <div className="text-sm text-red-800">{error}</div>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-red-700 text-white text-xs font-semibold shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4-Column Metric Strip */}
      <section
        aria-label="Vendor protection metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Total Verifications
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
            {loading ? '—' : stats.totalChecks}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Cash &amp; Mobile Money
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Suspicious Flags
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-red-700 mt-1.5">
            {loading ? '—' : stats.suspiciousCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Requires extra caution
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Reports Submitted
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1.5">
            {loading ? '—' : stats.reportsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Recorded for review
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Unread Alerts
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-700 mt-1.5">
            {loading ? '—' : stats.unreadAlerts}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Security &amp; case updates
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section aria-label="VendorGuard services" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Vendor Services</h3>
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Open Admin Console</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickServices.map((svc) => {
            const Icon = svc.icon;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => onNavigate(svc.id)}
                className="bg-white border border-slate-200 hover:border-emerald-600/50 rounded-2xl p-5 text-left flex flex-col justify-between gap-4 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${svc.tone}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors mt-1" />
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900">
                    {svc.title}
                  </div>
                  <p className="text-sm text-slate-600 mt-1 leading-snug">
                    {svc.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Activities & Security Alerts Split */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Recent Activity
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="min-h-[36px] text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
            >
              View All History
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-sm text-slate-500">
              Loading recent checks...
            </div>
          ) : !summary || summary.recentHistory.length === 0 ? (
            <div className="py-8 text-sm text-slate-500">
              No verification checks or fraud reports recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {summary.recentHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate('history')}
                  className="w-full py-3.5 text-left flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors rounded-lg px-1"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {item.subtitle}
                      <span aria-hidden="true" className="mx-1.5">
                        ·
                      </span>
                      <span className="tabular-nums">
                        {formatRelativeDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold font-mono tabular-nums text-slate-900">
                      {formatUgx(item.amount)}
                    </div>
                    <div
                      className={`text-xs font-semibold mt-0.5 flex items-center justify-end gap-1 ${
                        item.statusTone === 'verified'
                          ? 'text-emerald-700'
                          : item.statusTone === 'danger'
                            ? 'text-red-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {item.statusTone === 'verified' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{item.statusLabel}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Important Security Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Important Security Alerts
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('alerts')}
              className="min-h-[36px] text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
            >
              All Alerts
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-sm text-slate-500">
              Loading security alerts...
            </div>
          ) : !summary || summary.topAlerts.length === 0 ? (
            <div className="py-8 text-sm text-slate-500">
              No active security alerts at this moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {summary.topAlerts.map((alert) => {
                const isUnread = !alert.readBy.includes(user.id);
                return (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() => onNavigate('alerts')}
                    className="w-full py-3.5 text-left space-y-1 hover:bg-slate-50/70 transition-colors rounded-lg px-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold flex items-center gap-1.5 ${
                          alert.severity === 'critical'
                            ? 'text-red-700'
                            : alert.severity === 'warning'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{alert.category}</span>
                        {isUnread && (
                          <span className="text-slate-900 font-semibold">
                            · Unread
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {formatRelativeDate(alert.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {alert.title}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {alert.message}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
