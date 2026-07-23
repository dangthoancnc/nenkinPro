"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { menuItems } from '@/lib/navigation';
import { Home } from 'lucide-react';

export default function BottomNavigationBar() {
  const pathname = usePathname();

  // Core navigation items for mobile bottom bar
  const navItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    ...menuItems.slice(0, 5) // Dashboard, Applications, TaxOffices, etc.
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg z-50 h-14">
      <div className="flex w-full h-full items-center justify-between px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 px-0.5 transition-all text-center min-w-0 ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 stroke-[2.5]' : 'text-slate-500'}`} />
              <span className="text-[9px] leading-tight truncate w-full mt-0.5 block">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
