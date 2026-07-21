"use client";

import { useState, useEffect, Suspense } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { usePathname } from 'next/navigation';

import BottomNavigationBar from './BottomNavigationBar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const isSidebarOpen = isPinned || isHovered;
  const pathname = usePathname();
  const isNoLayoutRoute = pathname === '/' || pathname === '/onboarding' || pathname === '/login' || pathname?.endsWith('/print');

  useEffect(() => {
    const updateSidebarWidth = () => {
      if (window.innerWidth < 768) {
        document.documentElement.style.setProperty('--sidebar-width', '0px');
      } else {
        document.documentElement.style.setProperty('--sidebar-width', isPinned ? '16rem' : '4rem');
      }
    };
    updateSidebarWidth();
    window.addEventListener('resize', updateSidebarWidth);
    return () => window.removeEventListener('resize', updateSidebarWidth);
  }, [isPinned]);

  if (isNoLayoutRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 to-blue-50/50 text-slate-900">
      <div className="hidden md:block">
        <Sidebar 
          isOpen={isSidebarOpen} 
          isPinned={isPinned} 
          setIsPinned={setIsPinned}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      </div>
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isPinned ? 'md:ml-64 ml-0' : 'md:ml-16 ml-0'
        }`}
      >
        <Suspense fallback={<div className="h-16 bg-card/80 border-b border-border sticky top-0 z-30" />}>
          <Topbar isSidebarOpen={isPinned} setIsSidebarOpen={setIsPinned} />
        </Suspense>
        <main className="flex-1 p-3 pb-16 md:pb-3 md:p-3 overflow-x-hidden relative">
          {children}
        </main>
      </div>
      <BottomNavigationBar />
    </div>
  );
}

