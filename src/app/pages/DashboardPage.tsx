import React from 'react';
import { DollarSign, ShoppingBag, Box, TrendingUp, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { mockOrders } from '@/shared/constants/mockData';

const StatCard = ({ title, value, icon: Icon, trend, tone }: any) => (
  <div className="relative overflow-hidden bg-gradient-to-br from-[#FDF7F2] via-[#F7E8DA] to-[#F1DFD0] p-5 rounded-2xl border border-admin-border shadow-sm">
    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-40 blur-2xl"
      style={{ background: tone }} />
    <div className="relative flex items-start justify-between mb-3">
      <div className="p-2.5 rounded-xl bg-white/70 text-admin-primary shadow-sm">
        <Icon size={22} />
      </div>
      <span className="text-[11px] font-medium text-admin-status-success bg-admin-status-success/10 px-2 py-0.5 rounded-full">
        {trend}
      </span>
    </div>
    <p className="text-admin-text-secondary text-xs font-medium mb-1 uppercase tracking-[0.16em]">
      {title}
    </p>
    <h3 className="text-2xl font-serif font-semibold text-admin-text-primary">{value}</h3>
  </div>
);

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-admin-text-secondary">
          Today at Lamie
        </p>
        <h2 className="text-3xl font-serif font-bold text-admin-text-primary">
          Soft overview of your flower business.
        </h2>
        <p className="text-admin-text-secondary text-sm max-w-2xl">
          Track orders, best-selling bouquets and master data in a calm dashboard designed for a boutique flower shop.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Revenue" value="$4,280" icon={DollarSign} trend="+12.5%" tone="#E1C0A2" />
        <StatCard title="Total Orders" value="84" icon={ShoppingBag} trend="+4.2%" tone="#E0B6AF" />
        <StatCard title="Products Sold" value="156" icon={Box} trend="+8.1%" tone="#D9C0C8" />
        <StatCard title="Growth" value="23%" icon={TrendingUp} trend="+2.3%" tone="#CBAF9C" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-admin-card/90 rounded-2xl shadow-sm border border-admin-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-serif font-semibold text-admin-text-primary">Recent orders</h3>
              <p className="text-xs text-admin-text-secondary mt-1">
                A quick look at your latest customer activity.
              </p>
            </div>
            <button className="text-admin-text-secondary hover:text-admin-primary flex items-center gap-1 text-xs">
              <span>View all</span>
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {mockOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-admin-bg/60 hover:bg-admin-bg rounded-xl transition-colors border border-transparent hover:border-admin-border cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-admin-muted flex items-center justify-center text-admin-text-primary font-semibold text-xs">
                    {order.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-admin-text-primary">{order.customer}</p>
                    <p className="text-[11px] text-admin-text-secondary uppercase tracking-[0.16em]">
                      {order.id}
                    </p>
                  </div>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm font-semibold text-admin-text-primary">${order.total.toFixed(2)}</p>
                  <p className="text-[11px] text-admin-text-secondary">{order.date}</p>
                </div>
                <Badge status={order.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-gradient-to-br from-[#8A6B57] via-[#6E5D4E] to-[#4B392E] text-admin-text-inverse rounded-2xl shadow-md p-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-10 w-40 h-40 bg-white/10 rounded-full opacity-60 blur-3xl" />
          <div className="absolute -bottom-12 -left-4 w-32 h-32 bg-[#E3C6A9]/40 rounded-full opacity-70 blur-2xl" />

          <div className="relative z-10">
            <h3 className="text-lg font-serif font-semibold mb-1">Best selling bouquets</h3>
            <p className="text-xs text-white/70 mb-6">
              Snapshot of today’s softest performers.
            </p>
            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Vintage Rose Bundle</p>
                    <p className="text-[11px] text-white/70">42 stems sold today</p>
                  </div>
                  <p className="text-sm font-semibold">$45</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-7 py-2.5 text-sm font-medium bg-admin-bg text-admin-primary hover:bg-admin-muted rounded-xl transition-colors shadow-sm">
              View full report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};