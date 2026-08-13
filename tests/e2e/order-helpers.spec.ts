import { expect, test } from '@playwright/test';
import { calculateDefaultDeposit } from '../../src/features/orders/utils/deposit';
import { parseOrderText } from '../../src/features/orders/utils/orderTextParser';

test('calculates every default deposit tier and rounding boundary', () => {
  expect(calculateDefaultDeposit(100_000)).toBe(100_000);
  expect(calculateDefaultDeposit(400_000)).toBe(100_000);
  expect(calculateDefaultDeposit(400_001)).toBe(200_000);
  expect(calculateDefaultDeposit(550_000)).toBe(200_000);
  expect(calculateDefaultDeposit(700_000)).toBe(200_000);
  expect(calculateDefaultDeposit(700_001)).toBe(300_000);
  expect(calculateDefaultDeposit(1_000_000)).toBe(300_000);
  expect(calculateDefaultDeposit(1_000_001)).toBe(300_000);
  expect(calculateDefaultDeposit(1_200_000)).toBe(400_000);
  expect(calculateDefaultDeposit(1_500_000)).toBe(500_000);
  expect(calculateDefaultDeposit(1_700_000)).toBe(600_000);
  expect(calculateDefaultDeposit(2_050_000)).toBe(700_000);
});

test('parses the complete chat example without confusing address numbers', () => {
  const result = parseOrderText('11/08 17h15-17h30\nBó 550, 50 ship cọc 200\n0352752593\n461 Phan Văn Trị, Phường An Nhơn', 2026);
  expect(result).toMatchObject({
    deliveryDate: '2026-08-11', deliveryStartTime: '17:15', deliveryEndTime: '17:30',
    productHint: 'Bó', price: 550_000, shippingFee: 50_000, deposit: 200_000,
    phone: '0352752593', address: '461 Phan Văn Trị, Phường An Nhơn',
  });
});

test('supports alternate and single time syntax, card, banner and malformed input', () => {
  expect(parseOrderText('11/08 17:15-17:30', 2026)).toMatchObject({ deliveryStartTime: '17:15', deliveryEndTime: '17:30' });
  expect(parseOrderText('11/08 9h-10h', 2026)).toMatchObject({ deliveryStartTime: '09:00', deliveryEndTime: '10:00' });
  expect(parseOrderText('11/08 09:00', 2026)).toMatchObject({ deliveryStartTime: '09:00' });
  expect(parseOrderText('thiệp: Chúc mừng\nbanner là Happy birthday')).toMatchObject({ cardMessage: 'Chúc mừng', bannerMessage: 'Happy birthday' });
  expect(() => parseOrderText('%%% không rõ 123')).not.toThrow();
});

test('parses labeled recipient and orderer names without treating them as address text', () => {
  const result = parseOrderText('Người nhận: Lan Anh\nNgười đặt hàng: Minh Vy\n11/08 17h15\n0352752593\n461 Phan Văn Trị', 2026);

  expect(result.recipientName).toBe('Lan Anh');
  expect(result.ordererName).toBe('Minh Vy');
  expect(result.address).toBe('461 Phan Văn Trị');
  expect(result.warnings).not.toContain('Không tìm thấy thông tin người đặt.');
});

test('keeps digits inside a product name or SKU hint', () => {
  expect(parseOrderText('AB12 Premium 550, 50 ship cọc 200')).toMatchObject({
    productHint: 'AB12 Premium',
    price: 550_000,
  });
});
