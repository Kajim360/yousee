"use client";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function HBarChart({ data, height = 260 }: { data: { name: string; value: number; color?: string }[]; height?: number }) {
  if (!data.length) return <p className="text-sm text-ink-soft">No data yet.</p>;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? "#B9D7F2"} stroke="#26384A" strokeWidth={0.5} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
