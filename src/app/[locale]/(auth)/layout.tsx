'use client';

import type { ReactNode } from 'react';

import { ProjectProvider } from '@/components/admin/project-context';
import { ShellLayout } from '@/components/admin/shell-layout';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { ToastProvider } from '@/components/ui/toast';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthShellLayout({ children }: AuthLayoutProps) {
  return (
    <AuthWrapper>
      <ToastProvider>
        <ProjectProvider>
          <ShellLayout>{children}</ShellLayout>
        </ProjectProvider>
      </ToastProvider>
    </AuthWrapper>
  );
}
