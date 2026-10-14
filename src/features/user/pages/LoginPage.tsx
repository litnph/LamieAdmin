import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Flower2 } from '@/shared/icons/lucideAnimated';
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
    <main className="grid min-h-dvh bg-admin-bg font-sans text-admin-text-primary md:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden min-h-dvh flex-col justify-between overflow-hidden bg-admin-primary p-12 text-admin-primary-foreground md:flex lg:p-16" aria-label="Giới thiệu Lamie Admin">
        <div>
          <p className="font-serif text-5xl font-normal tracking-[-0.055em]">Lamie</p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75">Flower shop</p>
        </div>
        <div className="max-w-md">
          <Flower2 size={70} strokeWidth={0.9} className="mb-8 opacity-55" aria-hidden="true" />
          <h2 className="font-serif text-[clamp(2.25rem,4vw,3.25rem)] font-normal leading-[1.12] tracking-[-0.035em]">
            Bàn điều phối cho mỗi ngày ở Lamie.
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-7 opacity-80">
            Theo dõi đơn hàng, lịch giao, sản phẩm và tồn kho trong một không gian làm việc thống nhất.
          </p>
        </div>
        <p className="text-xs opacity-70">Công cụ vận hành dành cho đội ngũ cửa hàng hoa.</p>
      </section>

      <section className="flex min-h-dvh items-start justify-center bg-admin-card px-6 py-10 sm:px-10 md:items-center md:px-12" aria-labelledby="login-title">
        <div className="w-full max-w-[23rem]">
          <div className="mb-14 md:hidden">
            <p className="font-serif text-4xl tracking-[-0.05em] text-admin-text-primary">Lamie</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-admin-text-muted">Quản trị cửa hàng</p>
          </div>
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-text-muted">Lamie Admin</p>
            <h1 id="login-title" className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.025em] text-admin-text-primary">
              Đăng nhập
            </h1>
            <p className="mt-2 text-sm leading-6 text-admin-text-secondary">
              Đăng nhập để tiếp tục phiên làm việc.
            </p>
          </div>

          {error && (
            <div id="login-error" className="mb-5 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3 text-sm text-admin-status-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <label htmlFor="admin-login" className="mb-2 block text-xs font-semibold text-admin-text-primary">Email hoặc tên đăng nhập</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-muted transition-colors group-focus-within:text-admin-primary" size={17} aria-hidden="true" />
                <input
                  id="admin-login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Nhập email hoặc tên đăng nhập"
                  className="h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card pl-11 pr-3 text-sm text-admin-text-primary placeholder:text-admin-text-muted focus:border-admin-primary/55 focus:outline-none focus:ring-2 focus:ring-admin-primary/15"
                  required
                  autoComplete="username"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-xs font-semibold text-admin-text-primary">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-muted transition-colors group-focus-within:text-admin-primary" size={17} aria-hidden="true" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card pl-11 pr-3 text-sm text-admin-text-primary placeholder:text-admin-text-muted focus:border-admin-primary/55 focus:outline-none focus:ring-2 focus:ring-admin-primary/15"
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
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 py-2.5 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-admin-text-muted">
            Cần quyền truy cập? Liên hệ quản trị hệ thống.
          </p>
        </div>
      </section>
    </main>
  );
};
