
import { UploadResourceClientPage } from '@/components/admin/upload-resource-client-page';
import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Upload Resource', // Will be "LURH - Upload Resource"
  description: 'Add a new resource to the Landmark University Resource Hub.',
};

export default function UploadResourcePage() {
  return <UploadResourceClientPage />;
}
