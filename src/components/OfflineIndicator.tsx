import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 lg:bottom-5 left-4 right-4 sm:right-auto z-40 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline Mode — Cached app shell active; reconnect to sync checks.</span>
    </div>
  );
}
