import {
  Boxes,
  CalendarDays,
  ChartNoAxesCombined,
  Circle,
  CircleHelp,
  ContactRound,
  Flower2,
  Folder,
  History,
  KeyRound,
  LayoutDashboard,
  ListTree,
  ListChecks,
  PackageOpen,
  PackagePlus,
  Radio,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  type LucideIcon,
} from 'lucide-react';

const icons = {
  boxes: Boxes,
  'calendar-days': CalendarDays,
  'chart-no-axes-combined': ChartNoAxesCombined,
  circle: Circle,
  'circle-help': CircleHelp,
  'contact-round': ContactRound,
  'flower-2': Flower2,
  history: History,
  folder: Folder,
  'key-round': KeyRound,
  'layout-dashboard': LayoutDashboard,
  'list-tree': ListTree,
  'list-checks': ListChecks,
  'package-open': PackageOpen,
  'package-plus': PackagePlus,
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
