import type { Language, Tag } from '@/features/masterdata/types/masterdata.types';

export const mockLanguages: Language[] = [
  {
    code: 'en',
    name: 'English',
    isActive: true,
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    isActive: true,
  },
];

export const mockTags: Tag[] = [
  {
    id: 6,
    isActive: false,
    translations: [
      {
        languageCode: 'en',
        name: 'English',
        description: 'description English',
      },
      {
        languageCode: 'vi',
        name: 'Đổi lại Viet',
        description: 'string',
      },
      {
        languageCode: 'cn',
        name: 'Chinesne',
        description: '',
      },
    ],
  },
  {
    id: 7,
    isActive: true,
    translations: [
      {
        languageCode: 'vi',
        name: 'aaaaaaaaa',
        description: 'string',
      },
      {
        languageCode: 'en',
        name: 'bbbbbbbbb',
        description: 'bb',
      },
    ],
  },
  {
    id: 8,
    isActive: false,
    translations: [
      {
        languageCode: 've',
        name: '111',
        description: '22',
      },
    ],
  },
];

