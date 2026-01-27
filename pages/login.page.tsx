import React, { useState } from 'react';
import { Flower2, Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, validation and API calls would go here
    onLogin();
  };

  return (
    <div className="min-h-screen bg-admin-bg flex flex-col items-center justify-center p-4 font-sans text-admin-text-primary">
      
      {/* Brand Header */}
      <div className="mb-8 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-admin-muted mb-4 shadow-sm text-admin-primary">
          <Flower2 size={32} />
        </div>
        <h1 className="font-serif text-3xl font-bold text-admin-text-primary">Florist.</h1>
        <p className="text-admin-text-secondary mt-2">Admin Management Dashboard</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-admin-card rounded-2xl shadow-xl border border-admin-border overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-serif font-semibold text-admin-text-primary mb-6 text-center">Welcome Back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-secondary" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@florist.com"
                  className="w-full pl-12 pr-4 py-3 bg-admin-card border border-admin-input-border rounded-xl text-admin-text-primary placeholder-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-admin-text-secondary">Password</label>
                <a href="#" className="text-xs font-medium text-admin-text-secondary hover:text-admin-primary transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-secondary" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-admin-card border border-admin-input-border rounded-xl text-admin-text-primary placeholder-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-input-focus/20 focus:border-admin-input-focus transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-admin-primary hover:bg-admin-primary-hover text-admin-text-inverse font-medium rounded-xl transition-all duration-200 shadow-lg shadow-admin-primary/10 active:scale-[0.98]"
            >
              <span>Sign In</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
        
        <div className="bg-admin-muted/50 p-4 text-center border-t border-admin-border">
          <p className="text-sm text-admin-text-secondary">
            Don't have an account? <span className="font-medium text-admin-primary cursor-not-allowed">Contact Administrator</span>
          </p>
        </div>
      </div>

      <div className="mt-8 text-xs text-admin-text-muted">
        &copy; 2024 Florist Inc. All rights reserved.
      </div>
    </div>
  );
};