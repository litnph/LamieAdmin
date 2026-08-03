import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductApi, type ProductDto } from '@/features/product/api/productApi';
import { ProductCreatePage } from '@/features/product/pages/ProductCreatePage';
import { getApiErrorMessage } from '@/shared/utils/apiError';

export const ProductEditPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = Number(params.id);

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setError('Mã sản phẩm không hợp lệ.');
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ProductApi.getById(id);
        setProduct(data);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    void loadProduct();
  }, [id, reloadKey]);

  if (loading) {
    return (
      <div className="mx-auto max-w-admin-content space-y-5" aria-busy="true" aria-label="Đang tải sản phẩm">
        <div className="h-8 w-56 animate-pulse rounded-admin-control bg-admin-muted" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-admin-panel border border-admin-border bg-admin-card lg:col-span-9" />
          <div className="h-72 animate-pulse rounded-admin-panel border border-admin-border bg-admin-card lg:col-span-3" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-2xl rounded-admin-panel border border-admin-border bg-admin-card p-5 sm:p-6">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="inline-flex min-h-11 items-center gap-2 rounded-admin-control border border-admin-border bg-admin-card px-3 text-sm font-semibold text-admin-text-secondary transition-colors hover:bg-admin-muted"
        >
          <ArrowLeft size={18} strokeWidth={1.8} aria-hidden="true" />
          Quay lại danh sách
        </button>
        <h1 className="mt-5 text-xl font-semibold text-admin-text-primary">Không thể mở sản phẩm</h1>
        <p className="mt-2 text-sm leading-6 text-admin-status-error" role="alert">
          {error ?? 'Không tìm thấy sản phẩm.'}
        </p>
        {Number.isInteger(id) && id > 0 ? (
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover"
          >
            <RefreshCw size={17} strokeWidth={1.8} aria-hidden="true" />
            Thử tải lại
          </button>
        ) : null}
      </div>
    );
  }

  return <ProductCreatePage mode="edit" productId={id} initialProduct={product} />;
};
