'use client';

import { useEffect } from 'react';
import { Compass, Sparkles } from 'lucide-react';

export default function QuickToolsPage() {
  useEffect(() => {
    // Automatically trigger the drawer on direct navigation
    window.dispatchEvent(new Event('nenkin:open-quick-tools'));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shadow-sm">
        <Compass className="w-8 h-8 animate-pulse" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-800">Tiện ích Tra cứu Nhanh</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1">
          Bảng điều khiển tiện ích đã được mở ở thanh trượt bên phải màn hình. Bạn có thể nhấn phím tắt <kbd className="px-2 py-0.5 rounded bg-slate-100 border text-xs font-mono font-bold text-slate-700">Alt + T</kbd> để bật/tắt nhanh bất kỳ lúc nào từ bất kỳ trang nào.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event('nenkin:open-quick-tools'))}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition shadow-sm"
      >
        <Sparkles className="w-4 h-4" />
        Mở lại Tiện ích Tra cứu
      </button>
    </div>
  );
}
