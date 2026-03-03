'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartDataPoint {
  label: string;
  value: number;
  secondary?: number;
}

interface PortfolioLineChartProps {
  data: ChartDataPoint[];
  height?: number;
  formatValue: (v: number) => string;
  secondaryLabel?: string;
  primaryLabel?: string;
  color?: string;
  secondaryColor?: string;
  className?: string;
}

export default function PortfolioLineChart({
  data, height = 300, formatValue, primaryLabel, secondaryLabel,
  color = '#00529F', secondaryColor = '#8A2BE2', className,
}: PortfolioLineChartProps) {
  const hasSecondary = data.some(d => d.secondary !== undefined);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.15} />
              <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E5E9" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8B8B8E' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#8B8B8E' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatValue(v)} width={80} />
          <Tooltip
            formatter={(value: number | undefined) => [formatValue(value ?? 0), '']}
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #E2E5E9',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
            }}
          />
          {hasSecondary && primaryLabel && secondaryLabel && (
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          )}
          <Area
            type="monotone"
            dataKey="value"
            name={primaryLabel || 'Value'}
            stroke={color}
            strokeWidth={2}
            fill="url(#colorPrimary)"
          />
          {hasSecondary && (
            <Area
              type="monotone"
              dataKey="secondary"
              name={secondaryLabel || 'Secondary'}
              stroke={secondaryColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#colorSecondary)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
