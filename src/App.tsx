import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AddTrade from './components/AddTrade';
import Analytics from './components/Analytics';
import TradeHistory from './components/TradeHistory';
import Withdrawals from './components/Withdrawals';
import DailyLogs from './components/DailyLogs';
import { View, Trade, Withdrawal, DailyLog, UserProfile } from './types';
import { TrendingUp, User as UserIcon, Settings as SettingsIcon, Menu, X, ShieldCheck } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setUserProfile(null);
        setTrades([]);
        setWithdrawals([]);
        setDailyLogs([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);

    // Profile initialization and listener
    const initProfile = async () => {
      try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          const newProfile = {
            uid: user.uid,
            email: user.email || user.phoneNumber || '',
            displayName: user.displayName || 'Trader',
            photoURL: user.photoURL || '',
            createdAt: Timestamp.now(),
            customFields: ['Agent', 'App Name'],
            brokers: ['Binance', 'Bybit', 'Exness', 'MT5', 'MT4', 'TradingView']
          };
          await setDoc(userRef, newProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    };

    initProfile();

    const unsubscribeProfile = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    // Data listeners
    const tradesQuery = query(
      collection(db, 'trades'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeTrades = onSnapshot(tradesQuery, (snapshot) => {
      const tradesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[];
      setTrades(tradesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trades');
    });

    const withdrawalsQuery = query(
      collection(db, 'withdrawals'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
      const withdrawalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Withdrawal[];
      setWithdrawals(withdrawalsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'withdrawals');
    });

    const logsQuery = query(
      collection(db, 'dailyLogs'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyLog[];
      setDailyLogs(logsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'dailyLogs');
    });

    return () => {
      unsubscribeProfile();
      unsubscribeTrades();
      unsubscribeWithdrawals();
      unsubscribeLogs();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary animate-pulse">Initializing TradeLog Pro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard trades={trades} withdrawals={withdrawals} latestLog={dailyLogs[0]} />;
      case 'add-trade':
        return <AddTrade onComplete={() => setCurrentView('dashboard')} userProfile={userProfile} />;
      case 'analytics':
        return <Analytics trades={trades} />;
      case 'history':
        return <TradeHistory trades={trades} />;
      case 'withdrawals':
        return <Withdrawals withdrawals={withdrawals} trades={trades} />;
      case 'daily-logs':
        return <DailyLogs logs={dailyLogs} />;
      case 'settings':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-accent" />
                  Profile Information
                </h3>
                <div className="flex items-center gap-4 mb-8">
                  <img src={user.photoURL || ''} alt="" className="w-16 h-16 rounded-full border-2 border-accent" />
                  <div>
                    <h3 className="text-xl font-semibold">{user.displayName}</h3>
                    <p className="text-text-secondary">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-background rounded-xl border border-border">
                    <p className="text-sm text-text-secondary mb-1">User ID</p>
                    <code className="text-xs">{user.uid}</code>
                  </div>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  Brokers / Platforms
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Manage the list of brokers you use. These will appear in the dropdown when logging trades.
                </p>
                <div className="space-y-3">
                  {userProfile?.brokers?.map((broker, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                      <span className="font-medium">{broker}</span>
                      <button 
                        onClick={async () => {
                          const newBrokers = userProfile.brokers?.filter((_, i) => i !== idx);
                          const userRef = doc(db, 'users', user.uid);
                          await updateDoc(userRef, { brokers: newBrokers });
                          setUserProfile({ ...userProfile, brokers: newBrokers });
                        }}
                        className="text-loss hover:text-loss/80 text-sm font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    <input 
                      type="text" 
                      placeholder="New broker name..." 
                      className="input-field flex-1"
                      id="new-broker-input"
                    />
                    <button 
                      onClick={async () => {
                        const input = document.getElementById('new-broker-input') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !userProfile?.brokers?.includes(val)) {
                          const newBrokers = [...(userProfile?.brokers || []), val];
                          const userRef = doc(db, 'users', user.uid);
                          await updateDoc(userRef, { brokers: newBrokers });
                          setUserProfile({ ...userProfile, brokers: newBrokers });
                          input.value = '';
                        }
                      }}
                      className="btn-primary"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-accent" />
                  Custom Trade Fields
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Manage the fields you want to track for each trade (e.g., Broker, Agent, Strategy).
                </p>
                <div className="space-y-3">
                  {userProfile?.customFields?.map((field, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                      <span className="font-medium">{field}</span>
                      <button 
                        onClick={async () => {
                          const newFields = userProfile.customFields?.filter((_, i) => i !== idx);
                          const userRef = doc(db, 'users', user.uid);
                          await updateDoc(userRef, { customFields: newFields });
                          setUserProfile({ ...userProfile, customFields: newFields });
                        }}
                        className="text-loss hover:text-loss/80 text-sm font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    <input 
                      type="text" 
                      placeholder="New field name..." 
                      className="input-field flex-1"
                      id="new-field-input"
                    />
                    <button 
                      onClick={async () => {
                        const input = document.getElementById('new-field-input') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !userProfile?.customFields?.includes(val)) {
                          const newFields = [...(userProfile?.customFields || []), val];
                          const userRef = doc(db, 'users', user.uid);
                          await updateDoc(userRef, { customFields: newFields });
                          setUserProfile({ ...userProfile, customFields: newFields });
                          input.value = '';
                        }
                      }}
                      className="btn-primary"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard trades={trades} withdrawals={withdrawals} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(v) => {
          setCurrentView(v);
          setSidebarOpen(false);
        }} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className={cn(
        "flex-1 min-h-screen flex flex-col transition-all duration-300",
        "md:ml-64"
      )}>
        <header className="h-20 border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 bg-background/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-border rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6 text-text-primary" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-text-secondary hidden sm:inline">Pages</span>
              <span className="text-text-secondary hidden sm:inline">/</span>
              <span className="text-text-primary font-medium capitalize">{currentView.replace('-', ' ')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-text-primary">{userProfile?.displayName || 'Trader'}</span>
              <span className="text-xs text-text-secondary">Trader</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <UserIcon className="text-accent w-6 h-6" />
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {renderView()}
        </div>

        <footer className="p-6 text-center border-t border-border">
          <p className="text-text-secondary text-sm">
            TradeLog Pro &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  );
}
