import React from 'react';
import { DailyLog, Trade, Withdrawal } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  MessageSquare
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';

interface DashboardProps {
  trades: Trade[];
  withdrawals: Withdrawal[];
  latestLog?: DailyLog;
}

export default function Dashboard({ trades, withdrawals, latestLog }: DashboardProps) {
  const totalTrades = trades.length;
  const netProfit = trades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);
  const completedTrades = trades.filter(t => t.pnl !== undefined);
  const winRate = completedTrades.length > 0 
    ? (completedTrades.filter(t => (t.pnl || 0) > 0).length / completedTrades.length) * 100 
    : 0;
  const totalWithdrawn = withdrawals.reduce((acc, w) => acc + w.amount, 0);

  // Prepare chart data (Equity Curve)
  let currentEquity = 0;
  const chartData = [...trades].reverse().filter(t => t.pnl !== undefined).map((trade, index) => {
    currentEquity += (trade.pnl || 0);
    return {
      name: `T${index + 1}`,
      equity: currentEquity,
      date: trade.timestamp.toDate().toLocaleDateString()
    };
  });

  const stats = [
    { label: 'Total Trades', value: totalTrades, icon: Activity, color: 'text-accent' },
    { label: 'Net Profit/Loss', value: formatCurrency(netProfit), icon: netProfit >= 0 ? TrendingUp : TrendingDown, color: netProfit >= 0 ? 'text-profit' : 'text-loss' },
    { label: 'Win Rate', value: formatPercent(winRate), icon: TrendingUp, color: 'text-accent' },
    { label: 'Total Withdrawn', value: formatCurrency(totalWithdrawn), icon: Wallet, color: 'text-text-primary' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-4 md:p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl bg-background border border-border", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
            <h3 className={cn("text-xl md:text-2xl font-bold mt-1", stat.color)}>{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Latest Daily Log */}
      {latestLog && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border-l-4 border-accent"
        >
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-accent" />
            <h4 className="font-bold text-white">Latest Daily Update</h4>
            <span className="text-xs text-text-secondary ml-auto">{latestLog.timestamp.toDate().toLocaleDateString()}</span>
          </div>
          <p className="text-text-primary text-sm line-clamp-2 italic">"{latestLog.content}"</p>
        </motion.div>
      )}

      {/* Equity Curve Chart */}
      <div className="glass p-8 rounded-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold">Equity Curve</h3>
            <p className="text-text-secondary text-sm">Performance over time</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full border border-accent/20">Real-time</span>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111827', 
                  border: '1px solid #1F2937', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: '#E5E7EB' }}
                cursor={{ stroke: '#3B82F6', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="equity" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEquity)" 
                isAnimationActive={true}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-xl font-bold">Recent Trades</h3>
          <button className="text-accent text-sm font-medium hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background/50 text-text-secondary text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Asset</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Entry/Exit</th>
                <th className="px-6 py-4 font-semibold">PnL</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trades.slice(0, 5).map((trade) => (
                <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-text-secondary" />
                      <span className="text-sm">{trade.timestamp.toDate().toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-accent">{trade.asset}</div>
                    {trade.broker && <div className="text-[10px] text-text-secondary">{trade.broker}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                      trade.type === 'buy' ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                    )}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="text-text-secondary">In:</span> {formatCurrency(trade.entryPrice)}
                    </div>
                    <div className="text-sm">
                      <span className="text-text-secondary">Out:</span> {trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}
                    </div>
                  </td>
                  <td className={cn("px-6 py-4 font-bold", !trade.pnl ? "text-text-secondary" : trade.pnl >= 0 ? "text-profit" : "text-loss")}>
                    {trade.pnl !== undefined ? (trade.pnl >= 0 ? '+' : '') + formatCurrency(trade.pnl) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {trade.pnl === undefined ? (
                      <div className="flex items-center gap-1 text-accent text-xs">
                        <Clock className="w-4 h-4" />
                        <span>Open</span>
                      </div>
                    ) : trade.pnl >= 0 ? (
                      <div className="flex items-center gap-1 text-profit text-xs">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Profit</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-loss text-xs">
                        <ArrowDownRight className="w-4 h-4" />
                        <span>Loss</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                    No trades found. Start by adding your first trade!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

