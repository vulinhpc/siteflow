'use client';

import { useState } from 'react';

import { Sheet, SheetContent } from '@/components/ui/sheet';

import { AdminHeader } from './header';
import { useProject } from './project-context';
import { AdminSidebar } from './sidebar';

type ShellLayoutProps = {
  children: React.ReactNode;
};

export function ShellLayout({ children }: ShellLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { openCreateModal: _openCreateModal } = useProject();

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        className="hidden md:flex"
      />

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar
            isCollapsed={false}
            onToggleCollapse={() => {}} // No-op for mobile
            className="border-0"
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader onToggleSidebar={handleToggleMobileSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
