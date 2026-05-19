import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Flower2 } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getApiErrorMessage } from '@/shared/utils/apiError';

export const LoginPage: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: doLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await doLogin(login, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith('/') ? from : '/admin', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] via-[#FDF9F5] to-[#F0E8DE] flex items-center justify-center p-4 font-sans text-admin-text-primary relative overflow-hidden">
      <div className="absolute top-20 left-20 w-72 h-72 bg-admin-primary/8 rounded-full blur-3xl animate-fade-in" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-admin-accent/8 rounded-full blur-3xl animate-fade-in" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 glass-strong rounded-3xl shadow-2xl shadow-black/8 border border-white/50 overflow-hidden animate-scale-in relative z-10">
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-admin-primary/5 via-admin-muted/50 to-admin-accent-light/30 border-r border-white/30">
          <div className="animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-admin-primary/10 flex items-center justify-center mb-6">
              <Flower2 size={24} className="text-admin-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-admin-text-primary mb-3 tracking-tight">
              Lamie Flower Shop
            </h2>
            <p className="text-admin-text-secondary text-sm leading-relaxed max-w-xs">
              Quản trị đơn hàng, kênh bán và sản phẩm — đăng nhập bằng email hoặc tên đăng nhập theo API Lamie.
            </p>
          </div>
          <p className="text-[11px] text-admin-text-muted animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Designed for florists who care about every petal.
          </p>
        </div>

        <div className="p-8 md:p-10">
          <div className="mb-8 animate-fade-in-up">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-admin-text-muted mb-2">
              Lamie Admin
            </p>
            <h2 className="text-2xl font-serif font-semibold text-admin-text-primary tracking-tight">
              Welcome back.
            </h2>
            <p className="text-admin-text-secondary text-sm mt-1.5">
              Đăng nhập để tiếp tục phiên làm việc.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <label className="block text-xs font-medium text-admin-text-secondary mb-2">Email hoặc tên đăng nhập</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted group-focus-within:text-admin-primary transition-colors" size={18} />
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="admin@lamie.com"
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-admin-input-border/80 rounded-xl text-admin-text-primary placeholder-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-primary/15 focus:border-admin-primary/40 focus:bg-white/70 transition-all duration-200"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-medium text-admin-text-secondary">Mật khẩu</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted group-focus-within:text-admin-primary transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-admin-input-border/80 rounded-xl text-admin-text-primary placeholder-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-primary/15 focus:border-admin-primary/40 focus:bg-white/70 transition-all duration-200"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-admin-primary hover:bg-admin-primary-hover text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-admin-primary/15 btn-press mt-2 disabled:opacity-60"
            >
              <span>{submitting ? 'Đang đăng nhập…' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-center text-xs text-admin-text-muted mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Cần quyền truy cập? Liên hệ quản trị hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};
