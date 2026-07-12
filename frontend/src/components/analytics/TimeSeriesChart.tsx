import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme.store';

interface LineConfig {
  dataKey: string;
  color: string;
  name: string;
}

interface TimeSeriesChartProps {
  data: object[];
  lines: LineConfig[];
  xKey: string;
  height?: number;
}

export function TimeSeriesChart({ data, lines, xKey, height = 300 }: TimeSeriesChartProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f3f4f6'} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#9ca3af' }}
            tickLine={false}
            axisLine={{ stroke: isDark ? '#475569' : '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => formatNumber(val)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1e293b' : '#fff',
              border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              padding: '12px 16px',
              color: isDark ? '#f1f5f9' : '#374151',
            }}
            labelStyle={{ color: isDark ? '#f1f5f9' : '#374151', fontWeight: 600, marginBottom: 4 }}
            formatter={(value, name) => [formatNumber(Number(value)), String(name)]}
          />
          <Legend
            wrapperStyle={{ paddingTop: '16px' }}
            formatter={(value: string) => <span className="text-sm text-gray-600 dark:text-slate-400">{value}</span>}
          />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
