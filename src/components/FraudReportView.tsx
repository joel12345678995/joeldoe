import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  CheckCircle2,
  Clock,
  FileWarning,
  Upload,
  X,
} from 'lucide-react';
import { api, formatUgx } from '../lib/api';
import { compressImageFile } from '../lib/imageUtils';
import type { FraudReport, FraudType, ReportPrefill, User } from '../types';

interface FraudReportViewProps {
  user: User;
  prefill: ReportPrefill | null;
  onClearPrefill: () => void;
  onSubmitted: () => void;
  onViewHistory: () => void;
}

const FRAUD_TYPES: FraudType[] = [
  'Counterfeit Banknote',
  'Fake Mobile Money SMS',
  'Payment Reversal Scam',
  'Agent Impersonation',
  'Other Financial Fraud',
];

export function FraudReportView({
  user,
  prefill,
  onClearPrefill,
  onSubmitted,
  onViewHistory,
}: FraudReportViewProps) {
  const [fraudType, setFraudType] = useState<FraudType>(
    prefill?.fraudType || 'Counterfeit Banknote'
  );
  const [description, setDescription] = useState(prefill?.description || '');
  const [transactionRef, setTransactionRef] = useState(
    prefill?.transactionRef || ''
  );
  const [amount, setAmount] = useState(prefill?.amount || '');
  const [location, setLocation] = useState(user.marketLocation || '');
  const [suspectPhone, setSuspectPhone] = useState('');
  const [evidenceImage, setEvidenceImage] = useState(
    prefill?.evidenceImage || ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedReport, setSubmittedReport] = useState<FraudReport | null>(
    null
  );

  useEffect(() => {
    if (prefill) {
      if (prefill.fraudType) setFraudType(prefill.fraudType);
      if (prefill.description) setDescription(prefill.description);
      if (prefill.transactionRef) setTransactionRef(prefill.transactionRef);
      if (prefill.amount) setAmount(prefill.amount);
      if (prefill.evidenceImage) setEvidenceImage(prefill.evidenceImage);
      onClearPrefill();
    }
  }, [prefill, onClearPrefill]);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setError('Evidence image must be smaller than 12 MB.');
      return;
    }
    try {
      const compressed = await compressImageFile(file);
      setEvidenceImage(compressed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to process image.'
      );
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.submitFraudReport({
        fraudType,
        description,
        transactionRef,
        amount: amount || null,
        location,
        suspectPhone,
        evidenceImage: evidenceImage || undefined,
      });
      setSubmittedReport(res.report);
      onSubmitted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to submit fraud report.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForNew() {
    setSubmittedReport(null);
    setDescription('');
    setTransactionRef('');
    setAmount('');
    setSuspectPhone('');
    setEvidenceImage('');
    setError('');
  }

  if (submittedReport) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-700 shrink-0" />
          <div>
            <div className="text-xs font-mono font-semibold text-slate-500">
              Case Reference {submittedReport.caseNumber}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Fraud Report Submitted &amp; Stored
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Your report has been saved to your VendorGuard history and queued for
          review by market security administrators. You will receive an alert
          when the investigation status is updated.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Fraud Type</span>
            <span className="font-semibold text-slate-900">
              {submittedReport.fraudType}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Amount Involved</span>
            <span className="font-semibold font-mono tabular-nums text-slate-900">
              {formatUgx(submittedReport.amount)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Location</span>
            <span className="font-semibold text-slate-900">
              {submittedReport.location}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Current Status</span>
            <span className="font-semibold text-amber-700">
              {submittedReport.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onViewHistory}
            className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>View in Activity History</span>
          </button>
          <button
            type="button"
            onClick={resetForNew}
            className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-5"
      >
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
            <FileWarning className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Report Financial Fraud
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Document counterfeit banknotes, fake mobile money alerts, or
              scam attempts to protect your stall and alert market administrators.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="rep-type"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Type of Fraud
          </label>
          <select
            id="rep-type"
            value={fraudType}
            onChange={(e) => setFraudType(e.target.value as FraudType)}
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {FRAUD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="rep-desc"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Incident Description
          </label>
          <textarea
            id="rep-desc"
            required
            minLength={10}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, how the customer attempted payment, and any suspicious signs you noticed..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="rep-ref"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Transaction Reference or Serial (Optional)
            </label>
            <input
              id="rep-ref"
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. AIR-99812004 or AC11"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label
              htmlFor="rep-amount"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Amount Involved in UGX (Optional)
            </label>
            <input
              id="rep-amount"
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="rep-location"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Market / Stall Location
            </label>
            <input
              id="rep-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Owino Market — Stall B14"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label
              htmlFor="rep-suspect"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Suspect Phone Number (Optional)
            </label>
            <input
              id="rep-suspect"
              type="tel"
              value={suspectPhone}
              onChange={(e) => setSuspectPhone(e.target.value)}
              placeholder="e.g. 0750 998 121"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Supporting Evidence Attachment */}
        <div className="space-y-2.5">
          <span className="block text-sm font-medium text-slate-700">
            Supporting Evidence (Photo of Banknote or Fake SMS Screenshot)
          </span>
          <label className="min-h-[48px] px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>
              {evidenceImage
                ? 'Replace Supporting Photo'
                : 'Attach Photo Evidence'}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {evidenceImage && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950">
              <img
                src={evidenceImage}
                alt="Fraud report evidence"
                className="w-full max-h-56 object-contain"
              />
              <button
                type="button"
                aria-label="Remove attached photo"
                onClick={() => setEvidenceImage('')}
                className="absolute top-2 right-2 min-w-[40px] min-h-[40px] rounded-xl bg-slate-950/80 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
        >
          {submitting ? 'Submitting Fraud Report...' : 'Submit Fraud Report'}
        </button>
      </form>
    </div>
  );
}
