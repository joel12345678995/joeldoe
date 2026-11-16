import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileWarning,
  Search,
  Smartphone,
  X,
} from 'lucide-react';
import { formatRelativeDate, formatUgx } from '../lib/api';
import type {
  BanknoteCheckRecord,
  FraudReport,
  HistoryItem,
  MobileMoneyCheckRecord,
} from '../types';

interface HistoryViewProps {
  items: HistoryItem[];
  loading: boolean;
}

type HistoryFilter = 'all' | 'banknote' | 'mobile_money' | 'fraud_report';

export function HistoryView({ items, loading }: HistoryViewProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const handleBack = (e: Event) => {
      if (selected) {
        e.preventDefault();
        setSelected(null);
      }
    };
    window.addEventListener('vendorguard:back-request', handleBack);
    return () =>
      window.removeEventListener('vendorguard:back-request', handleBack);
  }, [selected]);

  const filtered = items.filter((item) => {
    if (filter !== 'all' && item.kind !== filter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.statusLabel.toLowerCase().includes(q)
    );
  });

  function renderIcon(kind: HistoryItem['kind']) {
    if (kind === 'banknote') return <Banknote className="w-4 h-4" />;
    if (kind === 'mobile_money') return <Smartphone className="w-4 h-4" />;
    return <FileWarning className="w-4 h-4" />;
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Transaction &amp; Report History
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Review all banknote checks, mobile money verifications, and
              submitted fraud reports.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ref, note, or status..."
              aria-label="Search history"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Activity' },
              { id: 'banknote', label: 'Banknotes' },
              { id: 'mobile_money', label: 'Mobile Money' },
              { id: 'fraud_report', label: 'Fraud Reports' },
            ] as Array<{ id: HistoryFilter; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-sm text-slate-500 text-center">
          Loading activity history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="text-base font-semibold text-slate-800">
            No matching records found
          </div>
          <p className="text-sm text-slate-500">
            Completed banknote inspections, mobile money checks, and fraud
            reports appear here automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="w-full p-4 sm:p-5 text-left hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    item.kind === 'banknote'
                      ? 'bg-emerald-50 text-emerald-700'
                      : item.kind === 'mobile_money'
                        ? 'bg-slate-100 text-slate-800'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  {renderIcon(item.kind)}
                </div>

                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
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
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-bold font-mono tabular-nums text-slate-900">
                    {formatUgx(item.amount)}
                  </div>
                  <div
                    className={`text-xs font-semibold mt-0.5 flex items-center justify-end gap-1 ${
                      item.statusTone === 'verified'
                        ? 'text-emerald-700'
                        : item.statusTone === 'danger'
                          ? 'text-red-700'
                          : item.statusTone === 'warning'
                            ? 'text-amber-700'
                            : 'text-slate-600'
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
                <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Record Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 tabular-nums">
                  {formatRelativeDate(selected.createdAt)}
                </div>
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {selected.title}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close details"
                onClick={() => setSelected(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">Status</span>
                  <span className="font-semibold text-slate-900">
                    {selected.statusLabel}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Amount</span>
                  <span className="font-semibold font-mono tabular-nums text-slate-900">
                    {formatUgx(selected.amount)}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">
                  Summary &amp; Description
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {selected.description}
                </p>
              </div>

              {selected.kind === 'banknote' && (
                <DetailBanknote
                  record={selected.raw as BanknoteCheckRecord}
                />
              )}
              {selected.kind === 'mobile_money' && (
                <DetailMobileMoney
                  record={selected.raw as MobileMoneyCheckRecord}
                />
              )}
              {selected.kind === 'fraud_report' && (
                <DetailFraudReport record={selected.raw as FraudReport} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailBanknote({ record }: { record: BanknoteCheckRecord }) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-500">
        Physical Checklist Results
      </div>
      <div className="grid grid-cols-1 gap-1.5 text-xs">
        {[
          ['Crested Crane Watermark', record.checklist.watermarkVisible],
          ['Windowed Security Thread', record.checklist.securityThreadIntact],
          ['Raised Intaglio Print', record.checklist.raisedPrintFelt],
          ['Color-Shifting Foil', record.checklist.colorShiftFoilObserved],
          ['Crisp Cotton Paper', record.checklist.paperQualityCrisp],
        ].map(([label, ok]) => (
          <div
            key={String(label)}
            className="flex items-center justify-between py-1.5 border-b border-slate-100"
          >
            <span className="text-slate-700">{label}</span>
            <span
              className={`font-semibold ${
                ok ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {ok ? 'Confirmed' : 'Not Confirmed'}
            </span>
          </div>
        ))}
      </div>
      {record.imageEvidence && (
        <img
          src={record.imageEvidence}
          alt="Banknote inspection attachment"
          className="w-full max-h-56 object-contain rounded-xl bg-slate-950 border border-slate-200"
        />
      )}
    </div>
  );
}

function DetailMobileMoney({ record }: { record: MobileMoneyCheckRecord }) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-600 space-y-1">
        <div>
          <span className="font-semibold text-slate-800">Reference:</span>{' '}
          <span className="font-mono">{record.transactionRef}</span>
        </div>
        {record.senderPhone && (
          <div>
            <span className="font-semibold text-slate-800">Sender Phone:</span>{' '}
            <span className="font-mono tabular-nums">{record.senderPhone}</span>
          </div>
        )}
        {record.senderName && (
          <div>
            <span className="font-semibold text-slate-800">Sender Name:</span>{' '}
            {record.senderName}
          </div>
        )}
      </div>
      {record.smsText && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap">
          {record.smsText}
        </div>
      )}
    </div>
  );
}

function DetailFraudReport({ record }: { record: FraudReport }) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-600 space-y-1">
        <div>
          <span className="font-semibold text-slate-800">Case Number:</span>{' '}
          <span className="font-mono">{record.caseNumber}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-800">Location:</span>{' '}
          {record.location}
        </div>
        {record.suspectPhone && (
          <div>
            <span className="font-semibold text-slate-800">Suspect Phone:</span>{' '}
            <span className="font-mono tabular-nums">{record.suspectPhone}</span>
          </div>
        )}
      </div>

      {record.reviewerNote && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          <div className="font-bold mb-1">
            Administrator Review Note ({record.reviewedBy || 'Security Desk'})
          </div>
          <p>{record.reviewerNote}</p>
        </div>
      )}

      {record.evidenceImage && (
        <img
          src={record.evidenceImage}
          alt="Fraud report evidence attachment"
          className="w-full max-h-56 object-contain rounded-xl bg-slate-950 border border-slate-200"
        />
      )}
    </div>
  );
}
