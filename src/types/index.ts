import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  customFields?: string[];
  brokers?: string[];
}

export interface Trade {
  id: string;
  uid: string;
  asset: string;
  broker?: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  fees: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl?: number;
  tags: string[];
  notes: string;
  timestamp: Timestamp;
  customData?: Record<string, string>;
}

export interface Withdrawal {
  id: string;
  uid: string;
  amount: number;
  date: Timestamp;
  notes: string;
  timestamp: Timestamp;
}

export interface DailyLog {
  id: string;
  uid: string;
  content: string;
  sentiment: 'neutral' | 'bullish' | 'bearish';
  timestamp: Timestamp;
}

export type View = 'dashboard' | 'add-trade' | 'analytics' | 'history' | 'withdrawals' | 'daily-logs' | 'settings';
