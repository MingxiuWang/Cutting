'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Props = {
  title: string;
  data: { date: string; weight: number }[];
  headerRight?: React.ReactNode;
};

// Format ISO timestamps in the viewer's local timezone, not UTC.
const fmtTick = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
const fmtLabel = (iso: unknown) =>
  typeof iso === 'string'
    ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

export default function WeightChart({ title, data, headerRight }: Props) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-neutral-700">{title}</div>
        {headerRight}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#737373' }}
              stroke="#e5e5e5"
              tickFormatter={fmtTick}
            />
            <YAxis tick={{ fontSize: 11, fill: '#737373' }} stroke="#e5e5e5" domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '12px' }}
              labelFormatter={fmtLabel}
            />
            <Line type="monotone" dataKey="weight" stroke="#059669" strokeWidth={2} dot={{ r: 2, fill: '#059669' }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
