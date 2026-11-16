import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  HelpCircle,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { api, formatUgx } from '../lib/api';
import type {
  MobileMoneyCheckRecord,
  MobileMoneyProvider,
  MobileMoneySample,
  ReportPrefill,
} from '../types';

interface MobileMoneyVerifyViewProps {
  onRecorded: () => void;
  onReportSuspicious: (prefill: ReportPrefill) => void;
}

export function MobileMoneyVerifyView({
  onRecorded,
  onReportSuspicious,
}: MobileMoneyVerifyViewProps) {
  const [provider, setProvider] =
    useState<MobileMoneyProvider>('MTN Mobile Money');
  const [transactionRef, setTransactionRef] = useState('');
  const [amount, setAmount] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [smsText, setSmsText] = useState('');
  const [samples, setSamples] = useState<MobileMoneySample[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<MobileMoneyCheckRecord | null>(null);

  useEffect(() => {
    api
      .getMobileMoneySamples()
      .then((res) => setSamples(res.samples))
      .catch(() => {});
  }, []);

  function applySample(sample: MobileMoneySample) {
    setProvider(sample.provider);
    setTransactionRef(sample.transactionRef);
    setAmount(sample.amount);
    setSenderPhone(sample.senderPhone);
    setSenderName(sample.senderName);
    setSmsText(sample.smsText);
    setError('');
    setResult(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.verifyMobileMoney({
        provider,
        transactionRef,
        amount,
        senderPhone,
        senderName,
        smsText,
      });
      setResult(res.record);
      onRecorded();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to verify mobile money details.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Verification Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Verify Mobile Money Payment
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Enter transaction details from the customer&apos;s confirmation to
            check against the demonstration ledger and SMS scam patterns.
          </p>
        </div>

        {/* Sample quick-fill controls */}
        {samples.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500">
              Test Demonstration Scenarios
            </div>
            <div className="flex flex-wrap gap-2">
              {samples.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => applySample(s)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Provider Selector */}
        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">
            Mobile Money Provider
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {(
              ['MTN Mobile Money', 'Airtel Money'] as MobileMoneyProvider[]
            ).map((p) => {
              const active = provider === p;
              const isMtn = p === 'MTN Mobile Money';
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`min-h-[48px] px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isMtn ? 'bg-amber-400' : 'bg-red-600'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="mm-ref"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Transaction Reference / ID
            </label>
            <input
              id="mm-ref"
              type="text"
              required
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. MTN-88492014"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label
              htmlFor="mm-amount"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Amount (UGX)
            </label>
            <input
              id="mm-amount"
              type="number"
              min="100"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 45000"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="mm-phone"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Sender Phone Number (Optional)
            </label>
            <input
              id="mm-phone"
              type="tel"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="e.g. 0774819203"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label
              htmlFor="mm-name"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Sender Name (Optional)
            </label>
            <input
              id="mm-name"
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Grace Achieng"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="mm-sms"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Confirmation SMS Text (Optional — Paste to Scan for Spoofing)
          </label>
          <textarea
            id="mm-sms"
            rows={3}
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            placeholder="Paste the payment confirmation message shown by the customer..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
        >
          {submitting
            ? 'Checking Transaction...'
            : 'Verify Mobile Money Payment'}
        </button>
      </form>

      {/* Right Result & Official Channel Advisory */}
      <div className="lg:col-span-5 space-y-5">
        {result && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              {result.outcome === 'verified_demo' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0" />
              ) : result.outcome === 'suspicious' ? (
                <ShieldAlert className="w-7 h-7 text-red-600 shrink-0" />
              ) : (
                <HelpCircle className="w-7 h-7 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-semibold text-slate-500 font-mono tabular-nums">
                  {result.provider} · {result.transactionRef} ·{' '}
                  {formatUgx(result.amount)}
                </div>
                <h3
                  className={`text-lg font-bold mt-0.5 ${
                    result.outcome === 'verified_demo'
                      ? 'text-emerald-800'
                      : result.outcome === 'suspicious'
                        ? 'text-red-800'
                        : 'text-amber-800'
                  }`}
                >
                  {result.outcome === 'verified_demo'
                    ? 'Verified in the demonstration environment'
                    : result.outcome === 'suspicious'
                      ? 'Suspicious transaction'
                      : 'Unable to verify'}
                </h3>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
              {result.findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1" aria-hidden="true">
                    ·
                  </span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>

            {result.outcome !== 'verified_demo' && (
              <button
                type="button"
                onClick={() =>
                  onReportSuspicious({
                    fraudType: 'Fake Mobile Money SMS',
                    transactionRef: result.transactionRef,
                    amount: String(result.amount),
                    description: `${result.provider} payment check flagged as ${result.outcome === 'suspicious' ? 'suspicious' : 'unverified'}. ${result.findings.join(' ')}`,
                  })
                }
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <FileWarning className="w-4 h-4" />
                <span>Report Suspicious Mobile Money Activity</span>
              </button>
            )}
          </div>
        )}

        {/* Mandatory Official Channel Verification Advisory */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Confirm Funds Before Releasing Goods</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
            Never hand over stock based solely on a customer&apos;s phone screen
            or a forwarded SMS. Always confirm that the money actually arrived
            in your own Mobile Money wallet through official provider channels:
          </p>
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-white border border-amber-200">
              <div className="text-xs font-bold text-slate-900">
                MTN MoMo Check
              </div>
              <div className="text-sm font-mono font-bold text-slate-900 mt-1">
                *165#
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                My Account · Balance
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-amber-200">
              <div className="text-xs font-bold text-slate-900">
                Airtel Money Check
              </div>
              <div className="text-sm font-mono font-bold text-slate-900 mt-1">
                *185#
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Check Balance / Mini Statement
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-amber-900/80 pt-1">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Demo ledger includes valid IDs{' '}
              <span className="font-mono font-semibold">MTN-88492014</span>,{' '}
              <span className="font-mono font-semibold">AIR-55210944</span> and
              flagged IDs{' '}
              <span className="font-mono font-semibold">MTN-00019283</span>,{' '}
              <span className="font-mono font-semibold">AIR-99812004</span>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
