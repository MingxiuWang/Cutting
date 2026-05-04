'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Nav from './nav';

export default function AppShell({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCollapsed(window.localStorage.getItem('nav:collapsed') === '1');
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem('nav:collapsed', next ? '1' : '0');
      } catch {}
      return next;
    });
  }

  return (
    <div
      className={`min-h-screen bg-neutral-50 ${collapsed ? '' : 'md:pl-56'} pb-20 md:pb-0`}
    >
      <Nav isAdmin={isAdmin} collapsed={collapsed} onToggle={toggle} />
      {collapsed && (
        <button
          onClick={toggle}
          aria-label="Show menu"
          className="hidden md:inline-flex fixed top-3 left-3 z-30 items-center justify-center w-9 h-9 rounded-lg bg-white border border-neutral-200 shadow-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
      <main className="p-6 sm:p-8 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
