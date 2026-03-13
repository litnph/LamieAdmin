export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image: string;
}

export interface Order {
  id: string;
  customer: string;
  total: number;
  date: string;
  status: 'Pending' | 'Completed' | 'Shipped';
}

export interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  icon: string;
}
