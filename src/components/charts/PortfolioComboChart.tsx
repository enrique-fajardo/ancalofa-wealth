'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Brush,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ComboChartData {
  label: string;       // Month label ("Oct 2021")
  capital: number;     // Cumulative capital (COP)
  returns: number;     // Cumulative returns (COP)
  return_pct: number;  // Modified Dietz monthly return %
  ipc_co?: number;     // IPC Colombia YoY % (may be missing)
  cpi_us?: number;     // US CPI YoY % (may be missing)
}

interface PortfolioComboChartProps {
  data: ComboChartData[];
  height?: number;
  labels: {
    capital: string;
    returns: string;
    monthlyReturn: string;
    ipcColombia: string;
    cpiUs: string;
  };
  formatCurrency: (v: number) => string;
}

// ─── Design System Colors ──────────────────────────────────────────────────

const COLORS = {
  capital: '#00529F',      // Primary blue
  returns: '#FEBE10',      // Accent gold
  returnPct: '#14853D',    // Success green
  ipcCo: '#FB8C00',        // Warning orange
  cpiUs: '#8B8B8E',        // Neutral gray
  grid: '#E2E5E9',
  text: '#8B8B8E',
};

// ─── Custom Tooltip ────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  formatCurrency: (v: number) => string;
}

function CustomTooltip({ active, payload, label, formatCurrency }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/95 border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((entry) => {
        const isPercent = ['return_pct', 'ipc_co', 'cpi_us'].includes(entry.dataKey);
        const formatted = isPercent
          ? `${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(2)}%`
          : formatCurrency(entry.value);

        return (
          <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900 ml-auto">{formatted}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PortfolioComboChart({
  data,
  height = 420,
  labels,
  formatCurrency,
}: PortfolioComboChartProps) {
  // Default Brush shows last 12 months
  const defaultStartIdx = Math.max(0, data.length - 12);

  // Determine if we have inflation data to show
  const hasIpcCo = data.some(d => d.ipc_co !== undefined && d.ipc_co !== null);
  const hasCpiUs = data.some(d => d.cpi_us !== undefined && d.cpi_us !== null);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />

        {/* X-Axis — month labels */}
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: COLORS.text }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />

        {/* Left Y-Axis — COP values (bars) */}
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10, fill: COLORS.text }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCurrency}
          width={75}
        />

        {/* Right Y-Axis — Percentage (lines) */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: COLORS.text }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
          width={50}
        />

        {/* Custom Tooltip */}
        <Tooltip
          content={<CustomTooltip formatCurrency={formatCurrency} />}
        />

        {/* Legend */}
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
        />

        {/* Stacked Bars — Capital + Returns = Balance */}
        <Bar
          yAxisId="left"
          dataKey="capital"
          stackId="balance"
          fill={COLORS.capital}
          name={labels.capital}
          barSize={20}
        />
        <Bar
          yAxisId="left"
          dataKey="returns"
          stackId="balance"
          fill={COLORS.returns}
          name={labels.returns}
          radius={[2, 2, 0, 0]}
          barSize={20}
        />

        {/* Lines — Monthly Return % */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="return_pct"
          stroke={COLORS.returnPct}
          strokeWidth={2}
          dot={false}
          name={labels.monthlyReturn}
          connectNulls
        />

        {/* Lines — IPC Colombia (if data exists) */}
        {hasIpcCo && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="ipc_co"
            stroke={COLORS.ipcCo}
            strokeWidth={1.5}
            dot={false}
            name={labels.ipcColombia}
            connectNulls
          />
        )}

        {/* Lines — US CPI (if data exists, dashed) */}
        {hasCpiUs && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cpi_us"
            stroke={COLORS.cpiUs}
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            name={labels.cpiUs}
            connectNulls
          />
        )}

        {/* Brush — horizontal scroll, defaults to last 12 months */}
        {data.length > 12 && (
          <Brush
            dataKey="label"
            height={28}
            startIndex={defaultStartIdx}
            endIndex={data.length - 1}
            stroke={COLORS.capital}
            fill="#F7F8FA"
            tickFormatter={(v: string) => v}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
