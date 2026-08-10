import {
  CalendarDays,
  ChartNoAxesCombined,
  Circle,
  CircleHelp,
  ContactRound,
  Flower2,
  Folder,
  KeyRound,
  LayoutDashboard,
  ListTree,
  Radio,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  type LucideIcon,
} from 'lucide-react';

const icons = {
  'calendar-days': CalendarDays,
  'chart-no-axes-combined': ChartNoAxesCombined,
  circle: Circle,
  'circle-help': CircleHelp,
  'contact-round': ContactRound,
  'flower-2': Flower2,
  folder: Folder,
  'key-round': KeyRound,
  'layout-dashboard': LayoutDashboard,
  'list-tree': ListTree,
  radio: Radio,
  'receipt-text': ReceiptText,
  settings: Settings,
  'shield-check': ShieldCheck,
  'shopping-bag': ShoppingBag,
  users: Users,
} satisfies Record<string, LucideIcon>;

export type AdminIconKey = keyof typeof icons;

export const hasIconDefinition = (iconKey: string): iconKey is AdminIconKey =>
  Object.prototype.hasOwnProperty.call(icons, iconKey);

export const getIconDefinition = (iconKey?: string | null): LucideIcon =>
  iconKey && hasIconDefinition(iconKey) ? icons[iconKey] : CircleHelp;

export const getAllIconKeys = (): readonly AdminIconKey[] =>
  Object.keys(icons).sort() as AdminIconKey[];
