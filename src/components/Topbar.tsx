"use client";
import { Bell, Search, UserCircle, Menu } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/':             'Tổng quan',
  '/customers':    'Quản lý Khách hàng',
  '/tax-offices':  'Quản lý Cục Thuế',
  '/applications': 'Hồ sơ Nenkin',
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

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all">
      {/* Left: Hamburger + Page title */}
      <div className="flex items-center gap-3">
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

      {/* Center: Search */}
      <div className="flex items-center w-full max-w-md ml-4">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm khách hàng, hồ sơ..."
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-all w-full rounded-full"
          />
        </form>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell with Badge count */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground rounded-full"
          aria-label={`${unreadCount} thông báo chưa đọc`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="error"
              size="sm"
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 justify-center rounded-full text-[9px] font-bold border-2 border-card pointer-events-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* User dropdown */}
        <div className="group relative">
          <button className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-muted transition-all text-left">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
              <UserCircle className="w-5 h-5" />
            </div>
            <div className="hidden sm:flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground leading-none">
                {user ? user.name : 'Đang tải...'}
              </p>
              <div className="flex items-center gap-1">
                <Badge variant="indigo" size="sm">
                  {roleLabel}
                </Badge>
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
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
