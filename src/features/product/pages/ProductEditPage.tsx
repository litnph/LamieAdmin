import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductApi, type ProductDto } from '@/features/product/api/productApi';
import { ProductCreatePage } from '@/features/product/pages/ProductCreatePage';

export const ProductEditPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = Number(params.id);

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ProductApi.getById(id);
        setProduct(data);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-fade-in">
        <div className="w-4 h-4 border-2 border-admin-primary/30 border-t-admin-primary rounded-full animate-spin" />
        <p className="text-sm text-admin-text-muted">Đang tải sản phẩm…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-2 rounded-xl border border-admin-border bg-white/80 px-3 py-2 text-sm font-medium text-admin-text-secondary hover:bg-admin-muted/60"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách
        </button>
        <p className="text-sm text-admin-status-error">{error ?? 'Không tìm thấy sản phẩm.'}</p>
      </div>
    );
  }

  return <ProductCreatePage mode="edit" productId={id} initialProduct={product} />;
};
