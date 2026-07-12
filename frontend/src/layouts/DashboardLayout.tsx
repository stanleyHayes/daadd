import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-bg-secondary dark:bg-slate-950 text-text-primary dark:text-slate-100">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className="transition-all duration-300 ease-in-out min-h-screen flex flex-col"
        style={{
          marginLeft: collapsed ? 76 : 264,
        }}
      >
        <TopBar />
        <main className="flex-1 p-4 md:p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
