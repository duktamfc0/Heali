import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-xl bg-[#ebf0e5] hover:bg-[#e1e8d8] border border-[#cfd8c9] text-[#273829] transition shadow-sm ${
          compact ? 'px-2.5 py-1.5 text-xs font-medium' : 'px-3.5 py-2 text-sm font-medium'
        }`}
        title="Cài đặt Heali về màn hình chính"
      >
        <Download className="w-4 h-4 text-[#46613e]" />
        <span className="hidden sm:inline">Cài app</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl bg-[#ebf0e5] hover:bg-[#e1e8d8] border border-[#cfd8c9] text-[#273829] transition ${
            compact ? 'px-2.5 py-1.5 text-xs font-medium' : 'px-3.5 py-2 text-sm'
          }`}
          title="Cài đặt trên iPhone/iPad"
        >
          <Smartphone className="w-4 h-4 text-[#46613e]" />
          <span className="hidden sm:inline">Cài iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c281e]/55 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#faf7ef] border border-[#dcdad0] p-6 shadow-2xl text-[#273829]">
              <div className="flex items-center justify-between pb-3 border-b border-[#e6e4d8]">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-[#46613e]" />
                  <h3 className="font-semibold text-[#273829]">Cài Heali trên iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-[#5e7260] hover:text-[#273829] p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-sm text-[#394d3b]">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e6efe2] text-[#46613e] flex items-center justify-center font-bold text-xs">1</span>
                  <p>Nhấn vào biểu tượng <strong>Chia sẻ (Share ⎋)</strong> trên thanh công cụ Safari.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e6efe2] text-[#46613e] flex items-center justify-center font-bold text-xs">2</span>
                  <p>Cuộn xuống chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e6efe2] text-[#46613e] flex items-center justify-center font-bold text-xs">3</span>
                  <p>Nhấn <strong>Thêm (Add)</strong> ở góc trên bên phải. Heali sẽ xuất hiện như ứng dụng độc lập mượt mà.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-[#46613e] hover:bg-[#384f31] py-2.5 text-sm font-medium text-white shadow-sm transition"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
