'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

type Point = { date: string; fat: number | null; muscle: number | null; water: number | null };

type Props = {
  title: string;
  data: Point[];
  headerRight?: React.ReactNode;
};

export default function CompositionChart({ title, data, headerRight }: Props) {
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
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#737373' }} stroke="#e5e5e5" />
            <YAxis tick={{ fontSize: 11, fill: '#737373' }} stroke="#e5e5e5" domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="fat" stroke="#dc2626" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="muscle" stroke="#059669" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="water" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
