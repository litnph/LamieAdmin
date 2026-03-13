import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1EA] via-[#FDF7F2] to-[#F0E1D3] flex items-center justify-center p-4 font-sans text-admin-text-primary">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10 bg-admin-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-admin-border/60 overflow-hidden">
        {/* Brand side */}
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-[#E7D4C5] via-[#F3E4D6] to-[#F9F1E7]">
          <div>
            <h2 className="text-3xl font-serif font-bold text-admin-text-primary mb-4">
              Lamie Flower Shop
            </h2>
            <p className="text-admin-text-secondary text-sm leading-relaxed max-w-sm">
              Curate delicate floral experiences and manage your bouquets, colors and occasions
              in a calm, focused admin crafted for Lamie.
            </p>
          </div>
          <div className="text-xs text-admin-text-secondary">
            Designed for florists who care about every petal.
          </div>
        </div>

        {/* Login Card */}
        <div className="p-8 md:p-10">
          <div className="mb-8 text-center md:text-left">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-admin-text-secondary mb-2">
              Lamie Admin
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-admin-text-primary">
              Welcome back, Lamie.
            </h2>
            <p className="text-admin-text-secondary text-sm mt-2">
              Sign in to manage products, master data and customers.
            </p>
          </div>
          
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
        
        <div className="bg-admin-muted/50 p-4 text-center border-t border-admin-border md:col-span-2 md:border-t-0 md:border-l">
          <p className="text-sm text-admin-text-secondary">
            Don't have an account? <span className="font-medium text-admin-primary cursor-not-allowed">Contact Administrator</span>
          </p>
        </div>
      </div>
    </div>
  );
};