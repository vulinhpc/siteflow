'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type AuthWrapperProps = {
  children: React.ReactNode;
};

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [isE2EBypass, setIsE2EBypass] = useState(false);

  useEffect(() => {
    // Check if we're in E2E bypass mode
    const checkE2EBypass = () => {
      // Check for bypass header in URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const bypass
        = urlParams.get('e2e-bypass') || localStorage.getItem('e2e-bypass');

      if (bypass === 'true' || bypass === '1') {
        setIsE2EBypass(true);
        return;
      }

      // Check for bypass headers (if available in client)
      if (typeof window !== 'undefined') {
        // Try to detect if we're in E2E mode
        const isE2E
          = window.location.hostname === 'localhost'
            && (window.location.port === '3000' || window.location.port === '3001');

        if (isE2E) {
          setIsE2EBypass(true);
        }
      }
    };

    checkE2EBypass();
  }, []);

  // If E2E bypass is active, render children directly
  if (isE2EBypass) {
    return <>{children}</>;
  }

  // If not loaded yet, show loading
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not signed in, redirect to sign-in
  if (!isSignedIn) {
    router.push('/sign-in');
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Redirecting to sign-in...
          </p>
        </div>
      </div>
    );
  }

  // If signed in, render children
  return <>{children}</>;
}
