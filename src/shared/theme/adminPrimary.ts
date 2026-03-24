export const ADMIN_PRIMARY_STORAGE_KEY = 'lamie-admin-primary-hex';

/** Danh sách màu primary (chuẩn hóa #RRGGBB). */
export const ADMIN_PRIMARY_PALETTE = [
  '#6B7B8B',
  '#9B7B85',
  '#B8806A',
  '#7E6B8A',
  '#7D8A72',
  '#172554',
  '#1E3A8A',
  '#1E293B',
  '#0F172A',
  '#166534',
  '#065F46',
  '#3F6212',
  '#C2410C',
  '#9A3412',
  '#9F1239',
  '#831843',
  '#78350F',
  '#451A03',
  '#5B21B6',
  '#4C1D95',
  '#EA580C',
] as const;

const DEFAULT_PRIMARY: (typeof ADMIN_PRIMARY_PALETTE)[number] = ADMIN_PRIMARY_PALETTE[0];

export const ADMIN_PRIMARY_CHANGE_EVENT = 'lamie-admin-primary-change';

function normalizeHex(input: string): string | null {
  const s = input.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(s) ? s : null;
}

function hexToTuple(hex: string): [number, number, number] {
  const h = hex.slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function tupleToSpace(t: [number, number, number]) {
  return `${clamp255(t[0])} ${clamp255(t[1])} ${clamp255(t[2])}`;
}

function rgbToHex(t: [number, number, number]): string {
  return (
    '#' +
    [t[0], t[1], t[2]]
      .map((n) => clamp255(n).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function mixRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function relLum(rgb: [number, number, number]): number {
  const lin = rgb.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function hoverFromPrimary(rgb: [number, number, number]): [number, number, number] {
  const L = relLum(rgb);
  if (L < 0.2) return mixRgb(rgb, [255, 255, 255], 0.12);
  return mixRgb(rgb, [0, 0, 0], 0.14);
}

function lightFromPrimary(rgb: [number, number, number]): [number, number, number] {
  return mixRgb(rgb, [255, 255, 255], 0.9);
}

export function applyAdminPrimaryHex(hex: string): void {
  const root = document.documentElement;
  const rgb = hexToTuple(hex);
  const hover = hoverFromPrimary(rgb);
  const light = lightFromPrimary(rgb);
  const dark = relLum(rgb) < 0.12 ? 0.06 : 0.18;
  const darker = relLum(rgb) < 0.12 ? 0.12 : 0.3;
  const via = mixRgb(rgb, [0, 0, 0], dark);
  const to = mixRgb(rgb, [0, 0, 0], darker);

  root.style.setProperty('--admin-primary-rgb', tupleToSpace(rgb));
  root.style.setProperty('--admin-primary-hover-rgb', tupleToSpace(hover));
  root.style.setProperty('--admin-primary-light-rgb', tupleToSpace(light));
  root.style.setProperty('--admin-primary-hex', hex);
  root.style.setProperty('--admin-gradient-from', hex);
  root.style.setProperty('--admin-gradient-via', rgbToHex(via));
  root.style.setProperty('--admin-gradient-to', rgbToHex(to));
}

export function isPaletteHex(hex: string): boolean {
  const n = normalizeHex(hex);
  if (!n) return false;
  return (ADMIN_PRIMARY_PALETTE as readonly string[]).includes(n);
}

export function getStoredAdminPrimaryHex(): string {
  try {
    const raw = localStorage.getItem(ADMIN_PRIMARY_STORAGE_KEY);
    const n = raw ? normalizeHex(raw) : null;
    if (n && isPaletteHex(n)) return n;
  } catch {
    /* ignore */
  }
  return DEFAULT_PRIMARY;
}

export function setStoredAdminPrimaryHex(hex: string): void {
  localStorage.setItem(ADMIN_PRIMARY_STORAGE_KEY, hex);
}

export function initAdminPrimaryTheme(): void {
  applyAdminPrimaryHex(getStoredAdminPrimaryHex());
}

export function selectAdminPrimaryHex(hex: string): void {
  const n = normalizeHex(hex);
  if (!n || !isPaletteHex(n)) return;
  setStoredAdminPrimaryHex(n);
  applyAdminPrimaryHex(n);
  window.dispatchEvent(new CustomEvent(ADMIN_PRIMARY_CHANGE_EVENT, { detail: { hex: n } }));
}
