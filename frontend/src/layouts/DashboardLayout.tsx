import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { WatermarkPattern } from '@/components/ui/Watermark';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 76 : 264;

  return (
    <div
      className="min-h-screen bg-bg-secondary dark:bg-slate-950 text-text-primary dark:text-slate-100"
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className="transition-all duration-300 ease-in-out min-h-screen flex flex-col ml-0 md:ml-[var(--sidebar-width)]"
      >
        <TopBar />
        <main className="flex-1 p-4 md:p-6 relative">
          <WatermarkPattern />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
