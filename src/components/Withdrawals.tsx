import React, { useState } from 'react';
import { Withdrawal, Trade } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Wallet, Plus, Trash2, Calendar, DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { formatCurrency, formatINR, formatPercent, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface WithdrawalsProps {
  withdrawals: Withdrawal[];
  trades: Trade[];
}

export default function Withdrawals({ withdrawals, trades }: WithdrawalsProps) {
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const totalWithdrawn = withdrawals.reduce((acc, w) => acc + w.amount, 0);
  const totalPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const totalInvested = trades.reduce((acc, t) => acc + (t.entryPrice * t.quantity), 0);
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const remainingProfit = totalPnL - totalWithdrawn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'withdrawals'), {
        uid: auth.currentUser.uid,
        amount: parseFloat(formData.amount),
        date: Timestamp.fromDate(new Date(formData.date)),
        notes: formData.notes,
        timestamp: Timestamp.now()
      });
      setShowAdd(false);
      setFormData({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this withdrawal record?')) return;
    try {
      await deleteDoc(doc(db, 'withdrawals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'withdrawals');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Withdrawals</h2>
          <p className="text-text-secondary text-sm">Track your payouts and realized profits</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Add Withdrawal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass p-4 md:p-6 rounded-2xl">
          <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 w-fit mb-4">
            <Wallet className="text-accent w-6 h-6" />
          </div>
          <p className="text-text-secondary text-sm font-medium">Total Withdrawn</p>
          <h3 className="text-xl md:text-2xl font-bold text-white mt-1">{formatCurrency(totalWithdrawn)}</h3>
          <p className="text-xs text-text-secondary mt-1">{formatINR(totalWithdrawn)}</p>
        </div>

        <div className="glass p-4 md:p-6 rounded-2xl">
          <div className={cn("p-3 rounded-xl border w-fit mb-4", totalPnL >= 0 ? "bg-profit/10 border-profit/20" : "bg-loss/10 border-loss/20")}>
            {totalPnL >= 0 ? <TrendingUp className="text-profit w-6 h-6" /> : <TrendingDown className="text-loss w-6 h-6" />}
          </div>
          <p className="text-text-secondary text-sm font-medium">Total Net PnL</p>
          <h3 className={cn("text-xl md:text-2xl font-bold mt-1", totalPnL >= 0 ? "text-profit" : "text-loss")}>
            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
          </h3>
          <p className="text-xs text-text-secondary mt-1">{formatINR(totalPnL)}</p>
        </div>

        <div className="glass p-4 md:p-6 rounded-2xl">
          <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 w-fit mb-4">
            <Percent className="text-accent w-6 h-6" />
          </div>
          <p className="text-text-secondary text-sm font-medium">PnL Percentage</p>
          <h3 className={cn("text-xl md:text-2xl font-bold mt-1", pnlPercent >= 0 ? "text-profit" : "text-loss")}>
            {pnlPercent >= 0 ? '+' : ''}{formatPercent(pnlPercent)}
          </h3>
          <p className="text-xs text-text-secondary mt-1">On total volume</p>
        </div>

        <div className="glass p-4 md:p-6 rounded-2xl">
          <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 w-fit mb-4">
            <DollarSign className="text-accent w-6 h-6" />
          </div>
          <p className="text-text-secondary text-sm font-medium">Remaining Profit</p>
          <h3 className="text-xl md:text-2xl font-bold text-white mt-1">{formatCurrency(remainingProfit)}</h3>
          <p className="text-xs text-text-secondary mt-1">{formatINR(remainingProfit)}</p>
        </div>
      </div>

      <div className="space-y-6">
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-2xl border-accent/30"
          >
            <h3 className="text-lg font-bold mb-4">New Withdrawal</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    required
                    type="number"
                    step="any"
                    className="input-field w-full pl-10"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Date</label>
                <input
                  required
                  type="date"
                  className="input-field w-full"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Notes</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="e.g. Monthly payout, Bank transfer..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background/50 text-text-secondary text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Notes</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      {w.date.toDate().toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">{formatCurrency(w.amount)}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{w.notes || '-'}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDelete(w.id)}
                      className="p-2 hover:bg-loss/10 hover:text-loss rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-secondary">
                    No withdrawal records found.
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
