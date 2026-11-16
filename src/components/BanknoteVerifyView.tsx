import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileWarning,
  RefreshCw,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { captureVideoFrame, compressImageFile } from '../lib/imageUtils';
import type {
  BanknoteChecklist,
  BanknoteCheckRecord,
  BanknoteDenomination,
  ReportPrefill,
} from '../types';
import banknoteGuideUrl from '../assets/images/banknote_inspection_guide_1794513739971.jpg';

interface BanknoteVerifyViewProps {
  onRecorded: () => void;
  onReportSuspicious: (prefill: ReportPrefill) => void;
}

const DENOMINATIONS: Array<{
  value: BanknoteDenomination;
  colorLabel: string;
  swatchHex: string;
  motif: string;
}> = [
  {
    value: 50000,
    colorLabel: 'Brown / Ochre',
    swatchHex: '#92400E',
    motif: 'Stride Monument & Mountain Gorilla watermark / hologram',
  },
  {
    value: 20000,
    colorLabel: 'Deep Red / Terracotta',
    swatchHex: '#B91C1C',
    motif: 'Kampala Centenary Monument & Ankole Long-Horned Cattle',
  },
  {
    value: 10000,
    colorLabel: 'Purple / Violet',
    swatchHex: '#6D28D9',
    motif: 'Independence Monument & Karuma Falls',
  },
  {
    value: 5000,
    colorLabel: 'Forest Green',
    swatchHex: '#047857',
    motif: 'WWII Memorial & Weaver Bird nest motif',
  },
  {
    value: 2000,
    colorLabel: 'Blue / Slate',
    swatchHex: '#1D4ED8',
    motif: 'Speke Monument & Nile River',
  },
  {
    value: 1000,
    colorLabel: 'Warm Amber / Brown',
    swatchHex: '#B45309',
    motif: 'Cultural heritage & Kob antelope',
  },
];

const CHECKLIST_ITEMS: Array<{
  key: keyof BanknoteChecklist;
  title: string;
  instruction: string;
}> = [
  {
    key: 'watermarkVisible',
    title: 'Crested Crane Watermark',
    instruction:
      'Hold the note up to natural light. A sharp Crested Crane and electrotype denomination number must appear clearly inside the unprinted paper.',
  },
  {
    key: 'securityThreadIntact',
    title: 'Windowed Security Thread',
    instruction:
      'Check the vertical metallic thread woven into the paper. When held to light, it forms a continuous dark line with micro-printed BOU letters.',
  },
  {
    key: 'raisedPrintFelt',
    title: 'Raised Intaglio Ink',
    instruction:
      'Run your thumb across "BANK OF UGANDA" and the main numeral. Genuine notes have distinct raised tactile ridges rather than flat smooth ink.',
  },
  {
    key: 'colorShiftFoilObserved',
    title: 'Color-Shifting Foil / Stripe',
    instruction:
      'Tilt the note at an angle. Higher denominations show a crisp metallic iridescent stripe or SPARK feature that shifts color cleanly.',
  },
  {
    key: 'paperQualityCrisp',
    title: 'Crisp Cotton Paper & Alignment',
    instruction:
      'Listen for a crisp snap and verify front-to-back print alignment. Counterfeits often feel waxy, overly thick, or limp like photocopy paper.',
  },
];

export function BanknoteVerifyView({
  onRecorded,
  onReportSuspicious,
}: BanknoteVerifyViewProps) {
  const [denomination, setDenomination] =
    useState<BanknoteDenomination>(50000);
  const [checklist, setChecklist] = useState<BanknoteChecklist>({
    watermarkVisible: false,
    securityThreadIntact: false,
    raisedPrintFelt: false,
    colorShiftFoilObserved: false,
    paperQualityCrisp: false,
  });
  const [serialPrefix, setSerialPrefix] = useState('');
  const [notes, setNotes] = useState('');
  const [imageEvidence, setImageEvidence] = useState<string>('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BanknoteCheckRecord | null>(null);
  const [guideImgFailed, setGuideImgFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }

  async function startCamera() {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera capture is unavailable in this browser. Please upload a photo below instead.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setCameraError(
        'Camera permission was declined or no camera was detected. You can upload a photo of the banknote instead.'
      );
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const dataUrl = captureVideoFrame(video);
    if (dataUrl) {
      setImageEvidence(dataUrl);
    }
    stopCamera();
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setError('Image must be smaller than 12 MB.');
      return;
    }
    try {
      const compressed = await compressImageFile(file);
      setImageEvidence(compressed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to process image.'
      );
    }
  }

  function toggleItem(key: keyof BanknoteChecklist) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function markAllPassed() {
    setChecklist({
      watermarkVisible: true,
      securityThreadIntact: true,
      raisedPrintFelt: true,
      colorShiftFoilObserved: true,
      paperQualityCrisp: true,
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.verifyBanknote({
        denomination,
        checklist,
        serialPrefix,
        notes,
        imageEvidence: imageEvidence || undefined,
      });
      setResult(res.record);
      onRecorded();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save inspection.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setResult(null);
    setChecklist({
      watermarkVisible: false,
      securityThreadIntact: false,
      raisedPrintFelt: false,
      colorShiftFoilObserved: false,
      paperQualityCrisp: false,
    });
    setSerialPrefix('');
    setNotes('');
    setImageEvidence('');
    setError('');
  }

  const activeDenom = DENOMINATIONS.find((d) => d.value === denomination)!;
  const passedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Inspection Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            1. Select Banknote Denomination
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Choose the Ugandan Shilling note handed to you by the customer.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
            {DENOMINATIONS.map((d) => {
              const selected = denomination === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDenomination(d.value)}
                  className={`min-h-[54px] px-2 py-2.5 rounded-xl border text-center font-mono tabular-nums text-xs sm:text-sm font-bold flex flex-col items-center justify-center gap-1.5 transition-colors ${
                    selected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <span
                    className="w-6 h-1.5 rounded-full"
                    style={{ backgroundColor: d.swatchHex }}
                    aria-hidden="true"
                  />
                  <span>{d.value.toLocaleString()}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">
              UGX {activeDenom.value.toLocaleString()} Reference:
            </span>{' '}
            {activeDenom.colorLabel} · {activeDenom.motif}
          </div>
        </div>

        {/* Camera / Image Capture */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. Capture or Upload Note Photo (Optional)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Attach a photo for your transaction record or fraud evidence.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={cameraOpen ? stopCamera : startCamera}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>{cameraOpen ? 'Close Camera' : 'Open Camera'}</span>
            </button>

            <label className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>

          {cameraError && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
              {cameraError}
            </p>
          )}

          {cameraOpen && (
            <div className="rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 space-y-3 p-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-64 object-cover rounded-xl bg-black"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                >
                  Capture Banknote Photo
                </button>
              </div>
            </div>
          )}

          {imageEvidence && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={imageEvidence}
                alt="Captured banknote evidence"
                className="w-full max-h-56 object-contain bg-slate-950"
              />
              <button
                type="button"
                aria-label="Remove captured image"
                onClick={() => setImageEvidence('')}
                className="absolute top-2 right-2 min-w-[40px] min-h-[40px] rounded-xl bg-slate-950/80 text-white flex items-center justify-center hover:bg-slate-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Physical Security Features Checklist */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                3. Physical Security Feature Checklist
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                Tick each feature you personally observe on the note ({passedCount}
                /5 confirmed).
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {passedCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setChecklist({
                      watermarkVisible: false,
                      securityThreadIntact: false,
                      raisedPrintFelt: false,
                      colorShiftFoilObserved: false,
                      paperQualityCrisp: false,
                    })
                  }
                  className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 whitespace-nowrap"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={markAllPassed}
                className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 whitespace-nowrap"
              >
                Confirm All 5
              </button>
            </div>
          </div>

          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                passedCount === 5
                  ? 'bg-emerald-600'
                  : passedCount >= 3
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${(passedCount / 5) * 100}%` }}
            />
          </div>

          <div className="space-y-2.5">
            {CHECKLIST_ITEMS.map((item) => {
              const checked = checklist[item.key];
              return (
                <label
                  key={item.key}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleItem(item.key)}
                    className="mt-0.5 w-5 h-5 rounded accent-emerald-700 shrink-0"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {item.instruction}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Optional Serial / Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label
              htmlFor="bn-serial"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Serial Prefix (Optional)
            </label>
            <input
              id="bn-serial"
              type="text"
              value={serialPrefix}
              onChange={(e) => setSerialPrefix(e.target.value)}
              placeholder="e.g. BF49"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label
              htmlFor="bn-notes"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Inspection Notes (Optional)
            </label>
            <input
              id="bn-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Worn corner, faded print"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
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
            ? 'Recording Inspection...'
            : 'Complete Banknote Inspection'}
        </button>
      </form>

      {/* Right Outcome & Reference Panel */}
      <div className="lg:col-span-5 space-y-5">
        {result ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              {result.outcome === 'verified_checklist' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0" />
              ) : result.outcome === 'further_verification_needed' ? (
                <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-red-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Inspection Outcome · UGX {result.denomination.toLocaleString()}
                </div>
                <h3
                  className={`text-lg font-bold mt-0.5 ${
                    result.outcome === 'verified_checklist'
                      ? 'text-emerald-800'
                      : result.outcome === 'further_verification_needed'
                        ? 'text-amber-800'
                        : 'text-red-800'
                  }`}
                >
                  {result.outcome === 'verified_checklist'
                    ? 'Security Features Confirmed'
                    : result.outcome === 'further_verification_needed'
                      ? 'Further Physical Verification Necessary'
                      : 'Suspicious Counterfeit Indicators Observed'}
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {result.summary}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">
                Advisory Reminder
              </div>
              <p>
                Digital inspection checklists assist your eyes and hands, but
                final acceptance should always rely on comparing questionable
                notes with a trusted bank-issued note or UV detector.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              {result.outcome !== 'verified_checklist' && (
                <button
                  type="button"
                  onClick={() =>
                    onReportSuspicious({
                      fraudType: 'Counterfeit Banknote',
                      amount: String(result.denomination),
                      transactionRef: result.serialPrefix
                        ? `${result.serialPrefix}-${result.denomination}`
                        : `UGX-${result.denomination}`,
                      description: result.summary,
                      evidenceImage: result.imageEvidence,
                    })
                  }
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileWarning className="w-4 h-4" />
                  <span>Report Suspicious Note</span>
                </button>
              )}

              <button
                type="button"
                onClick={resetForm}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Inspect Another Note</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="aspect-[4/3] bg-slate-100 relative">
              {!guideImgFailed ? (
                <img
                  src={banknoteGuideUrl}
                  alt="Ugandan Shilling banknotes and magnifying loupe for inspection"
                  referrerPolicy="no-referrer"
                  onError={() => setGuideImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm p-6">
                  Bank of Uganda Note Inspection Guide
                </div>
              )}
            </div>
            <div className="p-5 space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                Look · Feel · Tilt Method
              </h3>
              <ul className="text-sm text-slate-600 space-y-2 leading-relaxed">
                <li>
                  <strong className="text-slate-900">Look:</strong> Hold against
                  daylight to confirm the Crested Crane watermark and continuous
                  security thread.
                </li>
                <li>
                  <strong className="text-slate-900">Feel:</strong> Genuine
                  cotton-linen paper feels crisp with raised tactile ink on the
                  title and numerals.
                </li>
                <li>
                  <strong className="text-slate-900">Tilt:</strong> Watch the
                  holographic stripe and gold SPARK emblem shift colors smoothly.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
