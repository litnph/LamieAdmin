import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ImageOff,
  ImagePlus,
  LoaderCircle,
  LocateFixed,
  MapPin,
  MessageSquareText,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { AdminSelect, type AdminSelectOption } from '@/shared/components/AdminSelect';
import { ImagePreview, type ImagePreviewItem } from '@/shared/components/ImagePreview';
import { ProductApi, type ProductDto } from '@/features/product/api/productApi';
import { channelsApi, type ChannelDto } from '@/features/settings/channels/api/channelsApi';
import { resolveApiResourceUrl } from '@/services/apiResourceUrl';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { ordersApi } from '../api/ordersApi';
import { orderStatusLabel } from '../constants/orderLabels';
import { DeliveryLocationPicker } from '../components/DeliveryLocationPicker';
import { QuickOrderBatchImportDialog } from '../components/QuickOrderBatchImportDialog';
import { OrderStatus, type OrderImageDto, type OrderImageUpload, type UpdateOrderLine } from '../types/order.types';
import { formatOrderCurrency } from '../utils/orderListFormatters';
import { nominatimReverse, nominatimSearch } from '../utils/geocode';
import { calculateDefaultDeposit } from '../utils/deposit';

const inputClass =
  'min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-muted transition-colors focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';
const labelClass = 'mb-1 block min-h-4 text-xs font-medium leading-4 text-admin-text-secondary';
const panelClass = 'rounded-admin-panel border border-admin-border bg-admin-card p-4 shadow-admin-panel';
const ORDER_DELIVERY_LOCATION_UI_ENABLED = false;
const formatVndInput = (value: number | string) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? Math.round(numericValue).toLocaleString('vi-VN') : '';
};
const parseVndInput = (value: string) => Number(value.replace(/\D/g, '')) || 0;

type LineDraft = UpdateOrderLine & {
  key: string;
  imageFiles: File[];
  existingImages: OrderImageDto[];
  snapshotThumbnailUrl?: string | null;
};

type ProductSelectOption = AdminSelectOption<string> & {
  searchText: string;
  productCode?: string;
  productName: string;
  price?: number;
  thumbnailUrl?: string | null;
  isManual?: boolean;
};

type EditorProps = { orderId?: string };

type LineValidationError = {
  message: string;
  fieldId: string;
  inDetails: boolean;
};

const createLineKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const emptyLine = (): LineDraft => ({
  key: createLineKey(),
  productName: '',
  unitPrice: 0,
  quantity: 1,
  imageFiles: [],
  existingImages: [],
  hasCard: false,
  cardMessage: null,
  hasBanner: false,
  bannerMessage: null,
});

const productName = (product: ProductDto) =>
  product.translations.find((translation) => translation.languageCode.toLowerCase().startsWith('vi'))?.name?.trim()
  || product.translations[0]?.name?.trim()
  || product.sku;

const productCode = (value?: string | null) => value?.trim() || 'Chưa có mã';

const productOptionLabel = (
  code: string | null | undefined,
  name: string | null | undefined,
  price: number,
) => `${productCode(code)} - ${name?.trim() || 'Chưa có tên'} - ${formatOrderCurrency(price)}`;

const normalizeProductSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLocaleLowerCase('vi')
  .trim();

const productImageSource = (product: ProductDto) => {
  const detailImage = [...product.images]
    .filter((image) => image.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)[0]?.imageUrl;
  return product.thumbnailUrl || detailImage || '';
};

const productPreviewItems = (
  product: ProductDto | undefined,
  fallbackSrc: string | null | undefined,
  alt: string,
): ImagePreviewItem[] => {
  const catalogImages = product
    ? [
        product.thumbnailUrl,
        ...[...product.images]
          .filter((image) => image.isActive)
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((image) => image.imageUrl),
      ]
    : [];

  return [fallbackSrc, ...catalogImages]
    .filter((source): source is string => Boolean(source?.trim()))
    .map((source, index) => ({
      src: source,
      alt: index === 0 ? alt : `${alt}, ảnh ${index + 1}`,
      title: alt,
    }));
};

const ProductOptionThumbnail: React.FC<{ src?: string | null }> = ({ src }) => {
  const resolvedSrc = resolveApiResourceUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [resolvedSrc]);

  if (!resolvedSrc || failed) {
    return (
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-admin-control border border-admin-border bg-admin-muted text-admin-text-muted"
        aria-hidden="true"
        title="Sản phẩm chưa có ảnh"
      >
        <ImageOff size={16} strokeWidth={1.7} aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt=""
      aria-hidden="true"
      width={36}
      height={36}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-9 w-9 shrink-0 rounded-admin-control border border-admin-border object-cover"
    />
  );
};

const ProductOptionContent: React.FC<{
  option: ProductSelectOption;
  context: 'menu' | 'value';
}> = ({ option, context }) => {
  if (context === 'value') {
    return <span className="block truncate" title={option.label}>{option.label}</span>;
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ProductOptionThumbnail src={option.thumbnailUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-admin-text-primary" title={option.label}>
          {option.productCode ? <span className="font-mono text-xs font-semibold">{option.productCode}</span> : null}
          {option.productCode ? <span className="text-admin-text-muted"> - </span> : null}
          <span>{option.productName}</span>
        </p>
        {option.price != null ? (
          <p className="mt-0.5 text-xs tabular-nums text-admin-text-secondary">
            {formatOrderCurrency(option.price)}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-admin-text-muted">Nhập thông tin sản phẩm riêng</p>
        )}
      </div>
    </div>
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getOrderEditorErrorMessage = (requestError: unknown, orderStatus: OrderStatus | null) => {
  if (!axios.isAxiosError(requestError)) return getApiErrorMessage(requestError);
  if (requestError.response?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (requestError.response?.status === 403) return 'Bạn không có quyền cập nhật đơn hàng này.';

  const data: unknown = requestError.response?.data;
  const code = isRecord(data) && typeof data.code === 'string' ? data.code : null;
  const fallback = getApiErrorMessage(requestError);
  if (code === 'BUSINESS_RULE_VIOLATION' && orderStatus !== null && orderStatus !== OrderStatus.Created) {
    return orderStatus === OrderStatus.Completed || orderStatus === OrderStatus.Cancelled
      ? 'Không thể chỉnh sửa đơn hàng đã hoàn tất hoặc đã hủy.'
      : 'Đơn hàng chỉ có thể chỉnh sửa khi ở trạng thái Đã tạo.';
  }
  if (fallback === 'Only a Created order without reserved inventory can be edited.') {
    return 'Đơn hàng chỉ có thể chỉnh sửa khi ở trạng thái Đã tạo.';
  }
  if (fallback === 'The order was changed by another request. Reload and try again.') {
    return 'Đơn hàng đã được xử lý bởi người khác, vui lòng tải lại.';
  }
  return fallback;
};

const toLocalInput = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const OrderItemImagePreviews: React.FC<{
  existingImages: OrderImageDto[];
  files: File[];
  productName: string;
  onRemove: (index: number) => void;
}> = ({ existingImages, files, productName: itemProductName, onRemove }) => {
  const [previews, setPreviews] = useState<Array<{ file: File; url: string }>>([]);

  useEffect(() => {
    const nextPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [files]);

  const gallery: ImagePreviewItem[] = [
    ...existingImages.map((image, index) => ({
      src: image.imageUrl,
      alt: image.description || `Ảnh minh họa đã lưu ${index + 1} của ${itemProductName}`,
      title: `Ảnh minh họa của ${itemProductName}`,
      caption: image.description || undefined,
    })),
    ...previews.map((preview, index) => ({
      src: preview.url,
      alt: `Ảnh minh họa mới ${index + 1} của ${itemProductName}`,
      title: `Ảnh minh họa của ${itemProductName}`,
      caption: preview.file.name,
    })),
  ];

  return (
    <>
      {existingImages.map((image, index) => (
        <ImagePreview
          key={image.id}
          src={image.imageUrl}
          alt={image.description || `Ảnh minh họa đã lưu ${index + 1} của ${itemProductName}`}
          title={`Ảnh minh họa của ${itemProductName}`}
          caption={image.description || undefined}
          gallery={gallery}
          buttonClassName="h-14 w-14 rounded-admin-control"
          thumbnailClassName="h-14 w-14 rounded-admin-control border border-admin-border object-cover"
        />
      ))}
      {previews.map((preview, index) => (
        <div key={`${preview.file.name}-${preview.file.lastModified}`} className="group relative h-14 w-14 shrink-0">
          <ImagePreview
            src={preview.url}
            alt={`Ảnh minh họa mới ${index + 1} của ${itemProductName}`}
            title={`Ảnh minh họa của ${itemProductName}`}
            caption={preview.file.name}
            gallery={gallery}
            loading="eager"
            buttonClassName="h-full w-full rounded-admin-control"
            thumbnailClassName="h-full w-full rounded-admin-control border border-admin-border object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute right-0.5 top-0.5 inline-flex h-6 w-6 items-center justify-center rounded bg-admin-card/90 text-admin-status-error opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
            aria-label={`Bỏ ảnh ${preview.file.name}`}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ))}
    </>
  );
};

const OrderEditor: React.FC<EditorProps> = ({ orderId }) => {
  const navigate = useNavigate();
  const isEdit = Boolean(orderId);
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const submitLockRef = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<number, LineValidationError>>({});
  const [loadedOrderStatus, setLoadedOrderStatus] = useState<OrderStatus | null>(null);
  const [rowVersion, setRowVersion] = useState<string | undefined>();

  const [ordererName, setOrdererName] = useState('');
  const [ordererPhone, setOrdererPhone] = useState('');
  const [channelId, setChannelId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [pickupAtShop, setPickupAtShop] = useState(false);
  const [provinceShipping, setProvinceShipping] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryAddressDescription, setDeliveryAddressDescription] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [deliveryAt, setDeliveryAt] = useState('');
  const [deliveryTo, setDeliveryTo] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'exact' | 'range'>('exact');
  const [depositAmount, setDepositAmount] = useState(100_000);
  const [depositWasManuallyEdited, setDepositWasManuallyEdited] = useState(isEdit);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingFeeActual, setShippingFeeActual] = useState('');
  const [description, setDescription] = useState('');
  const [contentNote, setContentNote] = useState('');
  const [items, setItems] = useState<LineDraft[]>([emptyLine()]);
  const [expandedLineKeys, setExpandedLineKeys] = useState<Set<string>>(() => new Set());
  const [quickImportOpen, setQuickImportOpen] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const [geoSearching, setGeoSearching] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoResults, setGeoResults] = useState<Awaited<ReturnType<typeof nominatimSearch>>>([]);
  const geoSearchAbortRef = useRef<AbortController | null>(null);
  const skipAddressSearchRef = useRef(false);

  const productOptions = useMemo<ProductSelectOption[]>(() => [
    {
      value: 'manual',
      label: 'Sản phẩm ngoài danh mục',
      searchText: 'san pham ngoai danh muc',
      productName: 'Sản phẩm ngoài danh mục',
      isManual: true,
    },
    ...products.map((product) => ({
      value: String(product.id),
      label: productOptionLabel(product.sku, productName(product), product.salePrice ?? product.price),
      searchText: normalizeProductSearch(`${product.sku} ${productName(product)}`),
      productCode: product.sku,
      productName: productName(product),
      price: product.salePrice ?? product.price,
      thumbnailUrl: productImageSource(product),
      isDisabled: !product.isActive,
    })),
  ], [products]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!orderId) {
        const [loadedChannels, loadedProducts] = await Promise.all([channelsApi.list(), ProductApi.getAll()]);
        setChannels(loadedChannels);
        setProducts(loadedProducts);
        const defaultChannel = loadedChannels.find((channel) => channel.code === 'admin' && channel.isActive)
          ?? loadedChannels.find((channel) => channel.isActive);
        setChannelId(defaultChannel?.id ?? '');
        return;
      }

      const [loadedChannels, loadedProducts, order] = await Promise.all([
        channelsApi.list(),
        ProductApi.getAll(),
        ordersApi.getById(orderId),
      ]);
      setChannels(loadedChannels);
      setProducts(loadedProducts);
      setOrdererName(order.ordererName);
      setOrdererPhone(order.ordererPhone);
      setChannelId(order.channelId);
      setRecipientName(order.recipientName);
      setRecipientPhone(order.recipientPhone);
      setPickupAtShop(order.pickupAtShop);
      setProvinceShipping(order.provinceShipping);
      const primaryDeliveryAddress = order.deliveryAddress?.trim() ?? '';
      const legacyAddressDescription = order.deliveryAddressDescription?.trim() ?? '';
      setDeliveryAddress(primaryDeliveryAddress || legacyAddressDescription);
      setDeliveryAddressDescription(primaryDeliveryAddress ? legacyAddressDescription : '');
      setDeliveryLatitude(order.deliveryLatitude ?? null);
      setDeliveryLongitude(order.deliveryLongitude ?? null);
      setDeliveryAt(toLocalInput(order.deliveryAt));
      setDeliveryTo(order.deliveryTo ? toLocalInput(order.deliveryTo) : '');
      setDeliveryMode(order.deliveryTo ? 'range' : 'exact');
      setDepositAmount(order.depositAmount);
      setShippingFee(order.shippingFee);
      setShippingFeeActual(order.shippingFeeActual == null ? '' : String(order.shippingFeeActual));
      setDescription(order.description ?? '');
      setContentNote(order.contentNote ?? '');
      setLoadedOrderStatus(order.orderStatus);
      setRowVersion(order.rowVersion ?? undefined);
      setExpandedLineKeys(new Set());
      setItems(order.items.length > 0
        ? order.items.map((item) => ({
            key: item.id,
            id: item.id,
            productId: item.productId ?? undefined,
            productSku: item.productSku ?? undefined,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            note: item.note ?? undefined,
            imageFiles: [],
            existingImages: order.images.filter((image) => image.orderItemId === item.id),
            snapshotThumbnailUrl: item.thumbnailUrl,
            hasCard: item.hasCard,
            cardMessage: item.cardMessage,
            hasBanner: item.hasBanner,
            bannerMessage: item.bannerMessage,
          }))
        : [emptyLine()]);
    } catch (requestError) {
      setLoadError(getOrderEditorErrorMessage(requestError, null));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const orderValue = useMemo(
    () => items.reduce((total, item) => total + item.unitPrice * Math.max(0, item.quantity), 0) + (pickupAtShop ? 0 : shippingFee),
    [items, pickupAtShop, shippingFee],
  );

  useEffect(() => {
    if (!isEdit && !depositWasManuallyEdited) setDepositAmount(calculateDefaultDeposit(orderValue));
  }, [depositWasManuallyEdited, isEdit, orderValue]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateLine = (index: number, patch: Partial<LineDraft>) => {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
    setLineErrors((current) => {
      if (!current[index]) return current;
      const next = { ...current };
      delete next[index];
      return next;
    });
  };

  const selectProduct = (index: number, value: string) => {
    if (value === 'manual') {
      updateLine(index, {
        productId: undefined,
        productSku: undefined,
        productName: '',
        unitPrice: 0,
        snapshotThumbnailUrl: undefined,
      });
      return;
    }
    const selected = products.find((product) => String(product.id) === value);
    if (!selected) return;
    updateLine(index, {
      productId: String(selected.id),
      productSku: selected.sku,
      productName: productName(selected),
      unitPrice: selected.salePrice ?? selected.price,
      snapshotThumbnailUrl: productImageSource(selected),
    });
  };

  const removeLine = (index: number) => {
    if (items.length <= 1) return;
    const removedKey = items[index]?.key;
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (removedKey) {
      setExpandedLineKeys((current) => {
        const next = new Set(current);
        next.delete(removedKey);
        return next;
      });
    }
    setLineErrors({});
  };

  const runGeoSearch = useCallback(async (requestedQuery?: string, automatic = false) => {
    const query = (requestedQuery ?? deliveryAddress).trim();
    if (!query) {
      setGeoError('Nhập địa chỉ nhận hàng trước khi tìm.');
      return;
    }
    geoSearchAbortRef.current?.abort();
    const controller = new AbortController();
    geoSearchAbortRef.current = controller;
    setGeoSearching(true);
    setGeoError(null);
    setGeoResults([]);
    try {
      const results = await nominatimSearch(query, controller.signal);
      setGeoResults(results);
      if (results.length === 0) {
        setGeoError(automatic
          ? 'Không tìm thấy trên bản đồ. Địa chỉ vẫn được lưu dưới dạng nội dung nhập tay.'
          : 'Không tìm thấy địa chỉ phù hợp tại Việt Nam. Địa chỉ vẫn có thể lưu dạng text.');
      }
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
        setGeoError(getApiErrorMessage(requestError));
      }
    } finally {
      if (geoSearchAbortRef.current === controller) setGeoSearching(false);
    }
  }, [deliveryAddress]);

  useEffect(() => {
    if (!ORDER_DELIVERY_LOCATION_UI_ENABLED || pickupAtShop || deliveryAddress.trim().length < 5) return;
    if (skipAddressSearchRef.current) {
      skipAddressSearchRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => void runGeoSearch(deliveryAddress, true), 700);
    return () => window.clearTimeout(timer);
  }, [deliveryAddress, pickupAtShop, runGeoSearch]);

  const pickGeo = (latitude: number, longitude: number, label?: string) => {
    setDeliveryLatitude(latitude);
    setDeliveryLongitude(longitude);
    if (label) {
      skipAddressSearchRef.current = true;
      setDeliveryAddress(label);
    }
    setGeoResults([]);
    setGeoError(null);
    setShowMap(true);
  };

  const pickMapPoint = async (latitude: number, longitude: number) => {
    pickGeo(latitude, longitude);
    setGeoSearching(true);
    setGeoError(null);
    try {
      const address = await nominatimReverse(latitude, longitude);
      if (address) {
        skipAddressSearchRef.current = true;
        setDeliveryAddress(address);
      } else {
        setGeoError('Vị trí đã được ghim nhưng bản đồ không có địa chỉ. Hãy nhập địa chỉ và mô tả bên dưới.');
      }
    } catch (requestError) {
      setGeoError(getApiErrorMessage(requestError));
    } finally {
      setGeoSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ lấy vị trí hiện tại.');
      return;
    }
    setGeoSearching(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void pickMapPoint(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setGeoError('Không thể lấy vị trí hiện tại. Hãy kiểm tra quyền truy cập vị trí.');
        setGeoSearching(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const validate = () => {
    const problems: string[] = [];
    const nextLineErrors: Record<number, LineValidationError> = {};
    const detailErrorKeys = new Set<string>();
    let firstField = '';
    const requireValue = (value: string, message: string, fieldId: string) => {
      if (value.trim()) return;
      problems.push(message);
      if (!firstField) firstField = fieldId;
    };

    requireValue(ordererName, 'Thiếu tên người đặt.', 'orderer-name');
    requireValue(channelId, 'Chưa chọn kênh bán.', 'order-channel');
    requireValue(recipientName, 'Thiếu tên người nhận.', 'recipient-name');
    requireValue(recipientPhone, 'Thiếu số điện thoại người nhận.', 'recipient-phone');
    requireValue(deliveryAt, 'Chưa chọn thời gian nhận hàng.', 'delivery-at');
    if (deliveryMode === 'range') {
      requireValue(deliveryTo, 'Chưa chọn thời gian kết thúc khoảng nhận hàng.', 'delivery-to');
      if (deliveryAt && deliveryTo && new Date(deliveryTo).getTime() < new Date(deliveryAt).getTime()) {
        problems.push('Thời gian kết thúc phải sau hoặc bằng thời gian bắt đầu.');
        if (!firstField) firstField = 'delivery-to';
      }
    }
    if (depositAmount < 0 || shippingFee < 0 || (shippingFeeActual && Number(shippingFeeActual) < 0)) {
      problems.push('Các khoản tiền không được âm.');
      if (!firstField) firstField = 'deposit-amount';
    }

    items.forEach((item, index) => {
      if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
        nextLineErrors[index] = {
          message: 'Số lượng phải là số nguyên từ 1 trở lên.',
          fieldId: `order-line-quantity-${index}`,
          inDetails: false,
        };
      } else if (!item.productId && !item.productName.trim()) {
        nextLineErrors[index] = {
          message: 'Nhập tên sản phẩm ngoài danh mục.',
          fieldId: `order-line-name-${index}`,
          inDetails: true,
        };
      } else if (item.unitPrice <= 0) {
        nextLineErrors[index] = {
          message: 'Đơn giá sản phẩm phải lớn hơn 0.',
          fieldId: `order-line-price-${index}`,
          inDetails: false,
        };
      } else if (!item.productId && item.existingImages.length + item.imageFiles.length === 0) {
        nextLineErrors[index] = {
          message: 'Sản phẩm ngoài danh mục cần ít nhất 1 ảnh minh họa.',
          fieldId: `order-line-images-${index}`,
          inDetails: true,
        };
      } else if (item.hasCard && !item.cardMessage?.trim()) {
        nextLineErrors[index] = {
          message: 'Nhập nội dung thiệp hoặc tắt Ghi thiệp.',
          fieldId: `order-line-card-message-${index}`,
          inDetails: true,
        };
      } else if (item.hasBanner && !item.bannerMessage?.trim()) {
        nextLineErrors[index] = {
          message: 'Nhập nội dung banner hoặc tắt In banner.',
          fieldId: `order-line-banner-message-${index}`,
          inDetails: true,
        };
      }
      const lineError = nextLineErrors[index];
      if (lineError) {
        if (lineError.inDetails) detailErrorKeys.add(item.key);
        if (!firstField) firstField = lineError.fieldId;
      }
    });

    if (Object.keys(nextLineErrors).length > 0) problems.push('Kiểm tra lại các dòng sản phẩm được đánh dấu.');
    setLineErrors(nextLineErrors);
    if (detailErrorKeys.size > 0) {
      setExpandedLineKeys((current) => new Set([...current, ...detailErrorKeys]));
    }
    setError(problems.length > 0 ? problems.join(' ') : null);
    if (firstField) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const field = document.getElementById(firstField);
        field?.focus({ preventScroll: true });
        field?.scrollIntoView({ block: 'center' });
      }));
    }
    return problems.length === 0;
  };

  const imageUploads = (): OrderImageUpload[] =>
    items.flatMap((item, orderItemIndex) => item.imageFiles.map((file, fileIndex) => ({
      file,
      orderItemIndex,
      sortOrder: item.existingImages.length + fileIndex,
    })));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitLockRef.current) return;
    if (!validate()) return;
    submitLockRef.current = true;
    setSaving(true);
    setError(null);
    const orderItems = items.map(({ id, productId, productSku, productName: name, unitPrice, quantity, note, hasCard, cardMessage, hasBanner, bannerMessage }) => ({
      id,
      productId,
      productSku,
      productName: name.trim(),
      unitPrice,
      quantity,
      note: note?.trim() || undefined,
      hasCard,
      cardMessage: hasCard ? cardMessage?.trim() || null : null,
      hasBanner,
      bannerMessage: hasBanner ? bannerMessage?.trim() || null : null,
    }));

    try {
      const deliveryIso = new Date(deliveryAt).toISOString();
      const deliveryToIso = deliveryMode === 'range' && deliveryTo
        ? new Date(deliveryTo).toISOString()
        : undefined;
      const commonPayload = {
        ordererName: ordererName.trim(),
        ordererPhone: ordererPhone.trim(),
        channelId,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        pickupAtShop,
        provinceShipping,
        deliveryAddress: pickupAtShop ? undefined : deliveryAddress.trim() || undefined,
        deliveryAddressDescription: pickupAtShop ? undefined : deliveryAddressDescription || undefined,
        deliveryLatitude: pickupAtShop ? undefined : deliveryLatitude ?? undefined,
        deliveryLongitude: pickupAtShop ? undefined : deliveryLongitude ?? undefined,
        deliveryAt: deliveryIso,
        deliveryTo: deliveryToIso,
        depositAmount,
        shippingFee: pickupAtShop ? 0 : shippingFee,
        description: description || undefined,
        contentNote: contentNote.trim() || undefined,
        items: orderItems,
        imageFiles: imageUploads(),
      };

      if (orderId) {
        await ordersApi.update(orderId, {
          ...commonPayload,
          rowVersion,
          shippingFeeActual: pickupAtShop || shippingFeeActual.trim() === ''
            ? null
            : Number(shippingFeeActual),
        });
        navigate(`/admin/orders/${orderId}`, { state: { successMessage: 'Đã cập nhật đơn hàng.' } });
      } else {
        const created = await ordersApi.create(commonPayload);
        navigate(`/admin/orders/${created.id}`, { state: { successMessage: 'Đã tạo đơn hàng.' } });
      }
    } catch (requestError) {
      setError(getOrderEditorErrorMessage(requestError, loadedOrderStatus));
    } finally {
      submitLockRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-w-0">
        <PageHeader title={isEdit ? 'Sửa đơn hàng' : 'Tạo đơn hàng'} description="Đang chuẩn bị dữ liệu đơn hàng." />
        <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-card" role="status">
          <LoaderCircle className="mr-2 animate-spin text-admin-primary" size={18} aria-hidden="true" />
          <span className="text-sm text-admin-text-secondary">Đang tải thông tin</span>
        </div>
      </div>
    );
  }

  const editBlocked = isEdit
    && loadedOrderStatus !== null
    && loadedOrderStatus !== OrderStatus.Created;

  if (editBlocked) {
    const terminal = loadedOrderStatus === OrderStatus.Completed || loadedOrderStatus === OrderStatus.Cancelled;
    return (
      <div className="min-w-0 pb-2">
        <PageHeader
          title="Sửa đơn hàng"
          description="Kiểm tra trạng thái đơn hàng trước khi chỉnh sửa."
          actions={(
            <Link
              to={orderId ? `/admin/orders/${orderId}` : '/admin/orders'}
              className="btn-press inline-flex min-h-11 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Quay lại đơn hàng
            </Link>
          )}
        />
        <div className="rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-4 text-sm leading-6 text-admin-status-error" role="alert">
          <p className="font-semibold">
            {terminal
              ? 'Không thể chỉnh sửa đơn hàng đã hoàn tất hoặc đã hủy.'
              : 'Đơn hàng chỉ có thể chỉnh sửa khi ở trạng thái Đã tạo.'}
          </p>
          <p className="mt-1 text-admin-text-secondary">
            Trạng thái hiện tại: {orderStatusLabel[loadedOrderStatus]}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 pb-2">
      <PageHeader
        title={isEdit ? 'Sửa đơn hàng' : 'Tạo đơn hàng'}
        description="Thông tin chính, sản phẩm và giao nhận được gom trong một màn hình."
        actions={(
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {!isEdit ? (
              <button type="button" onClick={() => setQuickImportOpen(true)} className="btn-press inline-flex min-h-10 shrink-0 items-center gap-2 rounded-admin-control border border-admin-primary/35 px-3 text-sm font-semibold text-admin-primary hover:bg-admin-primary/8">
                <MessageSquareText size={16} aria-hidden="true" /> Nhập nhanh
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-press inline-flex min-h-10 shrink-0 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Quay lại
            </button>
            <Link
              to={orderId ? `/admin/orders/${orderId}` : '/admin/orders'}
              className="btn-press inline-flex min-h-10 shrink-0 items-center justify-center rounded-admin-control px-3 text-sm font-semibold text-admin-text-secondary transition-colors hover:bg-admin-muted"
            >
              Hủy
            </Link>
            <button
              type="submit"
              form="order-editor-form"
              disabled={saving || Boolean(loadError)}
              className="btn-press inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : null}
              {saving ? 'Đang lưu' : isEdit ? 'Cập nhật đơn' : 'Tạo đơn'}
            </button>
          </div>
        )}
      />

      {loadError ? (
        <div className="mb-4 flex flex-col gap-3 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3 text-sm text-admin-status-error sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span>Không thể tải dữ liệu: {loadError}</span>
          <button type="button" onClick={() => void load()} className="min-h-10 rounded-admin-control border border-admin-status-error/30 px-3 font-semibold hover:bg-red-100">Thử lại</button>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-admin-control border border-admin-status-error/30 bg-red-50 px-4 py-3 text-sm leading-6 text-admin-status-error" role="alert">
          {error}
        </div>
      ) : null}

      <form id="order-editor-form" noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
        <div className="grid min-w-0 gap-4 min-[1400px]:grid-cols-[minmax(0,1.1fr)_minmax(28rem,1fr)] min-[1400px]:items-start">
          <div className="min-w-0 space-y-4">
            <section className={panelClass} aria-labelledby="customer-section-title">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 id="customer-section-title" className="text-sm font-semibold text-admin-text-primary">Khách hàng & lịch nhận</h2>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientName(ordererName);
                    setRecipientPhone(ordererPhone);
                  }}
                  className="text-xs font-semibold text-admin-primary hover:underline"
                >
                  Người nhận giống người đặt
                </button>
              </div>
              <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="recipient-name" className={labelClass}>Người nhận</label>
                  <input id="recipient-name" className={inputClass} value={recipientName} onChange={(event) => setRecipientName(event.target.value)} autoComplete="shipping name" />
                </div>
                <div>
                  <label htmlFor="recipient-phone" className={labelClass}>SĐT người nhận</label>
                  <input id="recipient-phone" type="tel" className={inputClass} value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} autoComplete="shipping tel" />
                </div>
                <div>
                  <label htmlFor="orderer-name" className={labelClass}>Người đặt</label>
                  <input id="orderer-name" className={inputClass} value={ordererName} onChange={(event) => setOrdererName(event.target.value)} autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="orderer-phone" className={labelClass}>SĐT người đặt <span className="font-normal text-admin-text-muted">(không bắt buộc)</span></label>
                  <input id="orderer-phone" type="tel" className={inputClass} value={ordererPhone} onChange={(event) => setOrdererPhone(event.target.value)} autoComplete="tel" />
                </div>
                <div>
                  <label htmlFor="order-channel" className={labelClass}>Kênh bán</label>
                  <select id="order-channel" className={inputClass} value={channelId} onChange={(event) => setChannelId(event.target.value)}>
                    <option value="">Chọn kênh</option>
                    {channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
                  </select>
                </div>
                <fieldset className="sm:col-span-2 lg:col-span-3">
                  <legend className={labelClass}>{provinceShipping ? 'Thời gian gửi đơn vị vận chuyển' : 'Thời gian nhận'}</legend>
                  <div className="mb-2 inline-flex rounded-admin-control border border-admin-border bg-admin-muted p-0.5" aria-label={provinceShipping ? 'Kiểu thời gian gửi đơn vị vận chuyển' : 'Kiểu thời gian nhận'}>
                    {(['exact', 'range'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setDeliveryMode(mode);
                          if (mode === 'exact') setDeliveryTo('');
                        }}
                        className={`min-h-9 rounded-admin-control px-3 text-xs font-semibold transition-colors ${deliveryMode === mode ? 'bg-admin-card text-admin-primary shadow-sm' : 'text-admin-text-secondary hover:text-admin-text-primary'}`}
                        aria-pressed={deliveryMode === mode}
                      >
                        {mode === 'exact' ? 'Giờ cụ thể' : 'Khoảng thời gian'}
                      </button>
                    ))}
                  </div>
                  <div className={`grid gap-2.5 ${deliveryMode === 'range' ? 'sm:grid-cols-2' : ''}`}>
                    <div>
                      <label htmlFor="delivery-at" className="sr-only">{deliveryMode === 'range' ? (provinceShipping ? 'Gửi từ' : 'Nhận từ') : (provinceShipping ? 'Thời gian gửi đơn vị vận chuyển' : 'Thời gian nhận')}</label>
                      {deliveryMode === 'range' ? <p className="mb-1 text-[11px] text-admin-text-muted">Từ</p> : null}
                      <input id="delivery-at" type="datetime-local" className={inputClass} value={deliveryAt} onChange={(event) => setDeliveryAt(event.target.value)} />
                    </div>
                    {deliveryMode === 'range' ? (
                      <div>
                        <label htmlFor="delivery-to" className="mb-1 block text-[11px] text-admin-text-muted">Đến</label>
                        <input id="delivery-to" type="datetime-local" min={deliveryAt || undefined} className={inputClass} value={deliveryTo} onChange={(event) => setDeliveryTo(event.target.value)} />
                      </div>
                    ) : null}
                  </div>
                </fieldset>
              </div>
            </section>

            <section className={panelClass} aria-labelledby="order-lines-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 id="order-lines-title" className="text-sm font-semibold text-admin-text-primary">Sản phẩm</h2>
                  <p className="mt-0.5 text-xs text-admin-text-muted">Chọn từ danh mục; sản phẩm ngoài danh mục cần ảnh.</p>
                </div>
                <button type="button" onClick={() => setItems((current) => [...current, emptyLine()])} className="inline-flex min-h-9 items-center gap-1.5 rounded-admin-control px-2.5 text-xs font-semibold text-admin-primary transition-colors hover:bg-admin-primary/10">
                  <Plus size={15} aria-hidden="true" /> Thêm
                </button>
              </div>

              <div className="space-y-2.5">
                {items.map((item, index) => {
                  const selectedProduct = item.productId
                    ? products.find((product) => String(product.id) === item.productId)
                    : undefined;
                  const selectedProductImage = item.snapshotThumbnailUrl || (selectedProduct ? productImageSource(selectedProduct) : '');
                  const selectedProductAlt = `${productCode(item.productSku)} - ${item.productName}`;
                  const selectedProductGallery = productPreviewItems(
                    selectedProduct,
                    selectedProductImage,
                    selectedProductAlt,
                  );
                  const isManual = !item.productId;
                  const catalogPrice = selectedProduct ? selectedProduct.salePrice ?? selectedProduct.price : null;
                  const priceDifference = catalogPrice == null ? 0 : item.unitPrice - catalogPrice;
                  const fallbackProductOption: ProductSelectOption | null = item.productId
                    ? {
                        value: item.productId,
                        label: productOptionLabel(item.productSku, item.productName, item.unitPrice),
                        searchText: normalizeProductSearch(`${item.productSku ?? ''} ${item.productName}`),
                        productCode: item.productSku ?? undefined,
                        productName: item.productName,
                        price: item.unitPrice,
                        thumbnailUrl: item.snapshotThumbnailUrl,
                      }
                    : null;
                  const hasLoadedProductOption = productOptions.some((option) => option.value === item.productId);
                  const lineProductOptions = [
                    ...productOptions.map((option) => (
                      option.value === item.productId ? { ...option, isDisabled: false } : option
                    )),
                    ...(!hasLoadedProductOption && fallbackProductOption ? [fallbackProductOption] : []),
                  ];
                  const selectedProductOption = lineProductOptions.find(
                    (option) => option.value === (item.productId ?? 'manual'),
                  ) ?? lineProductOptions[0];
                  const isExpanded = expandedLineKeys.has(item.key);
                  const lineError = lineErrors[index];
                  const detailsId = `order-line-details-${item.key}`;
                  const errorId = `order-line-error-${index}`;
                  return (
                    <fieldset key={item.key} className={`min-w-0 rounded-admin-control border p-3 ${lineError ? 'border-admin-status-error/45 bg-red-50/50' : 'border-admin-border bg-admin-muted/25'}`}>
                      <legend className="px-1 text-[11px] font-semibold text-admin-text-muted">#{index + 1}</legend>
                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(5rem,6rem)_2.75rem_2.75rem] items-start gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(9.5rem,11rem)_minmax(5rem,6rem)_2.75rem_2.75rem] min-[1400px]:grid-cols-[minmax(0,1fr)_minmax(8.5rem,9.5rem)_minmax(4.5rem,5rem)_2.75rem_2.75rem]">
                        <div className="col-span-4 min-w-0 lg:col-span-1">
                          <label htmlFor={`order-line-product-${index}`} className={labelClass}>Sản phẩm</label>
                          <AdminSelect<string, ProductSelectOption>
                            inputId={`order-line-product-${index}`}
                            aria-label={`Tìm sản phẩm cụ thể cho dòng ${index + 1}`}
                            options={lineProductOptions}
                            value={selectedProductOption}
                            onChange={(option) => selectProduct(index, option?.value ?? 'manual')}
                            placeholder="Tìm theo mã hoặc tên sản phẩm"
                            filterOption={(option, inputValue) => (
                              option.data.searchText.includes(normalizeProductSearch(inputValue))
                            )}
                            formatOptionLabel={(option, meta) => (
                              <ProductOptionContent option={option} context={meta.context} />
                            )}
                            isSearchable
                            openMenuOnFocus
                          />
                        </div>
                        <div className="min-w-0">
                          <label htmlFor={`order-line-price-${index}`} className={labelClass}>Đơn giá</label>
                          <div className="relative">
                            <input
                              id={`order-line-price-${index}`}
                              type="text"
                              inputMode="numeric"
                              className={`${inputClass} pr-8 text-right tabular-nums`}
                              value={formatVndInput(item.unitPrice)}
                              onChange={(event) => updateLine(index, { unitPrice: parseVndInput(event.target.value) })}
                              aria-invalid={lineError?.fieldId === `order-line-price-${index}` || undefined}
                              aria-describedby={lineError?.fieldId === `order-line-price-${index}` ? errorId : undefined}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-admin-text-muted">₫</span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <label htmlFor={`order-line-quantity-${index}`} className={labelClass}>SL</label>
                          <input
                            id={`order-line-quantity-${index}`}
                            type="number"
                            min={1}
                            step={1}
                            className={inputClass}
                            value={item.quantity}
                            onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })}
                            aria-invalid={lineError?.fieldId === `order-line-quantity-${index}` || undefined}
                            aria-describedby={lineError?.fieldId === `order-line-quantity-${index}` ? errorId : undefined}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className={`${labelClass} invisible`} aria-hidden="true">Chi tiết</span>
                          <button
                            type="button"
                            onClick={() => setExpandedLineKeys((current) => {
                              const next = new Set(current);
                              if (next.has(item.key)) next.delete(item.key);
                              else next.add(item.key);
                              return next;
                            })}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control border border-admin-border bg-admin-card text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/30"
                            aria-label={`${isExpanded ? 'Thu gọn' : 'Mở'} chi tiết sản phẩm ${index + 1}`}
                            aria-expanded={isExpanded}
                            aria-controls={detailsId}
                          >
                            {isExpanded ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
                          </button>
                        </div>
                        <div className="min-w-0">
                          <span className={`${labelClass} invisible`} aria-hidden="true">Xóa</span>
                          <button type="button" onClick={() => removeLine(index)} disabled={items.length <= 1} className="inline-flex h-11 w-11 items-center justify-center rounded-admin-control text-admin-status-error transition-colors hover:bg-admin-status-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-status-error/30 disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Xóa sản phẩm ${index + 1}`}>
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div id={detailsId} className="mt-3 border-t border-admin-border pt-3">
                          {isManual ? (
                            <div>
                              <label htmlFor={`order-line-name-${index}`} className={labelClass}>Tên sản phẩm ngoài danh mục</label>
                              <input
                                id={`order-line-name-${index}`}
                                className={inputClass}
                                value={item.productName}
                                onChange={(event) => updateLine(index, { productName: event.target.value })}
                                placeholder="Ví dụ: Bó hoa thiết kế riêng"
                                aria-invalid={lineError?.fieldId === `order-line-name-${index}` || undefined}
                                aria-describedby={lineError?.fieldId === `order-line-name-${index}` ? errorId : undefined}
                              />
                            </div>
                          ) : (
                            <div className="flex min-w-0 items-center gap-2.5 text-xs text-admin-text-secondary">
                              <ImagePreview
                                src={selectedProductImage}
                                alt={selectedProductAlt}
                                title={selectedProductAlt}
                                previewTitle={selectedProductAlt}
                                gallery={selectedProductGallery}
                                buttonClassName="h-11 w-11 rounded-admin-control"
                                thumbnailClassName="h-11 w-11 rounded-admin-control border border-admin-border object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-mono text-xs font-semibold text-admin-text-primary">SKU: {productCode(item.productSku)}</p>
                                <p className="mt-0.5 text-admin-text-muted">
                                  {selectedProduct
                                    ? selectedProduct.tracksInventory
                                      ? `Tồn kho: ${selectedProduct.stock}`
                                      : 'Làm theo đơn, không trừ tồn kho'
                                    : 'Tồn kho: chưa có dữ liệu'}
                                </p>
                                {priceDifference !== 0 ? (
                                  <p className={`mt-0.5 font-medium ${priceDifference < 0 ? 'text-admin-status-warning' : 'text-admin-status-success'}`}>
                                    {priceDifference < 0 ? 'Giảm size' : 'Tăng size'} {priceDifference > 0 ? '+' : ''}{formatOrderCurrency(priceDifference)} so với giá danh mục
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          )}

                          <div className="mt-3 grid min-w-0 gap-3 lg:grid-cols-2 min-[1400px]:grid-cols-1 2xl:grid-cols-2">
                            <div className="min-w-0">
                              <label htmlFor={`order-line-note-${index}`} className={labelClass}>Ghi chú riêng cho sản phẩm</label>
                              <textarea id={`order-line-note-${index}`} className={`${inputClass} min-h-24 resize-y break-words`} value={item.note ?? ''} onChange={(event) => updateLine(index, { note: event.target.value })} placeholder="Màu hoa, kích thước và yêu cầu riêng" />
                            </div>
                            <div className="min-w-0">
                              <span className={labelClass}>Ảnh minh họa {isManual ? <span className="text-admin-status-error">*</span> : <span className="text-admin-text-muted">(không bắt buộc)</span>}</span>
                              <div className={`flex min-h-24 min-w-0 flex-wrap content-start items-center gap-2 rounded-admin-control border border-dashed p-2 ${lineError?.fieldId === `order-line-images-${index}` ? 'border-admin-status-error' : 'border-admin-border'}`}>
                                <OrderItemImagePreviews
                                  existingImages={item.existingImages}
                                  files={item.imageFiles}
                                  productName={item.productName || `sản phẩm ${index + 1}`}
                                  onRemove={(fileIndex) => updateLine(index, { imageFiles: item.imageFiles.filter((_, currentIndex) => currentIndex !== fileIndex) })}
                                />
                                <label htmlFor={`order-line-images-${index}`} className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-admin-control border border-admin-primary/35 px-3 text-xs font-semibold text-admin-primary transition-colors hover:bg-admin-primary/8">
                                  <ImagePlus size={15} aria-hidden="true" /> Thêm ảnh
                                </label>
                                <input
                                  id={`order-line-images-${index}`}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  multiple
                                  className="sr-only"
                                  aria-invalid={lineError?.fieldId === `order-line-images-${index}` || undefined}
                                  aria-describedby={lineError?.fieldId === `order-line-images-${index}` ? errorId : undefined}
                                  onChange={(event) => {
                                    const nextFiles = Array.from(event.target.files ?? []);
                                    updateLine(index, { imageFiles: [...item.imageFiles, ...nextFiles] });
                                    event.target.value = '';
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 border-t border-admin-border pt-3">
                            <p className="mb-2 text-xs font-semibold text-admin-text-secondary">Thiệp & banner</p>
                            <div className="grid gap-3 sm:grid-cols-2 min-[1400px]:grid-cols-1 2xl:grid-cols-2">
                              {([
                                ['hasCard', 'cardMessage', 'Ghi thiệp', 'Nội dung thiệp', `order-line-card-message-${index}`],
                                ['hasBanner', 'bannerMessage', 'In banner', 'Nội dung banner', `order-line-banner-message-${index}`],
                              ] as const).map(([toggleKey, messageKey, toggleLabel, messageLabel, messageId]) => (
                                <div key={toggleKey}>
                                  <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-xs font-semibold text-admin-text-primary">
                                    <input type="checkbox" checked={item[toggleKey]} onChange={(event) => updateLine(index, { [toggleKey]: event.target.checked, ...(!event.target.checked ? { [messageKey]: null } : {}) })} className="h-4 w-4 accent-admin-primary" />
                                    {toggleLabel}
                                  </label>
                                  {item[toggleKey] ? (
                                    <textarea
                                      id={messageId}
                                      aria-label={messageLabel}
                                      className={`${inputClass} mt-1 min-h-16 resize-y`}
                                      value={item[messageKey] ?? ''}
                                      onChange={(event) => updateLine(index, { [messageKey]: event.target.value })}
                                      placeholder={messageLabel}
                                      aria-invalid={lineError?.fieldId === messageId || undefined}
                                      aria-describedby={lineError?.fieldId === messageId ? errorId : undefined}
                                    />
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {lineError ? <p id={errorId} className="mt-2 text-xs font-medium text-admin-status-error" role="alert">{lineError.message}</p> : null}
                    </fieldset>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-4 min-[1400px]:sticky min-[1400px]:top-4">
            <section className={panelClass} aria-labelledby="delivery-section-title">
              <div className="mb-3">
                <h2 id="delivery-section-title" className="text-sm font-semibold text-admin-text-primary">Giao nhận</h2>
                <div className="mt-2 grid grid-cols-3 gap-1 rounded-admin-control border border-admin-border bg-admin-muted p-1" role="radiogroup" aria-label="Hình thức giao nhận">
                  {([
                    ['local', 'Giao nội thành'],
                    ['province', 'Ship tỉnh'],
                    ['pickup', 'Lấy tại shop'],
                  ] as const).map(([method, label]) => {
                    const selected = method === 'pickup' ? pickupAtShop : method === 'province' ? provinceShipping : !pickupAtShop && !provinceShipping;
                    return (
                      <button
                        key={method}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          setPickupAtShop(method === 'pickup');
                          setProvinceShipping(method === 'province');
                        }}
                        className={`min-h-10 rounded-admin-control px-2 text-xs font-semibold transition-colors ${selected ? 'bg-admin-card text-admin-primary shadow-sm' : 'text-admin-text-secondary hover:text-admin-text-primary'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {provinceShipping ? (
                  <p className="mt-2 rounded-admin-control bg-admin-primary/6 px-3 py-2 text-xs leading-5 text-admin-text-secondary">
                    Thời gian đơn hàng là lúc bàn giao cho đơn vị vận chuyển, không phải thời gian người nhận nhận hàng.
                  </p>
                ) : null}
              </div>

              {!pickupAtShop ? (
                ORDER_DELIVERY_LOCATION_UI_ENABLED ? (
                  <div className="space-y-2.5">
                    <div>
                      <label htmlFor="delivery-address" className={labelClass}>Địa chỉ nhận <span className="font-normal text-admin-text-muted">(không bắt buộc)</span></label>
                      <div className="flex gap-2">
                        <input
                          id="delivery-address"
                          className={inputClass}
                          value={deliveryAddress}
                          onChange={(event) => {
                            setDeliveryAddress(event.target.value);
                            setDeliveryLatitude(null);
                            setDeliveryLongitude(null);
                            setGeoResults([]);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void runGeoSearch(deliveryAddress);
                            }
                          }}
                          autoComplete="shipping street-address"
                          placeholder="Nhập địa chỉ, hệ thống sẽ tự tìm trên bản đồ"
                        />
                        <button type="button" onClick={() => void runGeoSearch(deliveryAddress)} disabled={geoSearching} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-admin-control border border-admin-border text-admin-text-primary transition-colors hover:bg-admin-muted disabled:opacity-50" aria-label="Tìm địa chỉ trên bản đồ">
                          {geoSearching ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
                        </button>
                      </div>
                    </div>

                    {geoResults.length > 0 ? (
                      <ul className="max-h-44 overflow-auto rounded-admin-control border border-admin-border bg-admin-card text-xs shadow-admin-panel" aria-label="Kết quả địa chỉ">
                        {geoResults.map((result) => (
                          <li key={`${result.lat}-${result.lon}`}>
                            <button type="button" onClick={() => pickGeo(result.lat, result.lon, result.display_name)} className="w-full border-b border-admin-border px-3 py-2.5 text-left leading-5 text-admin-text-secondary transition-colors last:border-0 hover:bg-admin-muted hover:text-admin-text-primary">
                              {result.display_name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {geoError ? <p className="text-xs leading-5 text-admin-status-error" role="status">{geoError}</p> : null}

                    <div>
                      <label htmlFor="delivery-address-description" className={labelClass}>Mô tả địa chỉ nhận</label>
                      <textarea
                        id="delivery-address-description"
                        className={`${inputClass} min-h-16 resize-y`}
                        value={deliveryAddressDescription}
                        onChange={(event) => setDeliveryAddressDescription(event.target.value)}
                        placeholder="Ví dụ: hẻm bên cạnh số 25, cổng màu xanh, gọi khách khi tới"
                      />
                      <p className="mt-1 text-[11px] leading-4 text-admin-text-muted">Dùng khi địa chỉ thực tế không có hoặc chưa chính xác trên bản đồ.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={useCurrentLocation} disabled={geoSearching} className="inline-flex min-h-9 items-center gap-1.5 rounded-admin-control border border-admin-border px-2.5 text-xs font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted disabled:opacity-50">
                        <LocateFixed size={14} aria-hidden="true" /> Vị trí hiện tại
                      </button>
                      <button type="button" onClick={() => setShowMap((current) => !current)} className="inline-flex min-h-9 items-center gap-1.5 rounded-admin-control px-2.5 text-xs font-semibold text-admin-primary transition-colors hover:bg-admin-primary/10">
                        <MapPin size={14} aria-hidden="true" /> {showMap ? 'Ẩn bản đồ' : 'Mở bản đồ'}
                        {showMap ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
                      </button>
                      {deliveryLatitude != null && deliveryLongitude != null ? (
                        <span className="text-[11px] text-admin-status-success">Đã ghim vị trí</span>
                      ) : null}
                    </div>

                    {showMap ? (
                      <DeliveryLocationPicker
                        latitude={deliveryLatitude}
                        longitude={deliveryLongitude}
                        className="h-80 2xl:h-96"
                        onChange={(latitude, longitude) => void pickMapPoint(latitude, longitude)}
                      />
                    ) : null}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="delivery-address" className={labelClass}>Mô tả địa chỉ nhận</label>
                    <textarea
                      id="delivery-address"
                      className={`${inputClass} min-h-20 resize-y`}
                      value={deliveryAddress}
                      onChange={(event) => {
                        setDeliveryAddress(event.target.value);
                        setDeliveryLatitude(null);
                        setDeliveryLongitude(null);
                      }}
                      autoComplete="shipping street-address"
                      placeholder="Nhập đầy đủ địa chỉ và ghi chú chỉ đường nếu cần"
                    />
                  </div>
                )
              ) : (
                <p className="rounded-admin-control bg-admin-muted px-3 py-2.5 text-xs leading-5 text-admin-text-secondary">Không cần địa chỉ và phí giao hàng.</p>
              )}
            </section>

            <section className={panelClass} aria-labelledby="cost-section-title">
              <h2 id="cost-section-title" className="mb-3 text-sm font-semibold text-admin-text-primary">Chi phí & ghi chú</h2>
              <div className={`grid gap-2.5 ${isEdit ? 'sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3' : 'grid-cols-2'}`}>
                <div>
                  <label htmlFor="deposit-amount" className={labelClass}>Tiền cọc</label>
                  <div className="relative">
                    <input id="deposit-amount" type="text" inputMode="numeric" className={`${inputClass} pr-8 text-right tabular-nums`} value={formatVndInput(depositAmount)} onChange={(event) => { setDepositAmount(parseVndInput(event.target.value)); setDepositWasManuallyEdited(true); }} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-admin-text-muted">₫</span>
                  </div>
                  <button type="button" onClick={() => { setDepositAmount(calculateDefaultDeposit(orderValue)); setDepositWasManuallyEdited(false); }} className="mt-1 text-[11px] font-semibold text-admin-primary hover:underline">Áp dụng cọc mặc định</button>
                </div>
                <div>
                  <label htmlFor="shipping-fee" className={labelClass}>Phí giao dự kiến</label>
                  <div className="relative">
                    <input id="shipping-fee" type="text" inputMode="numeric" className={`${inputClass} pr-8 text-right tabular-nums`} disabled={pickupAtShop} value={formatVndInput(shippingFee)} onChange={(event) => setShippingFee(parseVndInput(event.target.value))} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-admin-text-muted">₫</span>
                  </div>
                </div>
                {isEdit ? (
                  <div>
                    <label htmlFor="shipping-fee-actual" className={labelClass}>Phí giao thực tế</label>
                    <div className="relative">
                      <input id="shipping-fee-actual" type="text" inputMode="numeric" className={`${inputClass} pr-8 text-right tabular-nums`} disabled={pickupAtShop} value={formatVndInput(shippingFeeActual)} onChange={(event) => setShippingFeeActual(event.target.value.replace(/\D/g, ''))} placeholder="Chưa có" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-admin-text-muted">₫</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="mt-2.5">
                <label htmlFor="order-content-note" className={labelClass}>Ghi chú đơn hàng</label>
                <textarea id="order-content-note" className={`${inputClass} min-h-16 resize-y`} value={contentNote} onChange={(event) => setContentNote(event.target.value)} placeholder="Nội dung cần lưu ý (không bắt buộc)" />
              </div>
            </section>
          </div>
        </div>

      </form>

      {quickImportOpen ? (
        <QuickOrderBatchImportDialog
          channelId={channelId}
          products={products}
          initialRecipientName={recipientName}
          initialOrdererName={ordererName}
          onClose={() => setQuickImportOpen(false)}
          onSaved={(createdCount) => {
            setQuickImportOpen(false);
            navigate('/admin/orders', { state: { successMessage: `Đã tạo thành công ${createdCount} đơn hàng.` } });
          }}
        />
      ) : null}
    </div>
  );
};

export const OrderCreatePage: React.FC = () => <OrderEditor />;

export const OrderEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <OrderEditor orderId={id} />;
};
