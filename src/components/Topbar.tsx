"use client";
import { Bell, Search, UserCircle, Menu, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/':             'Tổng quan',
  '/customers':    'Quản lý Khách hàng',
  '/tax-offices':          'Quản lý Cục Thuế',
  '/tax-representatives':  'Quản lý Người Đại Diện Thuế',
  '/applications':         'Hồ sơ Nenkin',
  '/hr':           'Quản lý Nhân sự',
  '/finance':      'Tài chính & Hoa hồng',
  '/settings':     'Cài đặt hệ thống',
};

export default function Topbar({
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [unreadCount] = useState(3); // TODO: wire to real notification API

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/auth/employee/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) setUser(data.user);
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

  const getPageTitle = () => {
    for (const [key, title] of Object.entries(PAGE_TITLES)) {
      if (key === '/' ? pathname === '/' : pathname.startsWith(key)) return title;
    }
    return '';
  };

  const roleLabel = user?.role === 'ADMIN'
    ? 'Quản trị viên'
    : user?.role === 'STAFF'
    ? 'Nhân viên'
    : user?.role ?? '...';

  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <header className="h-12 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-3 sm:px-4 sticky top-0 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all shrink-0">
      {/* Left: Hamburger + Page title */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex text-muted-foreground hover:text-foreground shrink-0 w-8 h-8"
        >
          <Menu className="w-4 h-4" />
        </Button>
        <h2 className="text-sm sm:text-base font-bold text-foreground hidden sm:block whitespace-nowrap">
          {getPageTitle()}
        </h2>
      </div>

      {/* Center: Search */}
      <div className="flex items-center w-full max-w-sm ml-3">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm khách hàng, hồ sơ..."
            className="pl-8 h-8 text-xs bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-all w-full rounded-full"
          />
        </form>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Notification bell dropdown */}
        <NotificationDropdown />

        <div className="w-px h-5 bg-border mx-1" />

        {/* User dropdown */}
        <div className="group relative">
          <button className="flex items-center gap-2 p-0.5 pr-2 rounded-full hover:bg-muted transition-all text-left">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
              <UserCircle className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col gap-0">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {user ? user.name : 'Đang tải...'}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground leading-none">
                  {roleLabel}
                </span>
              </div>
            </div>
          </button>

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors border-b border-border flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              Đổi mật khẩu
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />
    </header>
  );
}
