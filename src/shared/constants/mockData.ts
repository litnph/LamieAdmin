import { Product, Order } from '../types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Vintage White Rose',
    category: 'Roses',
    price: 45.00,
    stock: 120,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&q=80&w=100&h=100'
  },
  {
    id: '2',
    name: 'Autumn Tulip Bundle',
    category: 'Tulips',
    price: 32.50,
    stock: 15,
    status: 'Low Stock',
    image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&q=80&w=100&h=100'
  },
  {
    id: '3',
    name: 'Dried Eucalyptus',
    category: 'Dried',
    price: 18.00,
    stock: 200,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1596627838562-b94879282387?auto=format&fit=crop&q=80&w=100&h=100'
  },
  {
    id: '4',
    name: 'Peony Arrangement',
    category: 'Bouquets',
    price: 85.00,
    stock: 0,
    status: 'Out of Stock',
    image: 'https://images.unsplash.com/photo-1563241527-3007b7746404?auto=format&fit=crop&q=80&w=100&h=100'
  },
  {
    id: '5',
    name: 'Wildflower Mix',
    category: 'Bouquets',
    price: 55.00,
    stock: 45,
    status: 'In Stock',
    image: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&q=80&w=100&h=100'
  }
];

export const mockOrders: Order[] = [
  { id: '#ORD-7782', customer: 'Alice Morph', total: 125.00, date: '2 mins ago', status: 'Pending' },
  { id: '#ORD-7781', customer: 'John Doe', total: 45.00, date: '15 mins ago', status: 'Completed' },
  { id: '#ORD-7780', customer: 'Emma Stone', total: 230.50, date: '1 hour ago', status: 'Shipped' },
];
