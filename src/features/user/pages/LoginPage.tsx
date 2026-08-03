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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-[#FAF8F5] via-[#FDF9F5] to-[#F0E8DE] p-4 font-sans text-admin-text-primary">
      <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-admin-primary/8 blur-3xl animate-fade-in" aria-hidden="true" />
      <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-admin-accent/8 blur-3xl animate-fade-in" aria-hidden="true" />

      <div className="glass-strong relative z-10 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl border border-white/50 shadow-2xl shadow-black/8 animate-scale-in md:grid-cols-2">
        <section className="relative hidden flex-col justify-between border-r border-white/30 bg-gradient-to-br from-admin-primary/5 via-admin-muted/50 to-admin-accent-light/30 p-10 md:flex" aria-label="Giới thiệu Lamie Admin">
          <div className="animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-admin-primary/10 flex items-center justify-center mb-6">
              <Flower2 size={24} className="text-admin-primary" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="mb-3 font-serif text-2xl font-bold tracking-tight text-admin-text-primary">
              Lamie Flower Shop
            </p>
            <p className="text-admin-text-secondary text-sm leading-relaxed max-w-xs">
              Quản trị đơn hàng, kênh bán và sản phẩm. Đăng nhập bằng email hoặc tên đăng nhập theo API Lamie.
            </p>
          </div>
          <p className="text-[11px] text-admin-text-muted animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Công cụ vận hành dành cho đội ngũ cửa hàng hoa.
          </p>
        </section>

        <section className="p-8 md:p-10" aria-labelledby="login-title">
          <div className="mb-8 animate-fade-in-up">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-admin-text-muted mb-2">
              Lamie Admin
            </p>
            <h1 id="login-title" className="text-2xl font-serif font-semibold text-admin-text-primary tracking-tight">
              Đăng nhập
            </h1>
            <p className="text-admin-text-secondary text-sm mt-1.5">
              Đăng nhập để tiếp tục phiên làm việc.
            </p>
          </div>

          {error && (
            <div id="login-error" className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <label htmlFor="admin-login" className="block text-xs font-medium text-admin-text-secondary mb-2">Email hoặc tên đăng nhập</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted group-focus-within:text-admin-primary transition-colors" size={18} aria-hidden="true" />
                <input
                  id="admin-login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="admin@lamie.com"
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-admin-input-border/80 rounded-xl text-admin-text-primary placeholder-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-primary/15 focus:border-admin-primary/40 focus:bg-white/70 transition-all duration-200"
                  required
                  autoComplete="username"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="admin-password" className="block text-xs font-medium text-admin-text-secondary">Mật khẩu</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted group-focus-within:text-admin-primary transition-colors" size={18} aria-hidden="true" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-admin-input-border/80 rounded-xl text-admin-text-primary placeholder-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-primary/15 focus:border-admin-primary/40 focus:bg-white/70 transition-all duration-200"
                  required
                  autoComplete="current-password"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-admin-primary hover:bg-admin-primary-hover text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-admin-primary/15 btn-press mt-2 disabled:opacity-60"
            >
              <span>{submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>

          <p className="text-center text-xs text-admin-text-muted mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Cần quyền truy cập? Liên hệ quản trị hệ thống.
          </p>
        </section>
      </div>
    </main>
  );
};
