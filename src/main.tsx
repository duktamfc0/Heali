import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Heali app runtime error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f4f4ed] text-[#273829] flex items-center justify-center p-6">
          <div className="max-w-sm w-full rounded-3xl bg-[#faf7ef] border border-[#dcd9cc] p-6 text-center shadow-lg space-y-3">
            <h2 className="text-lg font-bold font-serif-healing">Khu vườn đang tạm nghỉ một nhịp</h2>
            <p className="text-xs text-[#556b56] leading-relaxed">
              Đã có sự cố nhỏ khi tải giao diện. Bạn vui lòng tải lại trang để quay về Heali nhé.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white text-xs font-semibold transition"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
