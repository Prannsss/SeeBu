"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  // Use a fallback so it doesn't crash the entire app if the env var is missing during build/runtime
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1234567890-mockclientid.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
