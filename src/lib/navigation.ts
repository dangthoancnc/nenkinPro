import { Home, Users, FileText, Settings, Banknote, Briefcase, Building2, Map } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  name: string;
  icon: LucideIcon;
  href: string;
}

export const menuItems: MenuItem[] = [
  { name: 'Tổng quan', icon: Home, href: '/dashboard' },
  { name: 'Khách hàng & Hồ sơ', icon: Users, href: '/customers' },
  { name: 'Cục Thuế', icon: Building2, href: '/tax-offices' },
  { name: 'Nhân sự', icon: Briefcase, href: '/hr' },
  { name: 'Tài chính & Hoa hồng', icon: Banknote, href: '/finance' },
  { name: 'Cài đặt', icon: Settings, href: '/settings' },
  { name: 'Thiết kế Biểu mẫu', icon: Map, href: '/admin/pdf-mapper' },
];
