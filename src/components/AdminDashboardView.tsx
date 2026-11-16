import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Megaphone,
  ShieldAlert,
} from 'lucide-react';
import { api, formatRelativeDate, formatUgx } from '../lib/api';
import type {
  AdminOverview,
  AlertSeverity,
  FraudReport,
  ReportStatus,
} from '../types';

interface AdminDashboardViewProps {
  onAlertsChanged: () => void;
}

const REPORT_STATUSES: ReportStatus[] = [
  'Pending Review',
  'Under Investigation',
  'Confirmed Fraud',
  'Dismissed',
];

export function AdminDashboardView({
  onAlertsChanged,
}: AdminDashboardViewProps) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ReportStatus>('All');
  const [selectedReport, setSelectedReport] = useState<FraudReport | null>(
    null
  );
  const [editStatus, setEditStatus] = useState<ReportStatus>('Pending Review');
  const [reviewerNote, setReviewerNote] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  // Broadcast Alert state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>('warning');
  const [alertMarket, setAlertMarket] = useState('All Ugandan Markets');
  const [publishingAlert, setPublishingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');

  async function loadOverview() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAdminOverview();
      setOverview(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load administrator overview.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    const handleBack = (e: Event) => {
      if (selectedReport) {
        e.preventDefault();
        setSelectedReport(null);
      }
    };
    window.addEventListener('vendorguard:back-request', handleBack);
    return () =>
      window.removeEventListener('vendorguard:back-request', handleBack);
  }, [selectedReport]);

  function openReport(report: FraudReport) {
    setSelectedReport(report);
    setEditStatus(report.status);
    setReviewerNote(report.reviewerNote || '');
  }

  async function handleSaveReport(e: FormEvent) {
    e.preventDefault();
    if (!selectedReport) return;
    setSavingReport(true);
    try {
      await api.updateAdminReport(selectedReport.id, {
        status: editStatus,
        reviewerNote,
      });
      setSelectedReport(null);
      await loadOverview();
      onAlertsChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update report status.'
      );
    } finally {
      setSavingReport(false);
    }
  }

  async function handlePublishAlert(e: FormEvent) {
    e.preventDefault();
    setAlertSuccess('');
    setPublishingAlert(true);
    try {
      await api.publishAdminAlert({
        title: alertTitle,
        message: alertMessage,
        severity: alertSeverity,
        marketScope: alertMarket,
      });
      setAlertTitle('');
      setAlertMessage('');
      setAlertSuccess('Security advisory published to all vendors.');
      await loadOverview();
      onAlertsChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to publish security alert.'
      );
    } finally {
      setPublishingAlert(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
        Loading administrator console...
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-800">
        {error}
      </div>
    );
  }

  const reports = (overview?.reports || []).filter((r) =>
    statusFilter === 'All' ? true : r.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Platform Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Registered Vendors
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {overview?.metrics.totalVendors ?? 0}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Platform Verifications
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {overview?.metrics.totalVerifications ?? 0}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Suspicious Detections
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-red-700 mt-1">
            {overview?.metrics.suspiciousFlags ?? 0}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs font-medium text-slate-500">
            Open Fraud Reports
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {overview?.metrics.openReports ?? 0}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Submitted Fraud Reports Queue */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-slate-800" />
              <h2 className="text-lg font-bold text-slate-900">
                Submitted Fraud Reports
              </h2>
            </div>

            <select
              aria-label="Filter fraud reports by status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'All' | ReportStatus)
              }
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="All">All Statuses</option>
              {REPORT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {reports.length === 0 ? (
            <div className="py-8 text-sm text-slate-500 text-center">
              No fraud reports match the selected filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-900">
                        {rep.caseNumber}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-semibold text-slate-700">
                        {rep.fraudType}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span
                        className={`font-bold ${
                          rep.status === 'Confirmed Fraud'
                            ? 'text-red-700'
                            : rep.status === 'Dismissed'
                              ? 'text-slate-500'
                              : 'text-amber-700'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {rep.description}
                    </p>
                    <div className="text-xs text-slate-500">
                      Vendor: {rep.userName} ({rep.userPhone}) · {rep.location} ·{' '}
                      <span className="font-mono tabular-nums">
                        {formatUgx(rep.amount)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openReport(rep)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 shrink-0 self-start"
                  >
                    Review Incident
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Publish Security Advisory */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Publish Market Security Alert
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Broadcast verified fraud warnings and counterfeit serial alerts to
            all registered market vendors.
          </p>

          <form onSubmit={handlePublishAlert} className="space-y-3.5">
            <div>
              <label
                htmlFor="adm-alert-title"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Alert Headline
              </label>
              <input
                id="adm-alert-title"
                type="text"
                required
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="e.g. Fake UGX 50,000 Notes Reported in Kikuubo"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="adm-alert-sev"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Severity
                </label>
                <select
                  id="adm-alert-sev"
                  value={alertSeverity}
                  onChange={(e) =>
                    setAlertSeverity(e.target.value as AlertSeverity)
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Advisory Info</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="adm-alert-scope"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Market Scope
                </label>
                <input
                  id="adm-alert-scope"
                  type="text"
                  value={alertMarket}
                  onChange={(e) => setAlertMarket(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="adm-alert-msg"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Advisory Details
              </label>
              <textarea
                id="adm-alert-msg"
                rows={3}
                required
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Explain what vendors should watch out for and how to verify safely..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {alertSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{alertSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={publishingAlert}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {publishingAlert ? 'Broadcasting...' : 'Broadcast Security Alert'}
            </button>
          </form>
        </section>
      </div>

      {/* Recent Platform Verifications Table */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Recent Verification Monitoring
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-bold text-slate-500 mb-2">
              Mobile Money Verifications
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {(overview?.recentMobileMoneyChecks || []).map((m) => (
                <div
                  key={m.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {m.provider} ·{' '}
                      <span className="font-mono">{m.transactionRef}</span>
                    </div>
                    <div className="text-slate-500">
                      {m.userName} · {formatRelativeDate(m.createdAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono tabular-nums font-semibold text-slate-900">
                      {formatUgx(m.amount)}
                    </div>
                    <div
                      className={`font-semibold ${
                        m.outcome === 'verified_demo'
                          ? 'text-emerald-700'
                          : m.outcome === 'suspicious'
                            ? 'text-red-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {m.outcome === 'verified_demo'
                        ? 'Verified Demo'
                        : m.outcome === 'suspicious'
                          ? 'Suspicious'
                          : 'Unverified'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-500 mb-2">
              Banknote Inspections
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {(overview?.recentBanknoteChecks || []).map((b) => (
                <div
                  key={b.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      UGX {b.denomination.toLocaleString()} Note{' '}
                      {b.serialPrefix ? `(${b.serialPrefix})` : ''}
                    </div>
                    <div className="text-slate-500">
                      {b.userName} · {formatRelativeDate(b.createdAt)}
                    </div>
                  </div>
                  <div
                    className={`font-semibold shrink-0 flex items-center gap-1 ${
                      b.outcome === 'verified_checklist'
                        ? 'text-emerald-700'
                        : b.outcome === 'suspicious_indicators'
                          ? 'text-red-700'
                          : 'text-amber-700'
                    }`}
                  >
                    {b.outcome !== 'verified_checklist' && (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {b.outcome === 'verified_checklist'
                        ? 'Confirmed'
                        : b.outcome === 'suspicious_indicators'
                          ? 'Suspicious'
                          : 'Needs Check'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Review Report Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedReport(null)}
        >
          <form
            onSubmit={handleSaveReport}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div>
              <div className="text-xs font-mono font-bold text-slate-500">
                {selectedReport.caseNumber} · {selectedReport.fraudType}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Review Fraud Report
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <p className="text-sm text-slate-900">
                {selectedReport.description}
              </p>
              <div>
                Reported by: {selectedReport.userName} (
                {selectedReport.userPhone})
              </div>
              <div>
                Location: {selectedReport.location} · Amount:{' '}
                <span className="font-mono tabular-nums">
                  {formatUgx(selectedReport.amount)}
                </span>
              </div>
              {selectedReport.transactionRef && (
                <div>
                  Reference:{' '}
                  <span className="font-mono">
                    {selectedReport.transactionRef}
                  </span>
                </div>
              )}
            </div>

            {selectedReport.evidenceImage && (
              <img
                src={selectedReport.evidenceImage}
                alt="Submitted fraud evidence"
                className="w-full max-h-52 object-contain rounded-xl bg-slate-950 border border-slate-200"
              />
            )}

            <div>
              <label
                htmlFor="rev-status"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Investigation Status
              </label>
              <select
                id="rev-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ReportStatus)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
              >
                {REPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="rev-note"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Administrator Note (Sent to Vendor)
              </label>
              <textarea
                id="rev-note"
                rows={3}
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Provide guidance or investigation update for the vendor..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingReport}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold"
              >
                {savingReport ? 'Saving...' : 'Save Review'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
