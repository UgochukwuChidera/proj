
import type { Metadata } from 'next';
import { ResourceDisplayPage } from '@/components/resources/resource-display-page';

export const metadata: Metadata = {
  title: 'Resources', // Will be combined with RootLayout template to "LURH - Resources"
  description: 'Browse and search Landmark University resources.',
};

export default function ResourcesRoutePage() {
  return <ResourceDisplayPage />;
}
