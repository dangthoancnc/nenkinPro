import { Home, FileText, Settings, Banknote, Briefcase, Building2, UserCircle, MessageSquare, Stamp, Compass } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type UserRole = 'ADMIN' | 'MANAGER' | 'COLLABORATOR';

export interface MenuItem {
  name: string;
  icon: LucideIcon;
  href: string;
  roles?: UserRole[];
}

export const menuItems: MenuItem[] = [
  { name: 'Tổng quan', icon: Home, href: '/dashboard', roles: ['ADMIN', 'MANAGER', 'COLLABORATOR'] },
  { name: 'Trang cá nhân / CTV', icon: UserCircle, href: '/portal', roles: ['ADMIN', 'MANAGER', 'COLLABORATOR'] },
  { name: 'Messenger Chat', icon: MessageSquare, href: '/messenger', roles: ['ADMIN', 'MANAGER', 'COLLABORATOR'] },
  { name: 'Quản lý Hồ sơ', icon: FileText, href: '/applications', roles: ['ADMIN', 'MANAGER', 'COLLABORATOR'] },
  { name: 'Tiện ích Tra cứu', icon: Compass, href: '/quick-tools', roles: ['ADMIN', 'MANAGER', 'COLLABORATOR'] },
  { name: 'In Tem Bì Thư', icon: Stamp, href: '/address-labels', roles: ['ADMIN', 'MANAGER', 'COLLABORATOR'] },
  { name: 'Cục Thuế', icon: Building2, href: '/tax-offices', roles: ['ADMIN', 'MANAGER'] },
  { name: 'Đại diện thuế', icon: UserCircle, href: '/tax-representatives', roles: ['ADMIN', 'MANAGER'] },
  { name: 'Nhân sự', icon: Briefcase, href: '/hr', roles: ['ADMIN', 'MANAGER'] },
  { name: 'Tài chính & Hoa hồng', icon: Banknote, href: '/finance', roles: ['ADMIN'] },
  { name: 'Cài đặt', icon: Settings, href: '/settings', roles: ['ADMIN'] },
];
