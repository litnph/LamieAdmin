import React from 'react';
import { DollarSign, ShoppingBag, Box, TrendingUp, MoreHorizontal } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { mockOrders } from '../data/mockData';

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <div className="bg-admin-card p-6 rounded-2xl shadow-sm border border-admin-border">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-admin-muted rounded-xl text-admin-primary">
        <Icon size={24} />
      </div>
      <span className="text-xs font-medium text-admin-status-success bg-admin-status-success/10 px-2 py-1 rounded-full">{trend}</span>
    </div>
    <p className="text-admin-text-secondary text-sm font-medium mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-admin-text-primary">{value}</h3>
  </div>
);

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-bold text-admin-text-primary">Dashboard Overview</h2>
        <p className="text-admin-text-secondary mt-1">Welcome back, here's what's happening at the shop today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value="$4,280" icon={DollarSign} trend="+12.5%" />
        <StatCard title="Total Orders" value="84" icon={ShoppingBag} trend="+4.2%" />
        <StatCard title="Products Sold" value="156" icon={Box} trend="+8.1%" />
        <StatCard title="Total Growth" value="23%" icon={TrendingUp} trend="+2.3%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders - Takes up 2 columns */}
        <div className="lg:col-span-2 bg-admin-card rounded-2xl shadow-sm border border-admin-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-admin-text-primary">Recent Orders</h3>
            <button className="text-admin-text-secondary hover:text-admin-primary">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="space-y-4">
            {mockOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 hover:bg-admin-bg rounded-xl transition-colors cursor-pointer border border-transparent hover:border-admin-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-admin-muted flex items-center justify-center text-admin-text-primary font-bold text-sm">
                    {order.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-admin-text-primary">{order.customer}</p>
                    <p className="text-xs text-admin-text-secondary">{order.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-admin-text-primary">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-admin-text-secondary">{order.date}</p>
                </div>
                <Badge status={order.status} />
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 text-sm font-medium text-admin-text-secondary border border-admin-border rounded-xl hover:bg-admin-bg hover:text-admin-text-primary transition-colors">
            View All Orders
          </button>
        </div>

        {/* Top Products - Takes up 1 column */}
        <div className="bg-admin-primary text-admin-text-inverse rounded-2xl shadow-sm p-6 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full opacity-50 blur-2xl"></div>
          
          <h3 className="text-lg font-bold mb-6 relative z-10">Best Selling</h3>
          <div className="space-y-6 relative z-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex-shrink-0">
                   {/* Placeholder for image */}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-admin-text-inverse">Vintage Rose Bundle</p>
                  <p className="text-xs text-white/70">42 sales today</p>
                </div>
                <p className="text-sm font-bold text-admin-text-inverse">$45</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-medium bg-admin-bg-card text-admin-primary hover:bg-admin-muted rounded-xl transition-colors relative z-10 shadow-sm">
            View Report
          </button>
        </div>
      </div>
    </div>
  );
};