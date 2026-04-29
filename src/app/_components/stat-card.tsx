export default function StatCard({ label, value, suffix }: { label: string; value: string | number | null; suffix?: string }) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <div className="text-xs text-neutral-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1">
        {value === null ? '—' : value}
        {suffix && value !== null ? <span className="text-base text-neutral-500"> {suffix}</span> : null}
      </div>
    </div>
  );
}
