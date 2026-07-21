'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Banknote, Pin, PinOff, Home } from 'lucide-react';
import { menuItems } from '@/lib/navigation';

export default function Sidebar({ isOpen, isPinned, setIsPinned, onMouseEnter, onMouseLeave }: { isOpen: boolean, isPinned?: boolean, setIsPinned?: (val: boolean) => void, onMouseEnter?: () => void, onMouseLeave?: () => void }) {
  const pathname = usePathname();

  return (
    <aside 
      className={`${isOpen ? 'w-64' : 'w-16'} bg-teal-900 text-teal-50 flex flex-col h-screen fixed left-0 top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-[105] transition-all duration-300 overflow-x-hidden`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`h-16 flex items-center px-6 border-b border-border ${isOpen ? 'justify-between' : 'justify-center'} sm:justify-between`}>
        <div className={`flex items-center gap-2 ${!isOpen && 'justify-center w-full'}`}>
          <div className="w-8 h-8 bg-transparent rounded-lg flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          {isOpen && (
            <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
              VietNenkin <span className="text-teal-400">Duyên</span>
            </h1>
          )}
        </div>
        {isOpen && setIsPinned && (
          <button 
            onClick={() => setIsPinned(!isPinned)} 
            className="text-teal-400 hover:text-white transition-colors" 
            title={isPinned ? "Bỏ ghim Sidebar" : "Ghim Sidebar"}
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      <nav className="flex-1 px-3 mt-4">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname?.startsWith(item.href);

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center'} py-2.5 rounded-md ${
                    isActive 
                      ? 'bg-teal-800 text-white font-semibold border-l-4 border-teal-400 pl-2 md:pl-2' 
                      : 'text-teal-100 hover:bg-teal-800/50 hover:text-white'
                  } transition-all duration-200 group relative overflow-hidden`}
                  title={!isOpen ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-200' : 'text-teal-400'} group-hover:text-teal-200 transition-colors duration-200 shrink-0`} />
                  {isOpen && <span className={`text-sm whitespace-nowrap ${isActive ? 'text-white font-medium' : 'text-teal-100'} group-hover:text-white`}>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-teal-800 mt-auto space-y-2">
        <Link 
          href="/"
          className={`flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center'} py-2.5 w-full rounded-md hover:bg-teal-800 hover:text-white transition-all duration-200 group text-teal-200`}
          title={!isOpen ? "Trang chủ" : undefined}
        >
          <Home className="w-5 h-5 group-hover:text-teal-200 transition-colors shrink-0" />
          {isOpen && <span className="font-medium text-sm group-hover:text-white whitespace-nowrap">Trang chủ Khách</span>}
        </Link>
      </div>
    </aside>
  );
}
