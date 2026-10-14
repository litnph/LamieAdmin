export const ADMIN_THEME_STORAGE_KEY = 'lamie-theme-v3';
export const ADMIN_MOTION_STORAGE_KEY = 'lamie-motion-v3';
export const LEGACY_ADMIN_PRIMARY_STORAGE_KEY = 'lamie-admin-primary-hex';

export const ADMIN_THEME_IDS = [
  'violet',
  'grove',
  'glass',
  'mint',
  'cobalt',
  'noir',
] as const;

export type AdminThemeId = (typeof ADMIN_THEME_IDS)[number];

export type AdminTheme = {
  id: AdminThemeId;
  number: string;
  name: string;
  vietnameseName: string;
  description: string;
  mood: string;
  pair: readonly [string, string];
  preview: {
    background: string;
    sidebar: string;
    surface: string;
    accent: string;
    soft: string;
    text: string;
    selected: string;
    sidebarText: string;
    radius: string;
  };
};

export const ADMIN_THEMES: readonly AdminTheme[] = [
  {
    id: 'violet',
    number: '01',
    name: 'Violet Mist',
    vietnameseName: 'Sương tím',
    description: 'Tím trầm, nền xám sương và bề mặt mềm.',
    mood: 'Thanh lịch · Mềm mại',
    pair: ['#3D007A', '#E8ECF1'],
    preview: {
      background: '#E8ECF1', sidebar: '#3D007A', surface: '#FFFFFF', accent: '#3D007A',
      soft: '#EDE6F5', text: '#271B38', selected: '#F0E6FF', sidebarText: '#EEE6FC', radius: '18px',
    },
  },
  {
    id: 'grove',
    number: '02',
    name: 'Lime Grove',
    vietnameseName: 'Vườn nắng',
    description: 'Lime ấm, olive sâu và bề mặt màu giấy.',
    mood: 'Tươi sáng · Tự nhiên',
    pair: ['#CFFF74', '#2F3A1D'],
    preview: {
      background: '#F4F7E9', sidebar: '#2F3A1D', surface: '#FCFDF7', accent: '#CFFF74',
      soft: '#E9F4CB', text: '#2F3A1D', selected: '#CFFF74', sidebarText: '#F0F5E3', radius: '18px',
    },
  },
  {
    id: 'glass',
    number: '03',
    name: 'Violet Glass',
    vietnameseName: 'Tím trong veo',
    description: 'Tím sáng, xanh băng và lớp nền trong nhẹ.',
    mood: 'Hiện đại · Nhẹ nhàng',
    pair: ['#5F2CFF', '#DFF6FF'],
    preview: {
      background: '#DFF6FF', sidebar: '#EDF6FF', surface: '#F7FCFF', accent: '#5F2CFF',
      soft: '#EBE6FF', text: '#241642', selected: '#5F2CFF', sidebarText: '#30214E', radius: '20px',
    },
  },
  {
    id: 'mint',
    number: '04',
    name: 'Mint Calm',
    vietnameseName: 'Bạc hà tĩnh',
    description: 'Teal sâu, bạc hà nhạt và khoảng thở rõ.',
    mood: 'Điềm tĩnh · Tập trung',
    pair: ['#042F32', '#D6FFCB'],
    preview: {
      background: '#F0F7ED', sidebar: '#042F32', surface: '#FDFFFA', accent: '#042F32',
      soft: '#E1F3DA', text: '#143234', selected: '#D6FFCB', sidebarText: '#E7F7E3', radius: '14px',
    },
  },
  {
    id: 'cobalt',
    number: '05',
    name: 'Cobalt Sand',
    vietnameseName: 'Xanh & cát',
    description: 'Cobalt rõ nét, nền cát ấm và đường nét gọn.',
    mood: 'Rõ ràng · Nổi bật',
    pair: ['#0038FF', '#FFD8B8'],
    preview: {
      background: '#FFF0E2', sidebar: '#0038FF', surface: '#FFFBF6', accent: '#0038FF',
      soft: '#FFE2C9', text: '#222E4C', selected: '#FFD8B8', sidebarText: '#FFFFFF', radius: '8px',
    },
  },
  {
    id: 'noir',
    number: '06',
    name: 'Lime Noir',
    vietnameseName: 'Lime đêm',
    description: 'Nền tối nhiều lớp, lime sáng ở điểm cần chú ý.',
    mood: 'Tương phản · Tối giản',
    pair: ['#C8FF00', '#06110D'],
    preview: {
      background: '#0B1710', sidebar: '#06110D', surface: '#15231B', accent: '#C8FF00',
      soft: '#243522', text: '#EAF1E8', selected: '#C8FF00', sidebarText: '#E7F3DC', radius: '12px',
    },
  },
] as const;

export const DEFAULT_ADMIN_THEME_ID: AdminThemeId = 'mint';

export const isAdminThemeId = (value: unknown): value is AdminThemeId =>
  typeof value === 'string' && (ADMIN_THEME_IDS as readonly string[]).includes(value);

export const getAdminTheme = (id: AdminThemeId): AdminTheme =>
  ADMIN_THEMES.find((theme) => theme.id === id) ?? ADMIN_THEMES[3];

export const readStoredAdminThemeId = (): AdminThemeId => {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_THEME_ID;
  try {
    const stored = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    return isAdminThemeId(stored) ? stored : DEFAULT_ADMIN_THEME_ID;
  } catch {
    return DEFAULT_ADMIN_THEME_ID;
  }
};

export const readStoredMotionPreference = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(ADMIN_MOTION_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
};

export const applyThemeToDocument = (themeId: AdminThemeId, motionEnabled?: boolean): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = themeId;
  if (motionEnabled !== undefined) {
    document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off';
  }
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const theme = getAdminTheme(themeId);
  themeColor?.setAttribute('content', theme.preview.background);
};

export const initAdminTheme = (): void => {
  applyThemeToDocument(readStoredAdminThemeId(), readStoredMotionPreference());
};

