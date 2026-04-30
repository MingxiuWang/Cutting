'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const ranges = ['7d', '30d', '90d', 'all'] as const;
export type Range = typeof ranges[number];

export default function RangeSelector({ paramKey, current }: { paramKey: string; current: Range }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
      {ranges.map((r) => {
        const active = current === r;
        return (
          <button
            key={r}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.set(paramKey, r);
              router.push(`${pathname}?${next.toString()}`);
            }}
            className={
              active
                ? 'px-3 py-1 text-xs font-medium rounded-md transition-colors bg-emerald-600 text-white'
                : 'px-3 py-1 text-xs font-medium rounded-md transition-colors text-neutral-600 hover:text-neutral-900'
            }
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
