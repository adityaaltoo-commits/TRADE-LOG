import React, { useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { TrendingUp, Plus, X, Calculator, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import { UserProfile } from '../types';

interface AddTradeProps {
  onComplete: () => void;
  userProfile: UserProfile | null;
}

export default function AddTrade({ onComplete, userProfile }: AddTradeProps) {
  const [loading, setLoading] = useState(false);
  const [newBroker, setNewBroker] = useState('');
  const [showAddBroker, setShowAddBroker] = useState(false);
  const [formData, setFormData] = useState({
    asset: '',
    broker: '',
    type: 'buy' as 'buy' | 'sell',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    fees: '0',
    stopLoss: '',
    takeProfit: '',
    notes: '',
    tags: [] as string[],
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    customData: {} as Record<string, string>
  });

  const [currentTag, setCurrentTag] = useState('');

  const calculatePnL = () => {
    const entry = parseFloat(formData.entryPrice);
    const exit = parseFloat(formData.exitPrice);
    const qty = parseFloat(formData.quantity);
    const fees = parseFloat(formData.fees || '0');

    if (isNaN(entry) || isNaN(exit) || isNaN(qty)) return null;

    const pnl = formData.type === 'buy' 
      ? (exit - entry) * qty - fees
      : (entry - exit) * qty - fees;
    
    return pnl;
  };

  const handleAddBroker = async () => {
    if (!auth.currentUser || !newBroker.trim()) return;
    if (userProfile?.brokers?.includes(newBroker.trim())) {
      setFormData({ ...formData, broker: newBroker.trim() });
      setNewBroker('');
      setShowAddBroker(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const updatedBrokers = [...(userProfile?.brokers || []), newBroker.trim()];
      await updateDoc(userRef, { brokers: updatedBrokers });
      setFormData({ ...formData, broker: newBroker.trim() });
      setNewBroker('');
      setShowAddBroker(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const pnl = calculatePnL();
      const tradeDate = new Date(`${formData.date}T${formData.time}`);

      await addDoc(collection(db, 'trades'), {
        uid: auth.currentUser.uid,
        asset: formData.asset.toUpperCase(),
        broker: formData.broker,
        type: formData.type,
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
        quantity: parseFloat(formData.quantity),
        fees: parseFloat(formData.fees || '0'),
        stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
        takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
        pnl: pnl,
        tags: formData.tags,
        notes: formData.notes,
        timestamp: Timestamp.fromDate(tradeDate),
        customData: formData.customData
      });

      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trades');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag] });
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const pnl = calculatePnL();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-4 md:p-8 rounded-2xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
            <TrendingUp className="text-accent w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Add New Trade</h2>
            <p className="text-text-secondary text-sm">Log your trading activity for analysis</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Asset Symbol</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. BTC, EURUSD"
                  className="input-field w-full"
                  value={formData.asset}
                  onChange={e => setFormData({ ...formData, asset: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-text-secondary">Select Broker / App</label>
                  <button 
                    type="button"
                    onClick={() => setShowAddBroker(!showAddBroker)}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Add New
                  </button>
                </div>

                  {showAddBroker && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex gap-2 mb-4"
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder="Enter broker name..."
                        className="input-field flex-1 text-sm"
                        value={newBroker}
                        onChange={e => setNewBroker(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddBroker())}
                      />
                      <button
                        type="button"
                        onClick={handleAddBroker}
                        className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold"
                      >
                        Add
                      </button>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {userProfile?.brokers?.map(broker => (
                      <button
                        key={broker}
                        type="button"
                        onClick={() => setFormData({ ...formData, broker })}
                        className={cn(
                          "px-3 py-2 rounded-xl border text-xs font-medium transition-all text-center truncate",
                          formData.broker === broker 
                            ? "bg-accent/10 border-accent text-accent shadow-sm shadow-accent/10" 
                            : "border-border text-text-secondary hover:bg-white/5"
                        )}
                      >
                        {broker}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, broker: 'Other' })}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-xs font-medium transition-all text-center",
                        formData.broker === 'Other' 
                          ? "bg-accent/10 border-accent text-accent" 
                          : "border-border text-text-secondary hover:bg-white/5"
                      )}
                    >
                      Other
                    </button>
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Trade Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'buy' })}
                    className={cn(
                      "flex-1 py-2 rounded-xl border transition-all font-bold uppercase text-xs",
                      formData.type === 'buy' ? "bg-profit/10 border-profit text-profit" : "border-border text-text-secondary"
                    )}
                  >
                    Buy / Long
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'sell' })}
                    className={cn(
                      "flex-1 py-2 rounded-xl border transition-all font-bold uppercase text-xs",
                      formData.type === 'sell' ? "bg-loss/10 border-loss text-loss" : "border-border text-text-secondary"
                    )}
                  >
                    Sell / Short
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
                  <input
                    required
                    type="date"
                    className="input-field w-full"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Time</label>
                  <input
                    required
                    type="time"
                    className="input-field w-full"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Entry Price</label>
                  <input
                    required
                    type="number"
                    step="any"
                    className="input-field w-full"
                    value={formData.entryPrice}
                    onChange={e => setFormData({ ...formData, entryPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Exit Price (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field w-full"
                    value={formData.exitPrice}
                    onChange={e => setFormData({ ...formData, exitPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
                  <input
                    required
                    type="number"
                    step="any"
                    className="input-field w-full"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Fees</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field w-full"
                    value={formData.fees}
                    onChange={e => setFormData({ ...formData, fees: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Stop Loss</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field w-full"
                    value={formData.stopLoss}
                    onChange={e => setFormData({ ...formData, stopLoss: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Take Profit</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field w-full"
                    value={formData.takeProfit}
                    onChange={e => setFormData({ ...formData, takeProfit: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {userProfile?.customFields && userProfile.customFields.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userProfile.customFields.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{field}</label>
                  <input
                    type="text"
                    placeholder={`Enter ${field.toLowerCase()}...`}
                    className="input-field w-full"
                    value={formData.customData[field] || ''}
                    onChange={e => setFormData({ 
                      ...formData, 
                      customData: { ...formData.customData, [field]: e.target.value } 
                    })}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tags and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Scalp, Swing, Mistake..."
                  className="input-field flex-1"
                  value={currentTag}
                  onChange={e => setCurrentTag(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="p-2 bg-accent rounded-xl text-white hover:bg-accent/90"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-border rounded-full text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-loss">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
              <textarea
                rows={3}
                className="input-field w-full resize-none"
                placeholder="Why did you take this trade?"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>
          </div>

          {/* PnL Preview */}
          <div className="bg-background/50 p-4 md:p-6 rounded-2xl border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Calculator className="text-text-secondary w-6 h-6" />
              <div>
                <p className="text-xs text-text-secondary uppercase font-bold tracking-wider">Estimated PnL</p>
                <p className={cn("text-xl md:text-2xl font-bold", pnl === null ? "text-text-secondary" : pnl >= 0 ? "text-profit" : "text-loss")}>
                  {pnl === null ? 'N/A' : (pnl >= 0 ? '+' : '') + pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={onComplete}
                className="btn-secondary flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 sm:flex-none min-w-[120px]"
              >
                {loading ? 'Saving...' : 'Save Trade'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

