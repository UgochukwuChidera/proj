
import type { Metadata } from 'next';
import { ProfileClientPage } from '@/components/profile/profile-client-page';

export const metadata: Metadata = {
  title: 'Profile', // Will be "LURH - Profile"
  description: 'Manage your Landmark University Resource Hub user profile.',
};

export default function ProfilePage() {
  return <ProfileClientPage />;
}
