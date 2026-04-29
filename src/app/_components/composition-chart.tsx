'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

type Point = { date: string; fat: number; muscle: number; water: number };

export default function CompositionChart({ title, data }: { title: string; data: Point[] }) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="fat" stroke="#dc2626" dot={false} />
            <Line type="monotone" dataKey="muscle" stroke="#059669" dot={false} />
            <Line type="monotone" dataKey="water" stroke="#2563eb" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
