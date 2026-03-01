import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 print:hidden"
      dir="rtl"
      data-testid="offline-banner"
    >
      <WifiOff className="h-4 w-4" />
      <span>لا يوجد اتصال بالإنترنت - لن يتم حفظ التغييرات حتى يعود الاتصال</span>
    </div>
  );
}
