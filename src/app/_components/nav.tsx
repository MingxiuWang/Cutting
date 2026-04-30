'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/_actions/session';
import {
  LayoutDashboard,
  ChartLine,
  ClipboardList,
  Target,
  Settings,
  LogOut,
  Shield,
  type LucideIcon,
} from 'lucide-react';

type Item = { href: string; label: string; icon: LucideIcon };

const baseItems: Item[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/charts', label: 'Charts', icon: ChartLine },
  { href: '/entries', label: 'Entries', icon: ClipboardList },
  { href: '/cuts', label: 'Cuts', icon: Target },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Nav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  // Admin is a pure manager view: hide the personal-tracking nav.
  const items: Item[] = isAdmin
    ? [{ href: '/admin', label: 'Admin', icon: Shield }]
    : baseItems;
  return (
    <>
      <nav className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 md:border-r md:border-neutral-200 bg-white p-4 gap-1">
        <div className="text-xl font-semibold tracking-tight px-3 mb-6 text-neutral-900">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 mr-2 align-middle" />
          Cutting
        </div>
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                active
                  ? 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-emerald-50 text-emerald-700 font-medium'
                  : 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }
            >
              <Icon className="w-4 h-4" />
              {it.label}
            </Link>
          );
        })}
        <form action={logout} className="mt-auto">
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </nav>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 flex">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                active
                  ? 'flex-1 flex flex-col items-center py-2 text-emerald-600'
                  : 'flex-1 flex flex-col items-center py-2 text-neutral-400'
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
