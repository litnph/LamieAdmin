import React from 'react';

interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  let colorClass = 'bg-admin-secondary/30 text-admin-text-secondary';

  switch (status) {
    case 'In Stock':
    case 'Completed':
      colorClass = 'bg-admin-status-success/12 text-admin-status-success';
      break;
    case 'Low Stock':
    case 'Pending':
      colorClass = 'bg-admin-status-warning/12 text-admin-status-warning';
      break;
    case 'Out of Stock':
      colorClass = 'bg-admin-status-error/12 text-admin-status-error';
      break;
    case 'Shipped':
      colorClass = 'bg-admin-status-info/12 text-admin-status-info';
      break;
    default:
      colorClass = 'bg-admin-muted text-admin-text-secondary';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide ${colorClass}`}>
      {status}
    </span>
  );
};
