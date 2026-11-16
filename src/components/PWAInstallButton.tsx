import { useEffect, useState } from 'react';
import { Download, FileArchive, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'sidebar' | 'card';
}

interface DownloadMeta {
  apkAvailable: boolean;
  zipAvailable: boolean;
  apkSizeBytes: number;
  zipSizeBytes: number;
}

function formatMb(bytes: number): string {
  if (!bytes) return '';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PWAInstallButton({
  variant = 'compact',
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [downloads, setDownloads] = useState<DownloadMeta | null>(null);

  const isNative =
    typeof window !== 'undefined' &&
    Boolean(
      (
        window as unknown as {
          Capacitor?: { isNativePlatform?: () => boolean };
        }
      ).Capacitor?.isNativePlatform?.()
    );

  useEffect(() => {
    const handleBack = (e: Event) => {
      if (showGuide) {
        e.preventDefault();
        setShowGuide(false);
      }
    };
    window.addEventListener('vendorguard:back-request', handleBack);
    return () =>
      window.removeEventListener('vendorguard:back-request', handleBack);
  }, [showGuide]);

  useEffect(() => {
    if (!showGuide || isNative) return;
    fetch('/api/downloads')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setDownloads(data as DownloadMeta);
      })
      .catch(() => {});
  }, [showGuide, isNative]);

  if (isNative) {
    return null;
  }

  if (isInstalled && variant !== 'card') {
    return null;
  }

  async function handleClick() {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  }

  const buttonLabel = isInstallable ? 'Install App' : 'Get Android APK';

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center gap-2.5 transition-colors"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{buttonLabel}</span>
        </button>
      ) : variant === 'card' ? (
        <button
          type="button"
          onClick={handleClick}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>{isInstalled ? 'Android APK & Install' : buttonLabel}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>{isInstallable ? 'Install' : 'Get APK'}</span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Install VendorGuard on Your Phone
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close install guide"
                onClick={() => setShowGuide(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {downloads && (downloads.apkAvailable || downloads.zipAvailable) && (
              <div className="space-y-2.5">
                {downloads.apkAvailable && (
                  <a
                    href="/downloads/VendorGuard.apk"
                    download="VendorGuard.apk"
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Download VendorGuard.apk</span>
                    </span>
                    <span className="text-xs font-mono tabular-nums text-emerald-100">
                      {formatMb(downloads.apkSizeBytes)}
                    </span>
                  </a>
                )}

                {downloads.zipAvailable && (
                  <a
                    href="/downloads/VendorGuard-package.zip"
                    download="VendorGuard-package.zip"
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileArchive className="w-4 h-4 shrink-0" />
                      <span>Download Full Project + APK (.zip)</span>
                    </span>
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {formatMb(downloads.zipSizeBytes)}
                    </span>
                  </a>
                )}
              </div>
            )}

            {isIOS ? (
              <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900">
                  iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>
                    Open this app directly in <strong>Safari</strong>.
                  </li>
                  <li>
                    Tap the <strong>Share</strong> button in the bottom toolbar.
                  </li>
                  <li>
                    Tap <strong>Add to Home Screen</strong>, then{' '}
                    <strong>Add</strong>.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                <div className="font-semibold text-slate-900">
                  Installing the Android APK
                </div>
                <p>
                  Transfer <strong>VendorGuard.apk</strong> to your Android
                  phone, tap the file, and allow{' '}
                  <strong>Install unknown apps</strong> when prompted. Or tap{' '}
                  <strong>⋮ Menu → Install app</strong> in Chrome.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
