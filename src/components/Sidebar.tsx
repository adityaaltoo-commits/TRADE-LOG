import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  BarChart3, 
  History, 
  Wallet, 
  Settings, 
  LogOut,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { View } from '../types';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentView, onViewChange, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-trade', label: 'Log Trade', icon: PlusCircle },
    { id: 'daily-logs', label: 'Daily Logs', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'Trade History', icon: History },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "w-64 h-screen fixed left-0 top-0 glass border-r border-border flex flex-col z-50 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
              TradeLog Pro
            </h1>
          </div>
        </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              currentView === item.id 
                ? "bg-accent text-white shadow-lg shadow-accent/20" 
                : "text-text-secondary hover:bg-border hover:text-text-primary"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              currentView === item.id ? "text-white" : "group-hover:text-accent"
            )} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-loss/10 hover:text-loss transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  </>
  );
}
