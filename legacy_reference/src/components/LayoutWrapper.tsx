"use client";

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { usePathname } from 'next/navigation';

import BottomNavigationBar from './BottomNavigationBar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const isSidebarOpen = isPinned || isHovered;
  const pathname = usePathname();
  const isPublicRoute = pathname === '/' || pathname === '/onboarding' || pathname === '/login';

  useEffect(() => {
    const updateSidebarWidth = () => {
      if (window.innerWidth < 768) {
        document.documentElement.style.setProperty('--sidebar-width', '0px');
      } else {
        document.documentElement.style.setProperty('--sidebar-width', isPinned ? '16rem' : '5rem');
      }
    };
    updateSidebarWidth();
    window.addEventListener('resize', updateSidebarWidth);
    return () => window.removeEventListener('resize', updateSidebarWidth);
  }, [isPinned]);

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
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
          isPinned ? 'md:ml-64 ml-0' : 'md:ml-20 ml-0'
        }`}
      >
        <Topbar isSidebarOpen={isPinned} setIsSidebarOpen={setIsPinned} />
        <main className="flex-1 p-4 pb-20 md:pb-6 md:p-6 overflow-x-hidden relative">
          {children}
        </main>
      </div>
      <BottomNavigationBar />
    </div>
  );
}

