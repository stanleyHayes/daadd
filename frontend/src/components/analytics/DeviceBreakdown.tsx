import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme.store';

interface DeviceData {
  device: string;
  impressions: number;
  clicks: number;
  ctr: number;
  percentage: number;
}

interface DeviceBreakdownProps {
  data: DeviceData[];
  className?: string;
}

const COLORS = ['#2563EB', '#7C3AED', '#10B981'];

const deviceIcons: Record<string, React.ReactNode> = {
  desktop: <Monitor className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />,
};

export function DeviceBreakdown({ data, className }: DeviceBreakdownProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const chartData = data.map((d) => ({
    name: d.device.charAt(0).toUpperCase() + d.device.slice(1),
    value: d.percentage,
  }));

  return (
    <div className={cn('', className)}>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatPercentage(Number(value)), 'Share']}
              contentStyle={{
                backgroundColor: isDark ? '#1e293b' : '#fff',
                border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                color: isDark ? '#f1f5f9' : '#374151',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-3">
        {data.map((d, i) => (
          <div key={d.device} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-gray-500 dark:text-slate-400">{deviceIcons[d.device]}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300 capitalize">{d.device}</span>
            </div>
            <div className="text-sm text-gray-900 dark:text-white font-medium">
              {formatPercentage(d.ctr)} CTR
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
