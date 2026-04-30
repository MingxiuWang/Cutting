import { Sun, Moon } from 'lucide-react';

export default function AmPmCard({ title, am, pm }: { title: string; am: number | null; pm: number | null }) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5">
      <div className="text-xs uppercase tracking-wider text-neutral-500">{title}</div>
      <div className="grid grid-cols-2 mt-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <Sun className="w-4 h-4 text-amber-500" />
            AM
          </div>
          <div className="mt-1 text-xl font-semibold text-neutral-900">
            {am === null ? '—' : am.toFixed(2)}
            {am !== null && <span className="text-base text-neutral-500 ml-1">kg</span>}
          </div>
        </div>
        <div className="border-l border-neutral-200 pl-6">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <Moon className="w-4 h-4 text-indigo-500" />
            PM
          </div>
          <div className="mt-1 text-xl font-semibold text-neutral-900">
            {pm === null ? '—' : pm.toFixed(2)}
            {pm !== null && <span className="text-base text-neutral-500 ml-1">kg</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
