import React from 'react';
import { Banknote } from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Nenkin<span className="text-indigo-600">Pro</span> Portal
          </h1>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-slate-500 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} NenkinPro. Dịch vụ xin hoàn thuế Nenkin uy tín.
      </footer>
    </div>
  );
}
