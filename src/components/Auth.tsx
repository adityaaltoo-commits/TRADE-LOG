import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { TrendingUp, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setShowSetupGuide(false);

    // Transform username to a fake email for Firebase Auth
    // Use a standard domain like .com to avoid auth/invalid-email
    const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const email = `${sanitizedUsername}@tradelog.com`;
    console.log('Attempting auth with:', { username, sanitizedUsername, email, isSignUp });

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err.code, err.message);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Login method not enabled.');
        setShowSetupGuide(true);
      } else if (err.code === 'auth/user-not-found') {
        setError('User not found. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Username is already taken.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid username format.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-8 rounded-2xl space-y-8"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center shadow-2xl shadow-accent/40 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <TrendingUp className="text-white w-12 h-12 relative z-10" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">TradeLog Pro</h1>
            <p className="text-text-secondary mt-2 font-medium">
              {isSignUp ? 'Create your professional journal' : 'Welcome back, Trader'}
            </p>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Username</label>
              <span className="text-[10px] text-text-secondary/50 italic">3-30 characters</span>
            </div>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-accent transition-colors" />
              <input
                required
                type="text"
                placeholder="Enter username"
                className="input-field w-full pl-12 py-4 bg-background/40 border-border/50 focus:border-accent/50 transition-all"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Password</label>
              <span className="text-[10px] text-text-secondary/50 italic">Min. 6 characters</span>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-accent transition-colors" />
              <input
                required
                type="password"
                placeholder="••••••••"
                className="input-field w-full pl-12 py-4 bg-background/40 border-border/50 focus:border-accent/50 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="space-y-3">
              <div className="p-3 bg-loss/10 border border-loss/20 rounded-xl flex items-center gap-2 text-loss text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
              
              {showSetupGuide && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-accent/10 border border-accent/20 rounded-xl space-y-3 text-left"
                >
                  <p className="text-xs text-white font-bold uppercase tracking-wider">Action Required:</p>
                  <ol className="text-xs text-text-secondary space-y-2 list-decimal list-inside">
                    <li>Open <a href="https://console.firebase.google.com/project/gen-lang-client-0469700952/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-bold">Firebase Console</a></li>
                    <li>Click <strong>"Add new provider"</strong></li>
                    <li>Select <strong>"Email/Password"</strong></li>
                    <li>Enable the first switch and click <strong>"Save"</strong></li>
                  </ol>
                  <p className="text-[10px] text-text-secondary italic">This is required once to allow the username system to work.</p>
                </motion.div>
              )}
            </div>
          )}

          <button
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-sm text-text-secondary">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-accent font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>

        <p className="text-xs text-text-secondary text-center">
          By continuing, you agree to TradeLog Pro's Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
