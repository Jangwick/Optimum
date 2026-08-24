import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { formatCurrency } from '../utils/currency.js';

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e2e5',
  borderRadius: '8px',
  fontSize: '13px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

// ponytail: raw hex palette for chart colors until design tokens are mapped to a chart palette.
const AGING_COLORS = ['#27ae60', '#f5a623', '#e67e22', '#e74c3c'];

export function VolumeChart({ monthlyData, weeklyData }) {
  const [view, setView] = useState('monthly');
  const data = view === 'monthly' ? monthlyData : weeklyData;

  return (
    <>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e5" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#7a7a7a' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#7a7a7a' }} allowDecimals={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#7a7a7a' }}
              tickFormatter={(v) => `₱${(v / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) =>
                name === 'Estimated Loss' ? [formatCurrency(value), name] : [value, name]
              }
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="claims"
              stroke="#102175"
              strokeWidth={2}
              name="Claims"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="estimatedLoss"
              stroke="#f26522"
              strokeWidth={2}
              name="Estimated Loss"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={() => setView('weekly')}
          className={`px-3 py-1 rounded text-label-sm border ${
            view === 'weekly'
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-surface border-surface-border text-on-surface-variant hover:bg-surface-container-low'
          }`}
          aria-pressed={view === 'weekly'}
        >
          Weekly
        </button>
        <button
          onClick={() => setView('monthly')}
          className={`px-3 py-1 rounded text-label-sm border ${
            view === 'monthly'
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-surface border-surface-border text-on-surface-variant hover:bg-surface-container-low'
          }`}
          aria-pressed={view === 'monthly'}
        >
          Monthly
        </button>
      </div>
    </>
  );
}

export function StatusBarChart({ data }) {
  const chartData = data.map((s) => ({
    name: s.status?.name || 'Unknown',
    count: s.count,
    color: s.status?.color || '#999',
  }));

  return (
    <div className="h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e5" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#7a7a7a' }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#5a5a5a' }} width={110} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" name="Claims" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AgingBarChart({ data }) {
  return (
    <div className="h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e5" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7a7a7a' }} />
          <YAxis tick={{ fontSize: 10, fill: '#7a7a7a' }} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" name="Claims" radius={[4, 4, 0, 0]}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={AGING_COLORS[idx % AGING_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
