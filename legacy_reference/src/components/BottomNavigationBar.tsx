"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { menuItems } from '@/lib/navigation';
import { Home } from 'lucide-react';

export default function BottomNavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className="flex overflow-x-auto overflow-y-hidden pb-safe">
        <ul className="flex w-full items-center justify-around">
          <li className="flex-shrink-0">
            <Link
              href="/"
              className={`flex flex-col items-center justify-center w-16 h-16 p-1 gap-1 transition-colors text-muted-foreground hover:text-foreground`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] text-center leading-tight truncate w-full px-1">Home</span>
            </Link>
          </li>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.name} className="flex-shrink-0">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-16 h-16 p-1 gap-1 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] text-center leading-tight truncate w-full px-1">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
