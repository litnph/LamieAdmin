import React, { useEffect, useState } from 'react';
import { Plus, Filter, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductTable } from '@/features/product/components/ProductTable';
import type { Product } from '@/shared/types';
import { ProductApi, type ProductDto } from '@/features/product/api/productApi';

const mapDtoToProduct = (dto: ProductDto): Product => {
  const firstTranslation = dto.translations[0];
  const name = firstTranslation?.name ?? dto.sku;
  const image =
    dto.thumbnailUrl ??
    dto.images.find((i) => i.isActive)?.imageUrl ??
    'https://via.placeholder.com/80x80.png?text=No+Image';

  let status: Product['status'];
  if (dto.stock <= 0) status = 'Out of Stock';
  else if (dto.stock <= 5) status = 'Low Stock';
  else status = 'In Stock';

  return {
    id: String(dto.id),
    name,
    category: `#${dto.categoryId}`,
    price: dto.price,
    stock: dto.stock,
    status,
    image,
  };
};

export const ProductListPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ProductApi.getAll();
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load products');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Delete this product?');
    if (!ok) return;
    try {
      await ProductApi.remove(Number(id));
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete product');
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/products/${id}/edit`);
  };

  const products = items.map(mapDtoToProduct);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-admin-text-primary">Products</h2>
          <p className="text-admin-text-secondary mt-1">Manage your flower inventory and catalog.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-admin-card text-admin-text-secondary border border-admin-border rounded-xl hover:bg-admin-secondary hover:text-admin-text-primary transition-colors">
            <Filter size={18} />
            <span className="text-sm font-medium">Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-admin-card text-admin-text-secondary border border-admin-border rounded-xl hover:bg-admin-secondary hover:text-admin-text-primary transition-colors">
            <Download size={18} />
            <span className="text-sm font-medium">Export</span>
          </button>
          <button
            onClick={() => navigate('/admin/products/create')}
            className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-admin-text-inverse rounded-xl hover:bg-admin-primary-hover transition-colors shadow-lg shadow-admin-primary/20"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Add Product</span>
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-admin-status-error">{error}</p> : null}

      <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} />

      {loading ? <p className="text-xs text-admin-text-secondary">Loading...</p> : null}
    </div>
  );
};

