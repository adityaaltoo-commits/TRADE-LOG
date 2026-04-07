import React, { useState } from 'react';
import { Trade } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit2, 
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface TradeHistoryProps {
  trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');

  const filteredTrades = trades.filter(t => {
    const matchesSearch = t.asset.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    try {
      await deleteDoc(doc(db, 'trades', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'trades');
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Asset', 'Type', 'Entry', 'Exit', 'Quantity', 'Fees', 'PnL', 'Notes', 'Custom Data'];
    const rows = filteredTrades.map(t => [
      t.timestamp.toDate().toLocaleString(),
      t.asset,
      t.type,
      t.entryPrice,
      t.exitPrice || 'N/A',
      t.quantity,
      t.fees,
      t.pnl || 0,
      t.notes.replace(/,/g, ';'),
      JSON.stringify(t.customData || {}).replace(/,/g, ';')
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tradelog_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Trade History</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-border hover:bg-border/80 rounded-xl text-sm transition-all"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search assets or notes..."
                className="input-field w-full pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="input-field bg-card"
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
              >
                <option value="all">All Types</option>
                <option value="buy">Buy Only</option>
                <option value="sell">Sell Only</option>
              </select>
              <button className="p-2 bg-border rounded-xl hover:bg-border/80 transition-all">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background/50 text-text-secondary text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Asset</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Entry</th>
                <th className="px-6 py-4 font-semibold">Exit</th>
                <th className="px-6 py-4 font-semibold">Qty</th>
                <th className="px-6 py-4 font-semibold">PnL</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {trade.timestamp.toDate().toLocaleString()}
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
                  <td className="px-6 py-4 text-sm">{formatCurrency(trade.entryPrice)}</td>
                  <td className="px-6 py-4 text-sm">{trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}</td>
                  <td className="px-6 py-4 text-sm">{trade.quantity}</td>
                  <td className={cn("px-6 py-4 font-bold", !trade.pnl ? "text-text-secondary" : trade.pnl >= 0 ? "text-profit" : "text-loss")}>
                    {trade.pnl !== undefined ? (trade.pnl >= 0 ? '+' : '') + formatCurrency(trade.pnl) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(trade.id)}
                        className="p-2 hover:bg-loss/10 hover:text-loss rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-secondary">
                    No trades found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-border flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {filteredTrades.length} of {trades.length} trades
          </p>
          <div className="flex gap-2">
            <button className="p-2 bg-border rounded-lg disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 bg-border rounded-lg disabled:opacity-50" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
