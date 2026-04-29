'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/_actions/session';

const items = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/charts', label: 'Charts' },
  { href: '/entries', label: 'Entries' },
  { href: '/cuts', label: 'Cuts' },
  { href: '/settings', label: 'Settings' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <>
      <nav className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 md:border-r bg-white p-4 gap-1">
        <div className="font-bold text-xl mb-4">Cutting</div>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded p-2 text-sm ${pathname.startsWith(it.href) ? 'bg-neutral-100 font-medium' : 'hover:bg-neutral-50'}`}
          >
            {it.label}
          </Link>
        ))}
        <form action={logout} className="mt-auto">
          <button type="submit" className="text-sm text-neutral-600 hover:text-black p-2">Sign out</button>
        </form>
      </nav>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`flex-1 text-center py-3 text-xs ${pathname.startsWith(it.href) ? 'text-black font-medium' : 'text-neutral-500'}`}
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
