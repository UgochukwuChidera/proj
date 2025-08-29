
import type { Metadata } from 'next';
import { UpdatePasswordClientPage } from '@/components/auth/update-password-client-page';

export const metadata: Metadata = {
  title: 'Update Password',
  description: 'Set a new password for your account.',
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordClientPage />;
}
