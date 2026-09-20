"use client";

import { useState, useEffect, Suspense } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { usePathname } from 'next/navigation';

import BottomNavigationBar from './BottomNavigationBar';
import MiniDockedChat from './messenger/MiniDockedChat';
import MessengerDrawer from './messenger/MessengerDrawer';
import QuickToolsDrawer from './tools/QuickToolsDrawer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMessengerDrawerOpen, setIsMessengerDrawerOpen] = useState(false);
  const [isQuickToolsOpen, setIsQuickToolsOpen] = useState(false);
  
  const isSidebarOpen = isPinned || isHovered;
  const pathname = usePathname();
  const isNoLayoutRoute = pathname === '/' || pathname === '/onboarding' || pathname === '/login' || pathname?.startsWith('/customer') || pathname?.endsWith('/print');
  const isApplicationWorkspace = pathname?.startsWith('/applications/') && pathname !== '/applications' && !pathname?.endsWith('/don-xin');

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

  useEffect(() => {
    const handleOpenDrawer = () => setIsMessengerDrawerOpen(true);
    window.addEventListener('nenkin:open-messenger-drawer', handleOpenDrawer);
    return () => window.removeEventListener('nenkin:open-messenger-drawer', handleOpenDrawer);
  }, []);

  useEffect(() => {
    const handleOpenQuickTools = () => setIsQuickToolsOpen(true);
    window.addEventListener('nenkin:open-quick-tools', handleOpenQuickTools);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut: Alt + T to toggle quick tools drawer
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setIsQuickToolsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('nenkin:open-quick-tools', handleOpenQuickTools);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (isNoLayoutRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen md:min-h-0 md:h-screen bg-gradient-to-br from-slate-100 to-blue-50/50 text-slate-900 overflow-x-hidden">
      <div className="hidden md:block">
        <Sidebar 
          isOpen={isSidebarOpen} 
          isPinned={isPinned} 
          setIsPinned={setIsPinned}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onOpenMessengerDrawer={() => setIsMessengerDrawerOpen(true)}
          onOpenQuickToolsDrawer={() => setIsQuickToolsOpen(true)}
        />
      </div>
      <div 
        className={`flex-1 flex flex-col min-h-screen md:min-h-0 md:h-screen transition-all duration-300 ${
          isPinned ? 'md:ml-64 ml-0' : 'md:ml-16 ml-0'
        }`}
      >
        {!isApplicationWorkspace && (
          <Suspense fallback={<div className="h-12 bg-card/80 border-b border-border sticky top-0 z-30" />}>
            <Topbar isSidebarOpen={isPinned} setIsSidebarOpen={setIsPinned} />
          </Suspense>
        )}
        <main className={`flex-1 relative min-h-0 ${isApplicationWorkspace ? 'p-1.5 sm:p-2 overflow-hidden h-full' : 'p-2 sm:p-3 pb-16 md:pb-3 overflow-x-hidden'}`}>
          {children}
        </main>
      </div>
      <MessengerDrawer 
        isOpen={isMessengerDrawerOpen} 
        onClose={() => setIsMessengerDrawerOpen(false)} 
      />
      <QuickToolsDrawer
        isOpen={isQuickToolsOpen}
        onClose={() => setIsQuickToolsOpen(false)}
      />
      <MiniDockedChat />
      <BottomNavigationBar />
    </div>
  );
}

