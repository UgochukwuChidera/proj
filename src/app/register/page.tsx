
import type { Metadata } from 'next';
import RegisterClientPage from './register-client-page';

export const metadata: Metadata = {
  title: 'Register', // Will be combined with RootLayout template to "LURH - Register"
};

export default function RegisterPage() {
  return <RegisterClientPage />;
}
