"use client";

import dynamic from 'next/dynamic';

const PdfMapperClient = dynamic(() => import('./PdfMapperClient'), {
  ssr: false,
  loading: () => <div className="p-10 flex justify-center items-center h-screen bg-slate-100 text-slate-500">Đang tải giao diện Kéo thả...</div>
});

export default function PdfMapperPage() {
  return <PdfMapperClient />;
}
