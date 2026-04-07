import React, { useState } from 'react';
import { DailyLog } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { MessageSquare, Plus, Trash2, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DailyLogsProps {
  logs: DailyLog[];
}

export default function DailyLogs({ logs }: DailyLogsProps) {
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    sentiment: 'neutral' as 'neutral' | 'bullish' | 'bearish'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'dailyLogs'), {
        uid: auth.currentUser.uid,
        content: formData.content,
        sentiment: formData.sentiment,
        timestamp: Timestamp.now()
      });
      setShowAdd(false);
      setFormData({ content: '', sentiment: 'neutral' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'dailyLogs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this log entry?')) return;
    try {
      await deleteDoc(doc(db, 'dailyLogs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'dailyLogs');
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-profit" />;
      case 'bearish': return <TrendingDown className="w-4 h-4 text-loss" />;
      default: return <Minus className="w-4 h-4 text-text-secondary" />;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Daily Logs & Updates</h2>
          <p className="text-text-secondary text-sm">Store your thoughts, market updates, and daily summaries</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          New Log Entry
        </button>
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Market Sentiment</label>
              <div className="flex gap-2">
                {(['bullish', 'neutral', 'bearish'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({ ...formData, sentiment: s })}
                    className={cn(
                      "flex-1 py-2 rounded-xl border transition-all capitalize text-sm font-medium",
                      formData.sentiment === s 
                        ? "bg-accent/10 border-accent text-accent" 
                        : "border-border text-text-secondary hover:bg-white/5"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Update Content</label>
              <textarea
                required
                rows={4}
                className="input-field w-full resize-none"
                placeholder="What happened today? Any key updates or things to remember?"
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
              ></textarea>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
                {loading ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        {logs.map((log) => (
          <motion.div 
            key={log.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-6 rounded-2xl group relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg border border-border">
                  <Calendar className="w-4 h-4 text-text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {log.timestamp.toDate().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getSentimentIcon(log.sentiment)}
                    <span className="text-xs text-text-secondary capitalize">{log.sentiment} Sentiment</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(log.id)}
                className="p-2 hover:bg-loss/10 hover:text-loss rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{log.content}</p>
          </motion.div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-12 glass rounded-2xl">
            <MessageSquare className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-20" />
            <p className="text-text-secondary">No log entries yet. Start capturing your daily updates!</p>
          </div>
        )}
      </div>
    </div>
  );
}
