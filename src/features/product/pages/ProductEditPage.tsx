import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductApi, type ProductDto } from '@/features/product/api/productApi';
import { ProductCreatePage } from '@/features/product/pages/ProductCreatePage';

// Tạm thời: hiển thị header + reuse form tạo sản phẩm như chế độ "clone",
// khi backend cung cấp UpdateProductCommand ta sẽ tách form dùng chung cho create/edit.

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="p-2 rounded-xl border border-admin-border hover:bg-admin-muted transition-colors"
              aria-label="Back"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-2xl font-serif font-bold text-admin-text-primary">Edit product</h2>
              <p className="text-admin-text-secondary mt-1 text-sm">
                ID: <span className="font-mono">{id || 'N/A'}</span>
              </p>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-admin-status-error">{error}</p> : null}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-admin-text-secondary">Loading product...</p>
      ) : product ? (
        // Tạm thời: dùng lại form tạo sản phẩm để tạo bản sao, do BE chưa cung cấp UpdateProductCommand.
        <ProductCreatePage />
      ) : null}
    </div>
  );
};

