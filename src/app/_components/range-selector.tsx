'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const ranges = ['7d', '30d', '90d', 'all'] as const;
export type Range = typeof ranges[number];

export default function RangeSelector({ paramKey, current }: { paramKey: string; current: Range }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  return (
    <div className="flex gap-1 text-xs">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set(paramKey, r);
            router.push(`${pathname}?${next.toString()}`);
          }}
          className={`px-2 py-1 rounded ${current === r ? 'bg-black text-white' : 'border'}`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
