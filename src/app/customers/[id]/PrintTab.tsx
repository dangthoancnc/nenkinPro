import React from 'react';

export default function PrintTab({ customerId }: { customerId: string }) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto custom-scrollbar">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">In Biểu mẫu PDF</h2>
        <p className="text-slate-500">Tính năng in đang được chuyển từ /applications/[id]/print sang đây...</p>
      </div>
    </div>
  );
}
