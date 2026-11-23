import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
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
      className="bg-[#f6efe2] dark:bg-[#2a261b] border-b border-[#dfc89e] dark:border-[#4d452c] px-4 py-2 text-sm text-[#4e3813] dark:text-[#e7d6b0] flex items-center justify-center gap-2 text-center"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        Đang ngoại tuyến — Bản nháp nhật ký, thư chưa gửi và âm thanh tự nhiên vẫn hoạt động bình thường.
      </span>
    </div>
  );
};
