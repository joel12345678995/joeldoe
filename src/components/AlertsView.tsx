import { useState } from 'react';
import { AlertTriangle, Bell, Check, Info, ShieldAlert } from 'lucide-react';
import { api, formatRelativeDate } from '../lib/api';
import type { AlertCategory, AlertItem, User } from '../types';

interface AlertsViewProps {
  user: User;
  alerts: AlertItem[];
  loading: boolean;
  onChanged: () => void;
}

type FilterOption = 'All' | 'Unread' | AlertCategory;

export function AlertsView({
  user,
  alerts,
  loading,
  onChanged,
}: AlertsViewProps) {
  const [filter, setFilter] = useState<FilterOption>('All');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const unreadCount = alerts.filter(
    (a) => !a.readBy.includes(user.id)
  ).length;

  const filtered = alerts.filter((a) => {
    if (filter === 'Unread') return !a.readBy.includes(user.id);
    if (filter === 'All') return true;
    return a.category === filter;
  });

  async function markRead(id: string) {
    setBusyId(id);
    setActionError('');
    try {
      await api.markAlertRead(id);
      onChanged();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to mark alert as read.'
      );
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    setBusyId('all');
    setActionError('');
    try {
      await api.markAllAlertsRead();
      onChanged();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to mark alerts as read.'
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Security Alerts &amp; Notifications
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Stay updated on counterfeit warnings, flagged transactions, and
            report status updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            disabled={busyId === 'all'}
            onClick={markAllRead}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold flex items-center justify-center gap-2 shrink-0 whitespace-nowrap transition-colors"
          >
            <Check className="w-4 h-4 text-emerald-700" />
            <span>Mark All Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          {actionError}
        </div>
      )}

      {/* Interactive Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
        {(
          [
            'All',
            'Unread',
            'Security Advisory',
            'Activity Alert',
            'Report Update',
          ] as FilterOption[]
        ).map((tab) => {
          const active = filter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-sm text-slate-500 text-center">
          Loading alerts...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="text-base font-semibold text-slate-800">
            No alerts in this view
          </div>
          <p className="text-sm text-slate-500">
            New market advisories and report updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const isUnread = !alert.readBy.includes(user.id);
            return (
              <article
                key={alert.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  isUnread
                    ? 'bg-white border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          alert.severity === 'critical'
                            ? 'text-red-700'
                            : alert.severity === 'warning'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                        }`}
                      >
                        {alert.severity === 'critical' ? (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        ) : alert.severity === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <Info className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {alert.severity === 'critical'
                            ? 'Critical'
                            : alert.severity === 'warning'
                              ? 'Caution'
                              : 'Update'}
                        </span>
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-600 font-medium">
                        {alert.category}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-500">{alert.marketScope}</span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {formatRelativeDate(alert.createdAt)}
                      </span>
                      {isUnread && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="font-bold text-emerald-700">
                            Unread
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {alert.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      disabled={busyId === alert.id}
                      onClick={() => markRead(alert.id)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shrink-0 self-start transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
