import React from 'react';

interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  let colorClass = 'bg-admin-secondary/20 text-admin-text-secondary border border-admin-secondary';

  // Using opacity/alpha modifiers for backgrounds to keep them subtle while using the strict palette
  switch (status) {
    case 'In Stock':
    case 'Completed':
      colorClass = 'bg-admin-status-success/10 text-admin-status-success border border-admin-status-success/30';
      break;
    case 'Low Stock':
    case 'Pending':
      colorClass = 'bg-admin-status-warning/10 text-admin-status-warning border border-admin-status-warning/30';
      break;
    case 'Out of Stock':
      colorClass = 'bg-admin-status-error/10 text-admin-status-error border border-admin-status-error/30';
      break;
    case 'Shipped':
      colorClass = 'bg-admin-status-info/10 text-admin-status-info border border-admin-status-info/30';
      break;
    default:
      colorClass = 'bg-admin-secondary/20 text-admin-text-primary border border-admin-secondary';
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
};