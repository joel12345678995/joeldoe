import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import emblemUrl from '../assets/images/vendorguard_emblem_1794513738359.jpg';

interface SplashScreenProps {
  onContinue: () => void;
}

export function SplashScreen({ onContinue }: SplashScreenProps) {
  const [progress, setProgress] = useState(18);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setProgress(68), 350);
    const t2 = window.setTimeout(() => setProgress(100), 1600);
    const t3 = window.setTimeout(() => onContinue(), 2600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onContinue]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between px-6 py-10">
      <div className="w-full max-w-md flex items-center justify-between text-xs text-slate-400">
        <span>Uganda Market Protection</span>
        <span>Banknotes &amp; Mobile Money</span>
      </div>

      <div className="w-full max-w-md flex flex-col items-center text-center my-auto py-8">
        <div className="w-24 h-24 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center mb-6 shadow-xl">
          {!imgError ? (
            <img
              src={emblemUrl}
              alt="VendorGuard security shield emblem"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShieldCheck className="w-12 h-12 text-emerald-400" />
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 text-balance">
          VendorGuard
        </h1>

        <p className="text-base text-slate-300 leading-relaxed max-w-sm mb-8">
          Helping Ugandan market vendors detect counterfeit banknotes, verify
          MTN &amp; Airtel Mobile Money payments, and report financial fraud.
        </p>

        <div className="w-full max-w-xs space-y-4">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <span>Continue to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-500 text-center">
        <span>Verify Cash</span>
        <span aria-hidden="true" className="mx-2">
          ·
        </span>
        <span>Confirm Mobile Money</span>
        <span aria-hidden="true" className="mx-2">
          ·
        </span>
        <span>Protect Your Stall</span>
      </div>
    </div>
  );
}
