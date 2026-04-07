import React from 'react';
import { Trade } from '../types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { Trophy, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AnalyticsProps {
  trades: Trade[];
}

export default function Analytics({ trades }: AnalyticsProps) {
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);
  
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((acc, t) => acc + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((acc, t) => acc + t.pnl, 0) / losses.length : 0;
  const profitFactor = Math.abs(avgLoss) > 0 ? (wins.reduce((acc, t) => acc + t.pnl, 0)) / Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0)) : 0;

  // Pie Chart Data
  const pieData = [
    { name: 'Wins', value: wins.length },
    { name: 'Losses', value: losses.length },
  ];
  const COLORS = ['#22C55E', '#EF4444'];

  // Bar Chart Data (PnL by Asset)
  const assetPnL: Record<string, number> = {};
  trades.forEach(t => {
    assetPnL[t.asset] = (assetPnL[t.asset] || 0) + t.pnl;
  });
  const barData = Object.entries(assetPnL)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const bestAsset = barData[0]?.name || 'N/A';

  const metrics = [
    { label: 'Win Rate', value: formatPercent(winRate), icon: Trophy, color: 'text-profit' },
    { label: 'Avg Win', value: formatCurrency(avgWin), icon: TrendingUp, color: 'text-profit' },
    { label: 'Avg Loss', value: formatCurrency(avgLoss), icon: AlertCircle, color: 'text-loss' },
    { label: 'Profit Factor', value: profitFactor.toFixed(2), icon: Target, color: 'text-accent' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-4 md:p-6 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <m.icon className={cn("w-5 h-5", m.color)} />
              <span className="text-text-secondary text-sm font-medium">{m.label}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold">{m.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Win/Loss Distribution */}
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-xl font-bold mb-8">Win vs Loss Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={1000}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111827', 
                    border: '1px solid #1F2937', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PnL by Asset */}
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-xl font-bold mb-8">Profit/Loss by Asset</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  cursor={{ fill: '#1F2937', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: '#111827', 
                    border: '1px solid #1F2937', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#22C55E' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-2xl">
        <h3 className="text-xl font-bold mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-background rounded-xl border border-border">
            <p className="text-text-secondary text-sm mb-1">Best Performing Asset</p>
            <p className="text-xl font-bold text-profit">{bestAsset}</p>
          </div>
          <div className="p-4 bg-background rounded-xl border border-border">
            <p className="text-text-secondary text-sm mb-1">Total Trading Volume</p>
            <p className="text-xl font-bold text-accent">
              {trades.reduce((acc, t) => acc + (t.entryPrice * t.quantity), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div className="p-4 bg-background rounded-xl border border-border">
            <p className="text-text-secondary text-sm mb-1">Total Fees Paid</p>
            <p className="text-xl font-bold text-loss">
              {trades.reduce((acc, t) => acc + (t.fees || 0), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

