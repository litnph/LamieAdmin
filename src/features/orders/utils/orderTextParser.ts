import { formatVndCurrency } from '@/shared/utils/displayFormatters';

export type ParsedOrderText = {
  recipientName?: string;
  ordererName?: string;
  deliveryDate?: string;
  deliveryStartTime?: string;
  deliveryEndTime?: string;
  productHint?: string;
  price?: number;
  shippingFee?: number;
  deposit?: number;
  phone?: string;
  address?: string;
  cardMessage?: string;
  bannerMessage?: string;
  warnings: string[];
};

const money = (value: string) => {
  const number = Number(value.replace(/[.,]/g, ''));
  if (!Number.isFinite(number)) return undefined;
  return number < 10_000 ? number * 1_000 : number;
};

const time = (hour: string, minute?: string) => {
  const h = Number(hour);
  const m = Number(minute ?? 0);
  return h <= 23 && m <= 59 ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : undefined;
};

export const parseOrderText = (input: string, currentYear = new Date().getFullYear()): ParsedOrderText => {
  const result: ParsedOrderText = { warnings: [] };
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const consumed = new Set<number>();

  lines.forEach((line, index) => {
    const recipientName = line.match(/^(?:người\s*nhận|nguoi\s*nhan)\s*[:\-]\s*(.+)$/i);
    const ordererName = line.match(/^(?:người\s*đặt|nguoi\s*dat|người\s*đặt\s*hàng|nguoi\s*dat\s*hang)\s*[:\-]\s*(.+)$/i);
    if (recipientName?.[1]) {
      result.recipientName = recipientName[1].trim();
      consumed.add(index);
    }
    if (ordererName?.[1]) {
      result.ordererName = ordererName[1].trim();
      consumed.add(index);
    }

    const dateMatch = line.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);
    if (dateMatch) {
      const day = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const year = Number(dateMatch[3] ?? currentYear);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        result.deliveryDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!dateMatch[3]) result.warnings.push(`Không nhận diện được năm, đang dùng ${currentYear}.`);
      }
      const timeMatch = line.match(/\b(\d{1,2})(?:h|:)(\d{2})?(?:\s*-\s*(\d{1,2})(?:h|:)(\d{2})?)?/i);
      if (timeMatch) {
        result.deliveryStartTime = time(timeMatch[1], timeMatch[2]);
        result.deliveryEndTime = timeMatch[3] ? time(timeMatch[3], timeMatch[4]) : undefined;
      }
      consumed.add(index);
    }

    const phone = line.replace(/[\s.-]/g, '').match(/(?:\+84|0)(?:3|5|7|8|9)\d{8}\b/);
    if (phone) {
      result.phone = phone[0].replace(/^\+84/, '0');
      if (line.replace(phone[0], '').trim().length === 0) consumed.add(index);
    }

    const card = line.match(/^(?:ghi\s+thiệp|nội\s+dung\s+thiệp|thiệp(?:\s+là)?)[\s:]*(.+)$/i);
    const banner = line.match(/^(?:in\s+banner|nội\s+dung\s+banner|banner(?:\s+là)?)[\s:]*(.+)$/i);
    if (card?.[1]) { result.cardMessage = card[1].trim(); consumed.add(index); }
    if (banner?.[1]) { result.bannerMessage = banner[1].trim(); consumed.add(index); }

    const shipping = line.match(/(?:\bship\s*(\d+(?:[.,]\d+)?)[kK]?\b|\b(\d+(?:[.,]\d+)?)[kK]?\s*ship\b)/i);
    const deposit = line.match(/(?:\bcọc\s*(\d+(?:[.,]\d+)?)[kK]?\b|\b(\d+(?:[.,]\d+)?)[kK]?\s*cọc\b)/i);
    if (shipping) result.shippingFee = money(shipping[1] ?? shipping[2]);
    if (deposit) result.deposit = money(deposit[1] ?? deposit[2]);
    if (shipping || deposit) {
      const stripped = line
        .replace(shipping?.[0] ?? '', ' ')
        .replace(deposit?.[0] ?? '', ' ')
        .replace(/[,;]/g, ' ')
        .replace(/\s+/g, ' ').trim();
      const product = stripped.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)[kK]?\b/);
      if (product) {
        result.productHint = product[1].trim();
        result.price = money(product[2]);
      }
      consumed.add(index);
    }
  });

  const addressLines = lines.filter((line, index) => !consumed.has(index) && /\p{L}/u.test(line));
  if (addressLines.length) result.address = addressLines.join(', ');
  if (!result.productHint) result.warnings.push('Không xác định được sản phẩm cụ thể.');
  else if (result.price != null) result.warnings.push(`Tìm thấy giá ${formatVndCurrency(result.price)} nhưng chưa chọn sản phẩm.`);
  if (!result.ordererName) result.warnings.push('Không tìm thấy thông tin người đặt.');
  return result;
};
