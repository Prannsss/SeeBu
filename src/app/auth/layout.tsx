import GoogleAuthProvider from '@/components/providers/google-auth-provider';

// Only login/register use Google sign-in, so the GSI provider lives here instead of the root layout.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <GoogleAuthProvider>{children}</GoogleAuthProvider>;
}
