
import type { Metadata } from 'next';
import LoginClientPage from './login-client-page';

export const metadata: Metadata = {
  title: 'Login', // Will be combined with RootLayout template to "LURH - Login"
};

export default function LoginPage() {
  return <LoginClientPage />;
}
