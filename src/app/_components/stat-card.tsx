import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string | number | null;
  suffix?: string;
  icon?: LucideIcon;
};

export default function StatCard({ label, value, suffix, icon: Icon }: Props) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5">
      {Icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="text-xs uppercase tracking-wider text-neutral-500 mt-3">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-neutral-900">
        {value === null ? (
          '—'
        ) : (
          <>
            {value}
            {suffix && <span className="text-base text-neutral-500 ml-1">{suffix}</span>}
          </>
        )}
      </div>
    </div>
  );
}
