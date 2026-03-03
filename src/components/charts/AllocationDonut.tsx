'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { AllocationTarget } from '@/types';

interface AllocationDonutProps {
  data: AllocationTarget[];
  className?: string;
}

const COLORS = ['#00529F', '#8A2BE2', '#FEBE10', '#14853D', '#8B8B8E'];

export default function AllocationDonut({ data, className }: AllocationDonutProps) {
  const chartData = data.map(d => ({ name: d.description, value: d.actual_pct }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => [`${value ?? 0}%`, '']}
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #E2E5E9',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {data.map((d, i) => (
          <div key={d.sleeve_id} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {d.description} ({d.actual_pct}%)
          </div>
        ))}
      </div>
    </div>
  );
}
