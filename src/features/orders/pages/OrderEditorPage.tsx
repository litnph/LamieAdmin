import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Leaf,
  LoaderCircle,
  LocateFixed,
  MapPin,
  MessageSquareText,
  PackageOpen,
  Search,
} from '@/shared/icons/lucideAnimated';
import { PageHeader } from '@/shared/components/PageHeader';
import { ProductApi, type ProductDto } from '@/features/product/api/productApi';
import { channelsApi, type ChannelDto } from '@/features/settings/channels/api/channelsApi';
import { AttributesApi } from '@/features/settings/attributes/api/attributesApi';
import type { AttributeItem } from '@/features/settings/attributes/types/attributes.types';
import { ingredientsApi } from '@/features/ingredients/api/ingredientsApi';
import type { IngredientDto } from '@/features/ingredients/types/ingredient.types';
import { inventoryApi } from '@/features/ingredients/api/inventoryApi';
import type { InventoryMaterialDraft } from '@/features/ingredients/components/InventoryMaterialsEditor';
import type { InventoryItem } from '@/features/ingredients/types/inventory.types';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { formatVndInput, parseVndInput } from '@/shared/utils/displayFormatters';
import { ordersApi } from '../api/ordersApi';
import { orderStatusLabel } from '../constants/orderLabels';
import { DeliveryLocationPicker } from '../components/DeliveryLocationPicker';
import { CustomerMemberLookup, type SelectedMember } from '../components/CustomerMemberLookup';
import { QuickOrderBatchImportDialog } from '../components/QuickOrderBatchImportDialog';
import { AdministrativeAddressFields, type AdministrativeAddressValue } from '../components/AdministrativeAddressFields';
import { AddressAutoImport } from '../components/AddressAutoImport';
import { OrderLineIngredientsEditor } from '../components/OrderLineIngredientsEditor';
import {
  OrderProductLinesEditor,
  type OrderProductLineDraft,
  type ProductLineValidationError,
} from '../components/OrderProductLinesEditor';
import type { AddressResolutionDto } from '../types/administrativeAddress.types';
import { AdministrativeScheme, OrderStatus, PaymentMethod, PaymentStatus, type OrderImageUpload, type OrderMaterialDto, type SaveOrderMaterialItem } from '../types/order.types';
import { nominatimReverse, nominatimSearch } from '../utils/geocode';
import { calculateDefaultDeposit } from '../utils/deposit';

const inputClass =
  'min-h-11 w-full rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2 text-sm text-admin-text-primary placeholder:text-admin-text-muted transition-colors focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-disabled-bg disabled:text-admin-disabled-text';
const labelClass = 'mb-1 block min-h-4 text-xs font-medium leading-4 text-admin-text-secondary';
const panelClass = 'rounded-admin-panel border border-admin-border bg-admin-card p-4 shadow-admin-panel';
const ORDER_DELIVERY_LOCATION_UI_ENABLED = false;
const OUTSIDE_CATALOG_PRODUCT_NAME = 'Sản phẩm ngoài danh mục';
type LineDraft = OrderProductLineDraft;

type OrderInventoryMaterialDraft = InventoryMaterialDraft & {
  lineKey: string;
};

type EditorProps = { orderId?: string };

type LineValidationError = ProductLineValidationError;

const createLineKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const emptyLine = (): LineDraft => ({
  key: createLineKey(),
  productName: OUTSIDE_CATALOG_PRODUCT_NAME,
  unitPrice: 0,
  quantity: 1,
  imageFiles: [],
  existingImages: [],
  hasCard: false,
  cardMessage: null,
  hasBanner: false,
  bannerMessage: null,
  ingredientDrafts: [],
  ingredientOrigin: 'empty',
});

const productName = (product: ProductDto) =>
  product.translations.find((translation) => translation.languageCode.toLowerCase().startsWith('vi'))?.name?.trim()
  || product.translations[0]?.name?.trim()
  || product.sku;

const quantityText = (value: number) => String(Number(value.toFixed(6)));

const inventoryItemIdForStockUnit = (stockUnitId: string, inventoryItems: InventoryItem[]) =>
  inventoryItems.find((item) => item.stockUnits.some((unit) => unit.id === stockUnitId))?.id ?? '';

const suggestedInventoryMaterialsForLine = (
  line: LineDraft,
  products: ProductDto[],
  inventoryItems: InventoryItem[],
): OrderInventoryMaterialDraft[] => {
  if (!line.productId) return [];
  const product = products.find((candidate) => String(candidate.id) === line.productId);
  return [...(product?.inventoryMaterials ?? [])]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((material) => ({
      key: `${line.key}-suggested-${material.stockUnitId}`,
      lineKey: line.key,
      inventoryItemId: inventoryItemIdForStockUnit(material.stockUnitId, inventoryItems),
      stockUnitId: material.stockUnitId,
      quantity: quantityText(material.quantity),
    }));
};

const distributeSavedInventoryMaterials = (
  lines: LineDraft[],
  savedMaterials: OrderMaterialDto[],
  products: ProductDto[],
  inventoryItems: InventoryItem[],
): OrderInventoryMaterialDraft[] => {
  if (lines.length === 0) return [];
  return savedMaterials.flatMap((material) => {
    const candidates = lines.flatMap((line) => {
      if (!line.productId || line.quantity <= 0) return [];
      const product = products.find((candidate) => String(candidate.id) === line.productId);
      const productMaterial = product?.inventoryMaterials?.find((candidate) => candidate.stockUnitId === material.stockUnitId);
      if (!productMaterial) return [];
      return [{ line, weight: productMaterial.quantity * line.quantity }];
    });
    const targets = candidates.length > 0 ? candidates : [{ line: lines[0], weight: 1 }];
    const totalWeight = targets.reduce((total, target) => total + target.weight, 0) || targets.length;
    let remaining = material.requiredQuantity;
    return targets.map((target, index) => {
      const allocatedTotal = index === targets.length - 1
        ? remaining
        : Number((material.requiredQuantity * (target.weight / totalWeight)).toFixed(6));
      remaining = Number((remaining - allocatedTotal).toFixed(6));
      return {
        key: `${material.id}-${target.line.key}`,
        id: index === 0 ? material.id : undefined,
        lineKey: target.line.key,
        inventoryItemId: material.inventoryItemId || inventoryItemIdForStockUnit(material.stockUnitId, inventoryItems),
        stockUnitId: material.stockUnitId,
        quantity: quantityText(allocatedTotal / Math.max(1, target.line.quantity)),
      };
    });
  });
};

const flattenInventoryMaterials = (
  materials: OrderInventoryMaterialDraft[],
  lines: LineDraft[],
  persistedIdsByStockUnit: Record<string, string> = {},
): SaveOrderMaterialItem[] => {
  const lineQuantities = new Map(lines.map((line) => [line.key, Math.max(0, line.quantity)]));
  const totals = new Map<string, SaveOrderMaterialItem>();
  materials.forEach((material) => {
    const requiredQuantity = Number(material.quantity) * (lineQuantities.get(material.lineKey) ?? 0);
    const current = totals.get(material.stockUnitId);
    if (current) {
      current.quantity = Number((current.quantity + requiredQuantity).toFixed(6));
      if (!current.id && material.id) current.id = material.id;
      return;
    }
    totals.set(material.stockUnitId, {
      id: material.id ?? persistedIdsByStockUnit[material.stockUnitId],
      stockUnitId: material.stockUnitId,
      quantity: Number(requiredQuantity.toFixed(6)),
    });
  });
  return [...totals.values()];
};

const attributeName = (attribute: AttributeItem) =>
  attribute.translations.find((translation) => translation.languageCode.toLowerCase().startsWith('vi'))?.name?.trim()
  || attribute.translations[0]?.name?.trim()
  || attribute.code
  || `Thuộc tính #${attribute.id}`;

const productImageSource = (product: ProductDto) => {
  const detailImage = [...product.images]
    .filter((image) => image.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)[0]?.imageUrl;
  return product.thumbnailUrl || detailImage || '';
};

const catalogLineFromProduct = (line: LineDraft, selected: ProductDto): LineDraft => {
  const defaultIngredients = selected.ingredients ?? [];
  return {
    ...line,
    productId: String(selected.id),
    categoryId: selected.categoryId ?? undefined,
    productTypeId: selected.productTypeId ?? undefined,
    productSku: selected.sku,
    productName: productName(selected),
    unitPrice: selected.salePrice ?? selected.price,
    snapshotThumbnailUrl: productImageSource(selected),
    ingredientDrafts: [...defaultIngredients]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((ingredient) => ({
        key: createLineKey(),
        ingredientId: ingredient.ingredientId,
        baseQuantity: ingredient.baseQuantity,
        note: ingredient.note ?? '',
        sortOrder: ingredient.sortOrder,
      })),
    ingredientOrigin: defaultIngredients.length > 0 ? 'default' : 'empty',
  };
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
  if (fallback === 'A Member with this phone already exists. Select that Member before saving the order.') {
    return 'Số điện thoại này đã thuộc một Member. Hãy chọn đúng Member trong danh sách gợi ý trước khi lưu đơn.';
  }
  if (fallback === 'Multiple Members use this phone. Select the intended Member before saving the order.') {
    return 'Có nhiều Member dùng số điện thoại này. Hãy chọn đúng Member trong danh sách gợi ý trước khi lưu đơn.';
  }
  return fallback;
};

const toLocalInput = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const OrderEditor: React.FC<EditorProps> = ({ orderId }) => {
  const navigate = useNavigate();
  const isEdit = Boolean(orderId);
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<AttributeItem[]>([]);
  const [productTypes, setProductTypes] = useState<AttributeItem[]>([]);
  const [ingredientCatalog, setIngredientCatalog] = useState<IngredientDto[]>([]);
  const [inventoryCatalog, setInventoryCatalog] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addressImporting, setAddressImporting] = useState(false);
  const submitLockRef = useRef(false);
  const persistedMaterialIdsRef = useRef<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<number, LineValidationError>>({});
  const [loadedOrderStatus, setLoadedOrderStatus] = useState<OrderStatus | null>(null);
  const [rowVersion, setRowVersion] = useState<string | undefined>();

  const [ordererName, setOrdererName] = useState('');
  const [ordererPhone, setOrdererPhone] = useState('');
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);
  const [createMember, setCreateMember] = useState(true);
  const [channelId, setChannelId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientIsOrderer, setRecipientIsOrderer] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [pickupAtShop, setPickupAtShop] = useState(false);
  const [provinceShipping, setProvinceShipping] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [administrativeAddress, setAdministrativeAddress] = useState<AdministrativeAddressValue>({
    scheme: AdministrativeScheme.Current,
    provinceCode: '',
    provinceName: '',
    districtCode: '',
    districtName: '',
    communeCode: '',
    communeName: '',
    detail: '',
  });
  const [fullAddressSnapshot, setFullAddressSnapshot] = useState('');
  const [deliveryAddressDescription, setDeliveryAddressDescription] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [deliveryAt, setDeliveryAt] = useState('');
  const [deliveryTo, setDeliveryTo] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'exact' | 'range'>('exact');
  const [depositAmount, setDepositAmount] = useState(100_000);
  const [isPaid, setIsPaid] = useState(false);
  const [confirmPaymentReceived, setConfirmPaymentReceived] = useState(false);
  const [paymentReceivedAt, setPaymentReceivedAt] = useState(() => {
    const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date());
    return parts.replace(' ', 'T');
  });
  const paymentIdempotencyKeyRef = useRef(globalThis.crypto?.randomUUID?.() ?? `create-payment-${Date.now()}`);
  const [depositWasManuallyEdited, setDepositWasManuallyEdited] = useState(isEdit);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingFeeActual, setShippingFeeActual] = useState('');
  const [description, setDescription] = useState('');
  const [contentNote, setContentNote] = useState('');
  const [items, setItems] = useState<LineDraft[]>([emptyLine()]);
  const [inventoryMaterials, setInventoryMaterials] = useState<OrderInventoryMaterialDraft[]>([]);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [expandedLineKeys, setExpandedLineKeys] = useState<Set<string>>(() => new Set(items.map((item) => item.key)));
  const [quickImportOpen, setQuickImportOpen] = useState(false);

  const orderRequiredQuantityByStockUnit = useMemo(() => Object.fromEntries(
    flattenInventoryMaterials(inventoryMaterials, items).map((material) => [material.stockUnitId, material.quantity]),
  ), [inventoryMaterials, items]);

  const [showMap, setShowMap] = useState(false);
  const [geoSearching, setGeoSearching] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoResults, setGeoResults] = useState<Awaited<ReturnType<typeof nominatimSearch>>>([]);
  const geoSearchAbortRef = useRef<AbortController | null>(null);
  const skipAddressSearchRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!orderId) {
        persistedMaterialIdsRef.current = {};
        const [loadedChannels, loadedProducts, loadedCategories, loadedProductTypes, loadedIngredients, loadedInventory] = await Promise.all([
          channelsApi.list(),
          ProductApi.getAll(),
          AttributesApi.getAll<AttributeItem>('categories'),
          AttributesApi.getAll<AttributeItem>('product-types'),
          ingredientsApi.listAll({ includeInactive: true }),
          inventoryApi.listItems(true),
        ]);
        setChannels(loadedChannels);
        setProducts(loadedProducts);
        setCategories(loadedCategories);
        setProductTypes(loadedProductTypes);
        setIngredientCatalog(loadedIngredients);
        setInventoryCatalog(loadedInventory);
        const defaultChannel = loadedChannels.find((channel) => channel.code === 'admin' && channel.isActive)
          ?? loadedChannels.find((channel) => channel.isActive);
        setChannelId(defaultChannel?.id ?? '');
        return;
      }

      const [loadedChannels, loadedProducts, loadedCategories, loadedProductTypes, loadedIngredients, loadedInventory, order] = await Promise.all([
        channelsApi.list(),
        ProductApi.getAll(),
        AttributesApi.getAll<AttributeItem>('categories'),
        AttributesApi.getAll<AttributeItem>('product-types'),
        ingredientsApi.listAll({ includeInactive: true }),
        inventoryApi.listItems(true),
        ordersApi.getById(orderId),
      ]);
      setChannels(loadedChannels);
      setProducts(loadedProducts);
      setCategories(loadedCategories);
      setProductTypes(loadedProductTypes);
      setIngredientCatalog(loadedIngredients);
      setInventoryCatalog(loadedInventory);
      setOrdererName(order.ordererName);
      setOrdererPhone(order.ordererPhone);
      setSelectedMember(order.customerId ? {
        id: order.customerId,
        name: order.ordererName,
        phone: order.ordererPhone,
      } : null);
      setChannelId(order.channelId);
      setRecipientName(order.recipientName);
      setRecipientPhone(order.recipientPhone);
      setSenderName(order.senderName ?? '');
      setSenderPhone(order.senderPhone ?? '');
      setRecipientIsOrderer(
        order.ordererName.trim() === order.recipientName.trim()
        && order.ordererPhone.trim() === order.recipientPhone.trim(),
      );
      setPickupAtShop(order.pickupAtShop);
      setProvinceShipping(order.provinceShipping);
      const primaryDeliveryAddress = order.deliveryAddress?.trim() ?? '';
      const legacyAddressDescription = order.deliveryAddressDescription?.trim() ?? '';
      setDeliveryAddress(primaryDeliveryAddress || legacyAddressDescription);
      setAdministrativeAddress({
        scheme: order.addressScheme ?? AdministrativeScheme.Current,
        provinceCode: order.provinceCode ?? '',
        provinceName: order.provinceName ?? '',
        districtCode: order.districtCode ?? '',
        districtName: order.districtName ?? '',
        communeCode: order.communeCode ?? '',
        communeName: order.communeName ?? '',
        detail: order.addressDetail ?? (order.addressScheme == null ? primaryDeliveryAddress || legacyAddressDescription : ''),
      });
      setFullAddressSnapshot(order.fullAddressSnapshot ?? (primaryDeliveryAddress || legacyAddressDescription));
      setDeliveryAddressDescription(primaryDeliveryAddress ? legacyAddressDescription : '');
      setDeliveryLatitude(order.deliveryLatitude ?? null);
      setDeliveryLongitude(order.deliveryLongitude ?? null);
      setDeliveryAt(toLocalInput(order.deliveryAt));
      setDeliveryTo(order.deliveryTo ? toLocalInput(order.deliveryTo) : '');
      setDeliveryMode(order.deliveryTo ? 'range' : 'exact');
      setDepositAmount(order.depositAmount);
      setIsPaid(order.paymentStatus === PaymentStatus.Paid);
      setShippingFee(order.shippingFee);
      setShippingFeeActual(order.shippingFeeActual == null ? '' : String(order.shippingFeeActual));
      setDescription(order.description ?? '');
      setContentNote(order.contentNote ?? '');
      setLoadedOrderStatus(order.orderStatus);
      setRowVersion(order.rowVersion ?? undefined);
      setExpandedLineKeys(new Set());
      const loadedLines: LineDraft[] = order.items.length > 0
        ? order.items.map((item) => ({
            key: item.id,
            id: item.id,
            productId: item.productId ?? undefined,
            categoryId: item.categoryId ?? undefined,
            productTypeId: item.productTypeId ?? undefined,
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
            ingredientDrafts: (item.ingredientSnapshots ?? [])
              .sort((left, right) => left.sortOrder - right.sortOrder)
              .map((ingredient) => ({
                key: ingredient.id,
                ingredientId: ingredient.ingredientId ?? 0,
                baseQuantity: ingredient.perProductBaseQuantity,
                note: ingredient.note ?? '',
                sortOrder: ingredient.sortOrder,
              })),
            ingredientOrigin: item.ingredientSnapshotCapturedAt ? 'order' : 'empty',
          }))
        : [emptyLine()];
      setItems(loadedLines);
      persistedMaterialIdsRef.current = Object.fromEntries(
        (order.materials ?? []).map((material) => [material.stockUnitId, material.id]),
      );
      setInventoryMaterials(distributeSavedInventoryMaterials(
        loadedLines,
        order.materials ?? [],
        loadedProducts,
        loadedInventory,
      ));
    } catch (requestError) {
      setLoadError(getOrderEditorErrorMessage(requestError, null));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const applyResolvedAddress = useCallback((resolution: AddressResolutionDto) => {
    const selected = resolution.selectedCandidate;
    setAdministrativeAddress(selected ? {
      scheme: selected.scheme,
      provinceCode: selected.provinceCode ?? '',
      provinceName: selected.provinceName ?? '',
      districtCode: selected.districtCode ?? '',
      districtName: selected.districtName ?? '',
      communeCode: selected.communeCode ?? '',
      communeName: selected.communeName ?? '',
      detail: selected.addressDetail ?? '',
    } : {
      scheme: AdministrativeScheme.Current,
      provinceCode: '',
      provinceName: '',
      districtCode: '',
      districtName: '',
      communeCode: '',
      communeName: '',
      detail: resolution.originalText,
    });
    setDeliveryAddress(resolution.originalText);
    setFullAddressSnapshot(resolution.originalText);
    setDeliveryLatitude(null);
    setDeliveryLongitude(null);
  }, []);

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
    const lineKey = items[index]?.key;
    if (!lineKey) return;
    if (value === 'manual') {
      updateLine(index, {
        productId: undefined,
        categoryId: undefined,
        productTypeId: undefined,
        productSku: undefined,
        productName: OUTSIDE_CATALOG_PRODUCT_NAME,
        unitPrice: 0,
        snapshotThumbnailUrl: undefined,
        ingredientDrafts: [],
        ingredientOrigin: 'empty',
      });
      setInventoryMaterials((current) => current.filter((material) => material.lineKey !== lineKey));
      setMaterialsError(null);
      return;
    }
    const selected = products.find((product) => String(product.id) === value);
    if (!selected) return;
    const nextLine = catalogLineFromProduct(items[index], selected);
    updateLine(index, nextLine);
    setInventoryMaterials((current) => [
      ...current.filter((material) => material.lineKey !== lineKey),
      ...suggestedInventoryMaterialsForLine(nextLine, products, inventoryCatalog),
    ]);
    setMaterialsError(null);
    setExpandedLineKeys((current) => new Set(current).add(items[index].key));
  };

  const addManualProduct = () => {
    const line = emptyLine();
    const nextIndex = items.length;
    setItems((current) => [...current, line]);
    setExpandedLineKeys((current) => new Set(current).add(line.key));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(`order-line-category-${nextIndex}`)?.focus();
    }));
  };

  const addCatalogProduct = (productId: string) => {
    const selected = products.find((product) => String(product.id) === productId);
    if (!selected) return;
    const line = catalogLineFromProduct(emptyLine(), selected);
    setItems((current) => [...current, line]);
    setInventoryMaterials((current) => [
      ...current,
      ...suggestedInventoryMaterialsForLine(line, products, inventoryCatalog),
    ]);
    setMaterialsError(null);
    setExpandedLineKeys((current) => new Set(current).add(line.key));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(`order-line-price-${items.length}`)?.focus();
    }));
  };

  const removeLine = (index: number) => {
    if (items.length <= 1) return;
    const removedKey = items[index]?.key;
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (removedKey) {
      setInventoryMaterials((current) => current.filter((material) => material.lineKey !== removedKey));
      setExpandedLineKeys((current) => {
        const next = new Set(current);
        next.delete(removedKey);
        return next;
      });
    }
    setLineErrors({});
  };

  const applyProductMaterialDefaults = async (index: number) => {
    const line = items[index];
    const product = line?.productId
      ? products.find((candidate) => String(candidate.id) === line.productId)
      : undefined;
    if (!line || !product) throw new Error('Product defaults are unavailable.');

    const nextIngredients = [...(product.ingredients ?? [])]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((ingredient) => ({
        key: createLineKey(),
        ingredientId: ingredient.ingredientId,
        baseQuantity: ingredient.baseQuantity,
        note: ingredient.note ?? '',
        sortOrder: ingredient.sortOrder,
      }));
    const nextInventoryMaterials = suggestedInventoryMaterialsForLine(line, products, inventoryCatalog);

    updateLine(index, {
      ingredientDrafts: nextIngredients,
      ingredientOrigin: nextIngredients.length > 0 ? 'default' : 'empty',
    });
    setInventoryMaterials((current) => [
      ...current.filter((material) => material.lineKey !== line.key),
      ...nextInventoryMaterials,
    ]);
    setMaterialsError(null);
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
    setMaterialsError(null);
    const requireValue = (value: string, message: string, fieldId: string) => {
      if (value.trim()) return;
      problems.push(message);
      if (!firstField) firstField = fieldId;
    };

    requireValue(ordererName, 'Chưa nhập tên người đặt.', 'orderer-name');
    requireValue(ordererPhone, 'Chưa nhập số điện thoại người đặt.', 'orderer-phone');
    requireValue(channelId, 'Chưa chọn kênh đặt hàng.', 'order-channel');
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

    const hasAnyAdministrativeSelection = Boolean(
      administrativeAddress.provinceCode
      || administrativeAddress.districtCode
      || administrativeAddress.communeCode,
    );
    if (!pickupAtShop && hasAnyAdministrativeSelection) {
      if (!administrativeAddress.provinceCode) problems.push('Vui lòng chọn tỉnh hoặc thành phố.');
      if (administrativeAddress.scheme === AdministrativeScheme.Legacy && !administrativeAddress.districtCode) {
        problems.push('Địa chỉ cũ cần quận, huyện, thị xã hoặc thành phố.');
      }
      if (!administrativeAddress.communeCode) problems.push('Vui lòng chọn xã, phường hoặc đơn vị tương ứng.');
      if (!firstField && (!administrativeAddress.provinceCode || !administrativeAddress.communeCode)) {
        firstField = 'address-province';
      }
    }

    items.forEach((item, index) => {
      if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
        nextLineErrors[index] = {
          message: 'Số lượng phải là số nguyên từ 1 trở lên.',
          fieldId: `order-line-quantity-${index}`,
          inDetails: false,
        };
      } else if (!item.productId && !item.categoryId) {
        nextLineErrors[index] = {
          message: 'Chọn danh mục cho sản phẩm ngoài danh mục.',
          fieldId: `order-line-category-${index}`,
          inDetails: false,
        };
      } else if (!item.productId && !item.productTypeId) {
        nextLineErrors[index] = {
          message: 'Chọn dòng sản phẩm cho sản phẩm ngoài danh mục.',
          fieldId: `order-line-product-type-${index}`,
          inDetails: false,
        };
      } else if (item.unitPrice <= 0) {
        nextLineErrors[index] = {
          message: 'Đơn giá sản phẩm phải lớn hơn 0.',
          fieldId: `order-line-price-${index}`,
          inDetails: false,
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
      } else {
        const invalidIngredientIndex = item.ingredientDrafts.findIndex((ingredient) => (
          ingredient.ingredientId <= 0
          || !Number.isFinite(ingredient.baseQuantity)
          || ingredient.baseQuantity <= 0
        ));
        const uniqueIngredientIds = new Set(item.ingredientDrafts.map((ingredient) => ingredient.ingredientId));
        if (invalidIngredientIndex >= 0) {
          nextLineErrors[index] = {
            message: 'Chọn nguyên liệu và nhập số lượng lớn hơn 0.',
            fieldId: `order-line-ingredient-quantity-${index}-${invalidIngredientIndex}`,
            inDetails: false,
          };
        } else if (uniqueIngredientIds.size !== item.ingredientDrafts.length) {
          nextLineErrors[index] = {
            message: 'Một nguyên liệu chỉ được xuất hiện một lần trong cùng dòng sản phẩm.',
            fieldId: `order-line-ingredient-${index}-0`,
            inDetails: false,
          };
        }
      }
      const lineError = nextLineErrors[index];
      if (lineError) {
        detailErrorKeys.add(item.key);
        if (!firstField) firstField = lineError.fieldId;
      }
    });

    const invalidMaterial = inventoryMaterials.some((material) => (
      !material.stockUnitId
      || !/^\d+(?:\.\d{1,6})?$/.test(material.quantity.trim())
      || Number(material.quantity) <= 0
    ));
    const materialKeys = inventoryMaterials.map((material) => `${material.lineKey}:${material.stockUnitId}`);
    const hasDuplicateMaterialInLine = new Set(materialKeys).size !== materialKeys.length;
    if (invalidMaterial || hasDuplicateMaterialInLine) {
      const message = invalidMaterial
        ? 'Mỗi vật tư kho cần hàng tồn kho, size khi có và định mức lớn hơn 0.'
        : 'Một vật tư kho và size chỉ được xuất hiện một lần trong cùng sản phẩm.';
      setMaterialsError(message);
      problems.push(message);
      if (!firstField) firstField = 'order-inventory-materials';
    }
    if (depositAmount > orderValue) {
      problems.push('Số tiền đã thanh toán hoặc cọc không được lớn hơn tổng đơn.');
      if (!firstField) firstField = 'deposit-amount';
    }
    if (!isEdit && (isPaid || confirmPaymentReceived) && !paymentReceivedAt) {
      problems.push('Chưa nhập thời điểm thực nhận tiền.');
      if (!firstField) firstField = 'payment-received-at';
    }

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
    if (addressImporting) {
      setError('Địa chỉ đang được phân tích. Vui lòng chờ hoàn tất trước khi lưu đơn.');
      document.getElementById('address-auto-import')?.focus();
      return;
    }
    if (!validate()) return;
    submitLockRef.current = true;
    setSaving(true);
    setError(null);
    const orderItems = items.map(({ id, productId, categoryId, productTypeId, productSku, productName: name, unitPrice, quantity, note, hasCard, cardMessage, hasBanner, bannerMessage, ingredientDrafts }) => ({
      id,
      productId,
      categoryId,
      productTypeId,
      productSku,
      productName: name.trim(),
      unitPrice,
      quantity,
      note: note?.trim() || undefined,
      hasCard,
      cardMessage: hasCard ? cardMessage?.trim() || null : null,
      hasBanner,
      bannerMessage: hasBanner ? bannerMessage?.trim() || null : null,
      ingredients: ingredientDrafts.map((ingredient, sortOrder) => ({
        ingredientId: ingredient.ingredientId,
        baseQuantity: ingredient.baseQuantity,
        note: ingredient.note.trim() || null,
        sortOrder,
      })),
    }));

    try {
      const deliveryIso = new Date(deliveryAt).toISOString();
      const deliveryToIso = deliveryMode === 'range' && deliveryTo
        ? new Date(deliveryTo).toISOString()
        : undefined;
      const commonPayload = {
        ordererName: ordererName.trim(),
        ordererPhone: ordererPhone.trim(),
        customerId: selectedMember?.id ?? null,
        createMember,
        channelId,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        pickupAtShop,
        provinceShipping,
        deliveryAddress: pickupAtShop || administrativeAddress.provinceCode
          ? undefined
          : (ORDER_DELIVERY_LOCATION_UI_ENABLED
            ? deliveryAddress.trim()
            : administrativeAddress.detail.trim()) || undefined,
        deliveryAddressDescription: pickupAtShop || !ORDER_DELIVERY_LOCATION_UI_ENABLED
          ? undefined
          : deliveryAddressDescription || undefined,
        addressScheme: !pickupAtShop && administrativeAddress.provinceCode && administrativeAddress.communeCode
          ? administrativeAddress.scheme
          : undefined,
        provinceCode: !pickupAtShop ? administrativeAddress.provinceCode || undefined : undefined,
        provinceName: !pickupAtShop ? administrativeAddress.provinceName || undefined : undefined,
        districtCode: !pickupAtShop && administrativeAddress.scheme === AdministrativeScheme.Legacy
          ? administrativeAddress.districtCode || undefined
          : undefined,
        districtName: !pickupAtShop && administrativeAddress.scheme === AdministrativeScheme.Legacy
          ? administrativeAddress.districtName || undefined
          : undefined,
        communeCode: !pickupAtShop ? administrativeAddress.communeCode || undefined : undefined,
        communeName: !pickupAtShop ? administrativeAddress.communeName || undefined : undefined,
        addressDetail: !pickupAtShop ? administrativeAddress.detail.trim() || undefined : undefined,
        fullAddressSnapshot: !pickupAtShop ? fullAddressSnapshot.trim() || undefined : undefined,
        deliveryLatitude: pickupAtShop ? undefined : deliveryLatitude ?? undefined,
        deliveryLongitude: pickupAtShop ? undefined : deliveryLongitude ?? undefined,
        deliveryAt: deliveryIso,
        deliveryTo: deliveryToIso,
        depositAmount,
        isPaid,
        confirmPaymentReceived: !isEdit && (isPaid || confirmPaymentReceived),
        paymentReceivedAt: !isEdit && (isPaid || confirmPaymentReceived) ? `${paymentReceivedAt}:00+07:00` : undefined,
        paymentMethod: !isEdit && (isPaid || confirmPaymentReceived) ? PaymentMethod.Other : undefined,
        paymentIdempotencyKey: !isEdit && (isPaid || confirmPaymentReceived) ? paymentIdempotencyKeyRef.current : undefined,
        shippingFee: pickupAtShop ? 0 : shippingFee,
        shippingFeeActual: pickupAtShop || shippingFeeActual.trim() === ''
          ? null
          : Number(shippingFeeActual),
        description: description || undefined,
        contentNote: contentNote.trim() || undefined,
        items: orderItems,
        imageFiles: imageUploads(),
        materials: flattenInventoryMaterials(inventoryMaterials, items, persistedMaterialIdsRef.current),
      };

      if (orderId) {
        await ordersApi.update(orderId, {
          ...commonPayload,
          rowVersion,
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
        eyebrow={isEdit ? 'Bán hàng / Chỉnh sửa' : 'Bán hàng / Đơn mới'}
        title={isEdit ? 'Sửa đơn hàng' : 'Tạo đơn hàng'}
        description="Thông tin rõ ràng để mỗi bó hoa được trao đúng hẹn."
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
              className="btn-press hidden min-h-10 shrink-0 items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-semibold text-admin-text-primary transition-colors hover:bg-admin-muted sm:inline-flex"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Quay lại
            </button>
            <Link
              to={orderId ? `/admin/orders/${orderId}` : '/admin/orders'}
              className="btn-press inline-flex min-h-10 shrink-0 items-center justify-center rounded-admin-control px-3 text-sm font-semibold text-admin-text-secondary transition-colors hover:bg-admin-muted hover:text-admin-text-primary"
            >
              Hủy
            </Link>
            <button
              type="submit"
              form="order-editor-form"
              disabled={saving || addressImporting || Boolean(loadError)}
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

      <form id="order-editor-form" noValidate onSubmit={(event) => void submit(event)}>
        <div className="grid min-w-0 gap-4 wide:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <div className="min-w-0 space-y-4">
            <section className={panelClass} aria-labelledby="customer-section-title">
              <div className="mb-4 border-b border-admin-border pb-3">
                <h2 id="customer-section-title" className="text-sm font-semibold text-admin-text-primary"><span aria-hidden="true">01 · </span>Thông tin người đặt</h2>
                <p className="mt-1 text-xs text-admin-text-muted">Thông tin chính để xác nhận và liên hệ về đơn hàng.</p>
              </div>
              <div className="grid gap-x-3 gap-y-3 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <label htmlFor="orderer-name" className={labelClass}>Tên người đặt <span className="text-admin-status-error" aria-hidden="true">*</span></label>
                  <input id="orderer-name" aria-label="Tên người đặt" required className={inputClass} value={ordererName} onChange={(event) => { setOrdererName(event.target.value); if (recipientIsOrderer) setRecipientName(event.target.value); }} autoComplete="name" />
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="orderer-phone" className={labelClass}>SĐT người đặt <span className="text-admin-status-error" aria-hidden="true">*</span></label>
                  <input id="orderer-phone" aria-label="SĐT người đặt" required type="tel" className={inputClass} value={ordererPhone} onChange={(event) => { setOrdererPhone(event.target.value); if (recipientIsOrderer) setRecipientPhone(event.target.value); }} autoComplete="tel" />
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="order-channel" className={labelClass}>Kênh đặt hàng <span className="text-admin-status-error" aria-hidden="true">*</span></label>
                  <select id="order-channel" required className={inputClass} value={channelId} onChange={(event) => setChannelId(event.target.value)}>
                    <option value="">Chọn kênh</option>
                    {channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-12">
                  <CustomerMemberLookup
                    name={ordererName}
                    phone={ordererPhone}
                    selected={selectedMember}
                    onSelect={(customer) => {
                      setSelectedMember(customer);
                      setOrdererName(customer.name);
                      setOrdererPhone(customer.phone);
                      if (recipientIsOrderer) {
                        setRecipientName(customer.name);
                        setRecipientPhone(customer.phone);
                      }
                    }}
                    onClear={() => setSelectedMember(null)}
                  />
                </div>
                <div className="sm:col-span-12">
                  <div className="flex items-start justify-between gap-4 rounded-admin-control border border-admin-border px-3 py-3">
                    <div className="min-w-0">
                      <label htmlFor="create-member" className="text-sm font-semibold text-admin-text-primary">Tạo Member</label>
                      <p className="mt-1 text-xs leading-5 text-admin-text-muted">
                        {selectedMember
                          ? 'Member đã chọn luôn được liên kết; tùy chọn này không tạo thêm bản ghi.'
                          : createMember
                            ? 'Tạo Member mới nếu có tên hoặc số điện thoại người đặt.'
                            : 'Chỉ lưu thông tin trên đơn, không tạo Member.'}
                      </p>
                    </div>
                    <input
                      id="create-member"
                      type="checkbox"
                      role="switch"
                      checked={createMember}
                      onChange={(event) => setCreateMember(event.target.checked)}
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-admin-input-border text-admin-primary focus:ring-admin-primary/25"
                    />
                  </div>
                </div>
                <div className="sm:col-span-12">
                  <div className="mt-1 flex flex-col gap-3 border-t border-admin-border pt-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><h3 className="text-sm font-semibold text-admin-text-primary">Thông tin người nhận</h3><p className="mt-1 text-xs text-admin-text-muted">Có thể để trống khi tạo. Đơn ship chỉ cần đủ thông tin trước khi bàn giao.</p></div>
                    <button type="button" onClick={() => { setRecipientIsOrderer(true); setRecipientName(ordererName); setRecipientPhone(ordererPhone); }} className="min-h-10 shrink-0 rounded-admin-control border border-admin-border bg-admin-card px-3 text-xs font-semibold text-admin-primary hover:bg-admin-muted">Người nhận là người đặt</button>
                  </div>
                </div>
                <div className="sm:col-span-5">
                  <label htmlFor="recipient-name" className={labelClass}>Tên người nhận <span className="font-normal text-admin-text-muted">(không bắt buộc)</span></label>
                  <input id="recipient-name" aria-label="Tên người nhận" className={inputClass} value={recipientName} onChange={(event) => { setRecipientIsOrderer(false); setRecipientName(event.target.value); }} autoComplete="shipping name" />
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="recipient-phone" className={labelClass}>SĐT người nhận <span className="font-normal text-admin-text-muted">(không bắt buộc)</span></label>
                  <input id="recipient-phone" aria-label="SĐT người nhận" type="tel" className={inputClass} value={recipientPhone} onChange={(event) => { setRecipientIsOrderer(false); setRecipientPhone(event.target.value); }} autoComplete="shipping tel" />
                </div>
                <div className="flex items-end sm:col-span-3">
                  <p className="pb-3 text-xs text-admin-text-muted" aria-live="polite">{recipientIsOrderer ? 'Đã sao chép từ người đặt. Bạn vẫn có thể sửa riêng.' : 'Không tự động sao chép.'}</p>
                </div>
              </div>
            </section>

            <OrderProductLinesEditor
              items={items}
              products={products}
              categories={categories}
              productTypes={productTypes}
              lineErrors={lineErrors}
              expandedLineKeys={expandedLineKeys}
              inventoryMaterialLineKeys={new Set(inventoryMaterials.map((material) => material.lineKey))}
              disabled={saving}
              onAddCatalogProduct={addCatalogProduct}
              onAddManualProduct={addManualProduct}
              onSelectProduct={selectProduct}
              onUpdateLine={updateLine}
              onRemoveLine={removeLine}
              onToggleExpanded={(lineKey) => setExpandedLineKeys((current) => {
                const next = new Set(current);
                if (next.has(lineKey)) next.delete(lineKey);
                else next.add(lineKey);
                return next;
              })}
            />
            <section id="order-inventory-materials" className={panelClass} aria-labelledby="order-materials-title" tabIndex={-1}>
              <div className="border-b border-admin-border pb-3">
                <h2 id="order-materials-title" className="flex items-center gap-2 text-sm font-semibold text-admin-text-primary">
                  <span aria-hidden="true">03 · </span><PackageOpen size={17} aria-hidden="true" /> Nguyên liệu &amp; vật tư
                </h2>
                <p className="mt-1 max-w-[70ch] text-xs leading-5 text-admin-text-secondary">
                  Quản lý thành phần sử dụng cho từng sản phẩm trong đơn. Vật tư kho sẽ ảnh hưởng tồn kho, nguyên liệu thì không.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-admin-text-secondary" aria-label="Chú thích loại thành phần">
                  <span className="inline-flex items-center gap-1.5"><Leaf size={14} className="text-admin-accent" aria-hidden="true" /><span>Nguyên liệu</span></span>
                  <span className="inline-flex items-center gap-1.5"><PackageOpen size={14} className="text-admin-status-success" aria-hidden="true" /><span>Vật tư kho</span></span>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-admin-control border border-admin-border">
                {items.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-admin-text-muted">Chưa có sản phẩm trong đơn.</div>
                ) : items.map((item, index) => {
                  const lineInventoryMaterials = inventoryMaterials.filter((material) => material.lineKey === item.key);
                  return (
                    <OrderLineIngredientsEditor
                      key={item.key}
                      lineIndex={index}
                      productName={item.productName || 'Sản phẩm chưa chọn'}
                      productQuantity={item.quantity}
                      ingredients={item.ingredientDrafts}
                      ingredientCatalog={ingredientCatalog}
                      inventoryMaterials={lineInventoryMaterials}
                      inventoryCatalog={inventoryCatalog}
                      orderRequiredQuantityByStockUnit={orderRequiredQuantityByStockUnit}
                      disabled={saving}
                      canApplyDefaults={Boolean(item.productId && products.some((product) => String(product.id) === item.productId))}
                      onIngredientsChange={(ingredientDrafts) => updateLine(index, {
                        ingredientDrafts,
                        ingredientOrigin: ingredientDrafts.length > 0 ? 'custom' : 'empty',
                      })}
                      onInventoryMaterialsChange={(next) => {
                        setInventoryMaterials((current) => [
                          ...current.filter((material) => material.lineKey !== item.key),
                          ...next.map((material) => ({ ...material, lineKey: item.key })),
                        ]);
                        setMaterialsError(null);
                      }}
                      onApplyDefaults={() => applyProductMaterialDefaults(index)}
                    />
                  );
                })}
              </div>
              {materialsError ? <p className="mt-3 text-xs font-medium text-admin-status-error" role="alert">{materialsError}</p> : null}
            </section>

            <section className={panelClass} aria-labelledby="order-note-section-title">
              <h2 id="order-note-section-title" className="mb-3 text-sm font-semibold text-admin-text-primary"><span aria-hidden="true">04 · </span>Ghi chú đơn hàng</h2>
              <label htmlFor="order-content-note" className={labelClass}>Nội dung ghi chú <span className="font-normal text-admin-text-muted">(không bắt buộc)</span></label>
              <textarea id="order-content-note" className={`${inputClass} min-h-20 resize-y`} value={contentNote} onChange={(event) => setContentNote(event.target.value)} placeholder="Nội dung cần lưu ý (không bắt buộc)" />
            </section>
          </div>

          <aside className="min-w-0" aria-label="Chi phí và giao nhận">
            <div className="space-y-4">
              <section className={panelClass} aria-labelledby="cost-section-title">
                <div className="mb-4 border-b border-admin-border pb-3">
                  <h2 id="cost-section-title" className="text-sm font-semibold text-admin-text-primary">Tóm tắt & chi phí</h2>
                  <p className="mt-1 text-xs leading-5 text-admin-text-muted">Kiểm tra các khoản thanh toán trước khi hoàn tất đơn.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 wide:grid-cols-1">
                  <div className="flex min-h-11 items-center justify-between gap-3 rounded-admin-control border border-admin-border bg-admin-muted/55 px-3 sm:col-span-2 wide:col-span-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-admin-text-primary">
                      <input
                        type="checkbox"
                        checked={isPaid}
                        onChange={(event) => { setIsPaid(event.target.checked); if (event.target.checked) setConfirmPaymentReceived(true); }}
                        className="h-4 w-4 accent-admin-primary"
                      />
                      Đã thanh toán
                    </label>
                    <span data-testid="payment-status-preview" className={isPaid ? 'text-xs font-semibold text-admin-status-success' : 'text-xs text-admin-text-muted'} aria-live="polite">
                      {isPaid ? 'Đã thanh toán' : `Chưa thanh toán đủ · Còn ${formatVndInput(Math.max(0, orderValue - depositAmount))}đ`}
                    </span>
                  </div>
                  {!isPaid ? (
                    <div data-testid="deposit-fields">
                      <label htmlFor="deposit-amount" className={labelClass}>Tiền cọc</label>
                      <div className="relative">
                        <input id="deposit-amount" type="text" inputMode="numeric" className={`${inputClass} pr-8 text-right tabular-nums`} value={formatVndInput(depositAmount)} onChange={(event) => { setDepositAmount(parseVndInput(event.target.value)); setDepositWasManuallyEdited(true); }} />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-admin-text-muted">₫</span>
                      </div>
                      <button type="button" onClick={() => { setDepositAmount(calculateDefaultDeposit(orderValue)); setDepositWasManuallyEdited(false); }} className="mt-1 text-xs font-semibold text-admin-primary hover:underline">Áp dụng cọc mặc định</button>
                    </div>
                  ) : (
                    <p className="rounded-admin-control bg-admin-primary/6 px-3 py-2 text-xs leading-5 text-admin-text-secondary sm:col-span-2 wide:col-span-1" data-testid="paid-deposit-note">
                      Đơn hàng đã thanh toán, không cần nhập tiền cọc.
                    </p>
                  )}
                  {!isEdit ? <div className="space-y-3 rounded-admin-control border border-admin-border bg-admin-surface p-3 sm:col-span-2 wide:col-span-1">
                    {!isPaid ? <label className="flex min-h-9 items-center gap-2 text-xs font-semibold text-admin-text-primary"><input type="checkbox" checked={confirmPaymentReceived} onChange={event => setConfirmPaymentReceived(event.target.checked)} className="h-4 w-4 rounded border-admin-input-border text-admin-primary" />Đã thực nhận khoản cọc này</label> : null}
                    {isPaid || confirmPaymentReceived ? <label className="block text-xs font-medium text-admin-text-secondary">Thời điểm thực nhận<input id="payment-received-at" type="datetime-local" value={paymentReceivedAt} onChange={event => setPaymentReceivedAt(event.target.value)} className={`${inputClass} mt-1.5`} /></label> : <p className="text-xs leading-5 text-admin-text-muted">Số tiền cọc là thỏa thuận của đơn; chỉ xuất hiện trong dòng tiền sau khi xác nhận đã nhận.</p>}
                  </div> : null}
                  <div>
                    <label htmlFor="shipping-fee" className={labelClass}>Phí giao dự kiến</label>
                    <div className="relative">
                      <input id="shipping-fee" type="text" inputMode="numeric" className={`${inputClass} pr-8 text-right tabular-nums`} disabled={pickupAtShop} value={formatVndInput(shippingFee)} onChange={(event) => setShippingFee(parseVndInput(event.target.value))} />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-admin-text-muted">₫</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="shipping-fee-actual" className={labelClass}>Phí giao thực tế</label>
                    <div className="relative">
                      <input id="shipping-fee-actual" type="text" inputMode="numeric" className={`${inputClass} pr-8 text-right tabular-nums`} disabled={pickupAtShop} value={formatVndInput(shippingFeeActual)} onChange={(event) => setShippingFeeActual(event.target.value.replace(/\D/g, ''))} placeholder="Chưa có" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-admin-text-muted">₫</span>
                    </div>
                  </div>
                </div>
              </section>

            <section className={panelClass} aria-labelledby="delivery-section-title">
              <h2 id="delivery-section-title" className="text-sm font-semibold text-admin-text-primary">Giao nhận</h2>

              <fieldset className="mt-4">
                <legend className="mb-2 block text-xs font-semibold text-admin-text-secondary">Phương thức giao nhận</legend>
                <div className="grid grid-cols-3 gap-1 rounded-admin-control border border-admin-border bg-admin-muted p-1" role="radiogroup" aria-label="Hình thức giao nhận">
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
              </fieldset>

              <fieldset className="mt-4 border-t border-admin-border pt-4">
                <legend className="sr-only">{provinceShipping ? 'Thời gian gửi đơn vị vận chuyển' : 'Thời gian nhận'}</legend>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-admin-text-secondary">{provinceShipping ? 'Thời gian gửi đơn vị vận chuyển' : 'Thời gian nhận'}</h3>
                  <div className="inline-flex rounded-admin-control border border-admin-border bg-admin-muted p-0.5" aria-label={provinceShipping ? 'Kiểu thời gian gửi đơn vị vận chuyển' : 'Kiểu thời gian nhận'}>
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
                </div>
                <div className={`grid gap-2.5 ${deliveryMode === 'range' ? 'sm:grid-cols-2' : ''}`}>
                  <div>
                    <label htmlFor="delivery-at" className="sr-only">{deliveryMode === 'range' ? (provinceShipping ? 'Gửi từ' : 'Nhận từ') : (provinceShipping ? 'Thời gian gửi đơn vị vận chuyển' : 'Thời gian nhận')}</label>
                    {deliveryMode === 'range' ? <p className="mb-1 text-xs text-admin-text-muted">Từ</p> : null}
                    <input id="delivery-at" type="datetime-local" className={inputClass} value={deliveryAt} onChange={(event) => setDeliveryAt(event.target.value)} />
                  </div>
                  {deliveryMode === 'range' ? (
                    <div>
                      <label htmlFor="delivery-to" className="mb-1 block text-xs text-admin-text-muted">Đến</label>
                      <input id="delivery-to" type="datetime-local" min={deliveryAt || undefined} className={inputClass} value={deliveryTo} onChange={(event) => setDeliveryTo(event.target.value)} />
                    </div>
                  ) : null}
                </div>
              </fieldset>

              <div className="mt-4 border-t border-admin-border pt-4">
                <h3 className="text-xs font-semibold text-admin-text-secondary">Thông tin địa chỉ</h3>
                <div className="mt-3">
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
                      <p className="mt-1 text-xs leading-4 text-admin-text-muted">Dùng khi địa chỉ thực tế không có hoặc chưa chính xác trên bản đồ.</p>
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
                        <span className="text-xs text-admin-status-success">Đã ghim vị trí</span>
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
                  <div className="space-y-3">
                    <AddressAutoImport
                      disabled={saving}
                      onResolved={applyResolvedAddress}
                      onBusyChange={setAddressImporting}
                    />
                    <AdministrativeAddressFields
                      value={administrativeAddress}
                      onChange={(next) => {
                        setAdministrativeAddress(next);
                        setDeliveryAddress(next.detail);
                        setFullAddressSnapshot('');
                        setDeliveryLatitude(null);
                        setDeliveryLongitude(null);
                      }}
                    />
                  </div>
                )
              ) : (
                <p className="rounded-admin-control bg-admin-muted px-3 py-2.5 text-xs leading-5 text-admin-text-secondary">Không cần địa chỉ và phí giao hàng.</p>
              )}
                </div>
              </div>
            </section>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-3 z-20 mt-5 rounded-admin-panel border border-admin-border bg-admin-card/95 p-2 shadow-admin-panel backdrop-blur md:hidden">
          <button
            type="submit"
            disabled={saving || addressImporting || Boolean(loadError)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground transition-colors hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-55"
          >
            {saving ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : null}
            {saving ? 'Đang lưu đơn' : isEdit ? 'Cập nhật đơn' : 'Tạo đơn'}
          </button>
        </div>

      </form>

      {quickImportOpen ? (
        <QuickOrderBatchImportDialog
          channelId={channelId}
          channels={channels}
          products={products}
          initialRecipientName={recipientName}
          initialRecipientPhone={recipientPhone}
          initialOrdererName={ordererName}
          initialOrdererPhone={ordererPhone}
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
