export default function AmPmCard({ title, am, pm }: { title: string; am: number | null; pm: number | null }) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <div className="text-xs text-neutral-500 uppercase tracking-wide">{title}</div>
      <div className="flex gap-6 mt-2">
        <div>
          <div className="text-xs text-neutral-500">AM</div>
          <div className="text-xl font-semibold">{am === null ? '—' : am.toFixed(2)}<span className="text-base text-neutral-500"> kg</span></div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">PM</div>
          <div className="text-xl font-semibold">{pm === null ? '—' : pm.toFixed(2)}<span className="text-base text-neutral-500"> kg</span></div>
        </div>
      </div>
    </div>
  );
}
