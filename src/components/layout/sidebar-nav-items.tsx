
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Search, UserCircle, MessageSquare, UploadCloud, Users } from 'lucide-react'; 
import { useAuth } from '@/contexts/auth-context';

const navItems = [
  { href: '/resources', label: 'Resources', icon: Search, authRequired: false }, 
  { href: '/profile', label: 'Profile', icon: UserCircle, authRequired: true },
  { href: '/chatbot', label: 'Chatbot Assistant', icon: MessageSquare, authRequired: false },
  { href: '/admin/upload-resource', label: 'Upload Resource', icon: UploadCloud, authRequired: true, adminOnly: true },
  { href: '/admin/user-management', label: 'User Management', icon: Users, authRequired: true, adminOnly: true },
];

export function SidebarNavItems() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/resources') return pathname === href || pathname.startsWith(href + '/');
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        if (item.authRequired && !isAuthenticated) {
          return null;
        }
        if (item.adminOnly && (!user || !user.isAdmin)) {
          return null;
        }
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive(item.href)}
                tooltip={{ children: item.label, className:"font-body"}}
                className="font-body"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
