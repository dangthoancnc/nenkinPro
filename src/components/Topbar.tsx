"use client";
import { Bell, Search, UserCircle, Menu } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';

export default function Topbar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{name: string, role: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/auth/employee/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    } else {
      params.delete('q');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/employee/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };
  
  // Mapping pathname to title
  const getPageTitle = () => {
    if (pathname === '/') return 'Tổng quan';
    if (pathname.startsWith('/customers')) return 'Quản lý Khách hàng';
    if (pathname.startsWith('/tax-offices')) return 'Quản lý Cục Thuế';
    if (pathname.startsWith('/applications')) return 'Hồ sơ Nenkin';
    if (pathname.startsWith('/hr')) return 'Quản lý Nhân sự';
    if (pathname.startsWith('/finance')) return 'Tài chính & Hoa hồng';
    if (pathname.startsWith('/settings')) return 'Cài đặt hệ thống';
    return '';
  };

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex text-muted-foreground hover:text-foreground shrink-0"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground hidden sm:block whitespace-nowrap">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center w-full max-w-md ml-4">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm khách hàng, hồ sơ..." 
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-all w-full rounded-full"
          />
        </form>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground rounded-full">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
        </Button>
        
        <div className="w-px h-6 bg-border mx-2"></div>
        
        <div className="group relative">
          <button className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-muted transition-all text-left">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <UserCircle className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-none mb-1">{user ? user.name : 'Đang tải...'}</p>
              <p className="text-xs text-muted-foreground leading-none">{user ? user.role : '...'}</p>
            </div>
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors">
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
