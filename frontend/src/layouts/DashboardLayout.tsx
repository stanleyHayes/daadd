import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 84 : 286;

  return (
    <div
      className="dashboard-shell min-h-screen bg-[#f3f4f6] dark:bg-[#070d19] text-text-primary dark:text-slate-100"
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className="transition-all duration-300 ease-in-out min-h-screen flex flex-col ml-0 md:ml-[var(--sidebar-width)]"
      >
        <TopBar />
        <main className="relative flex-1 overflow-hidden p-4 md:p-7 xl:p-8">
          <div className="pointer-events-none absolute -right-48 top-8 h-[520px] w-[520px] rounded-full bg-secondary-300/[0.07] blur-[100px]" />
          <div className="pointer-events-none absolute -left-40 top-[36rem] h-[420px] w-[420px] rounded-full bg-blue-400/[0.05] blur-[100px]" />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
