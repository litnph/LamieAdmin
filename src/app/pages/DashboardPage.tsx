import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Box, TrendingUp, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { mockOrders } from '@/shared/constants/mockData';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="group relative overflow-hidden glass border border-white/40 p-5 rounded-2xl shadow-sm hover-lift animate-fade-in-up">
    <div
      className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
      style={{ background: color }}
    />
    <div className="relative flex items-start justify-between mb-4">
      <div className="p-2.5 rounded-xl bg-admin-primary/8 text-admin-primary">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-admin-status-success bg-admin-status-success/10 px-2 py-0.5 rounded-lg">
        <ArrowUpRight size={12} />
        {trend}
      </span>
    </div>
    <p className="text-admin-text-muted text-[11px] font-medium uppercase tracking-[0.14em] mb-1">
      {title}
    </p>
    <h3 className="text-2xl font-serif font-semibold text-admin-text-primary">{value}</h3>
  </div>
);

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-1.5 animate-fade-in-up">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-admin-text-muted">
          Dashboard
        </p>
        <h2 className="text-2xl lg:text-3xl font-serif font-bold text-admin-text-primary tracking-tight">
          Welcome back, Lamie.
        </h2>
        <p className="text-admin-text-secondary text-sm max-w-xl">
          A calm overview of your flower business — orders, products and growth at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Total Revenue" value="$4,280" icon={DollarSign} trend="+12.5%" color="var(--admin-primary-hex)" />
        <StatCard title="Total Orders" value="84" icon={ShoppingBag} trend="+4.2%" color="#C4956E" />
        <StatCard title="Products Sold" value="156" icon={Box} trend="+8.1%" color="#6B8A9E" />
        <StatCard title="Growth" value="23%" icon={TrendingUp} trend="+2.3%" color="#C4A36D" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass border border-white/40 rounded-2xl shadow-sm p-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-serif font-semibold text-admin-text-primary">Recent orders</h3>
              <p className="text-xs text-admin-text-muted mt-0.5">
                Latest customer activity
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-admin-text-muted hover:text-admin-primary flex items-center gap-1.5 text-xs font-medium transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-admin-primary/5"
            >
              <span>Xem tất cả đơn</span>
              <MoreHorizontal size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {mockOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 hover:bg-white/50 cursor-pointer group border border-transparent hover:border-white/40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-admin-primary/8 flex items-center justify-center text-admin-primary font-semibold text-xs">
                    {order.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-admin-text-primary">{order.customer}</p>
                    <p className="text-[11px] text-admin-text-muted">
                      {order.id}
                    </p>
                  </div>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm font-semibold text-admin-text-primary">${order.total.toFixed(2)}</p>
                  <p className="text-[11px] text-admin-text-muted">{order.date}</p>
                </div>
                <Badge status={order.status} />
              </div>
            ))}
          </div>
        </div>

        <div
          className="text-white rounded-2xl shadow-lg p-6 relative overflow-hidden animate-fade-in-up"
          style={{
            animationDelay: '0.2s',
            background: 'linear-gradient(to bottom right, var(--admin-gradient-from), var(--admin-gradient-via), var(--admin-gradient-to))',
          }}
        >
          <div className="absolute -top-16 -right-10 w-40 h-40 bg-white/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-4 w-32 h-32 bg-white/6 rounded-full blur-2xl" />

          <div className="relative z-10">
            <h3 className="text-lg font-serif font-semibold mb-0.5">Best sellers</h3>
            <p className="text-xs text-white/60 mb-6">
              Top performing bouquets today
            </p>
            <div className="space-y-4">
              {[
                { name: 'Vintage Rose Bundle', sold: 42, price: '$45' },
                { name: 'Pastel Dream Mix', sold: 38, price: '$52' },
                { name: 'Sunflower Delight', sold: 31, price: '$38' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xs font-bold text-white/70">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-[11px] text-white/55">{item.sold} stems sold</p>
                  </div>
                  <p className="text-sm font-semibold">{item.price}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 text-sm font-medium bg-white/15 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/10 btn-press">
              View full report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
