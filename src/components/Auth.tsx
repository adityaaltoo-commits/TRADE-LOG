import React from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-8 rounded-2xl text-center space-y-8"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-2xl shadow-accent/40">
            <TrendingUp className="text-white w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">TradeLog Pro</h1>
            <p className="text-text-secondary mt-2">The ultimate trading journal for professionals</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        <p className="text-xs text-text-secondary">
          By continuing, you agree to TradeLog Pro's Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
