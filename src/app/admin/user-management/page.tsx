
import { UserManagementClientPage } from '@/components/admin/user-management-client-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Management', // Will be "LURH - User Management"
  description: 'Manage user accounts, including password resets.',
};

export default function UserManagementPage() {
  return <UserManagementClientPage />;
}
