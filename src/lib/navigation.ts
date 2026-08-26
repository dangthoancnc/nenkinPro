import { Home, FileText, Settings, Banknote, Briefcase, Building2, UserCircle, MessageSquare, Stamp } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  name: string;
  icon: LucideIcon;
  href: string;
}

export const menuItems: MenuItem[] = [
  { name: 'Tổng quan', icon: Home, href: '/dashboard' },
  { name: 'Trang cá nhân / CTV', icon: UserCircle, href: '/portal' },
  { name: 'Messenger Chat', icon: MessageSquare, href: '/messenger' },
  { name: 'Quản lý Hồ sơ', icon: FileText, href: '/applications' },
  { name: 'In Tem Bì Thư', icon: Stamp, href: '/address-labels' },
  { name: 'Cục Thuế', icon: Building2, href: '/tax-offices' },
  { name: 'Nhân sự', icon: Briefcase, href: '/hr' },
  { name: 'Tài chính & Hoa hồng', icon: Banknote, href: '/finance' },
  { name: 'Cài đặt', icon: Settings, href: '/settings' },
];
