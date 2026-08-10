import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'settings-channels',
  displayName: 'Kênh bán',
  version: '1.0.0',
  permissions: [
    { code: Permission.ChannelsView, name: 'Xem kênh bán', group: 'Cấu hình' },
    { code: Permission.ChannelsManage, name: 'Quản lý kênh bán', group: 'Cấu hình' },
  ],
  pages: [
    {
      pageKey: 'settings.channels',
      defaultPath: '/admin/settings/channels',
      requiredPermission: Permission.ChannelsView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/settings/channels/pages/ChannelsPage'),
        'ChannelsPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'settings.channels',
      parentKey: 'group.management',
      moduleKey: 'settings-channels',
      pageKey: 'settings.channels',
      label: 'Kênh bán',
      defaultPath: '/admin/settings/channels',
      iconKey: 'radio',
      permissionCode: Permission.ChannelsView,
      sortOrder: 20,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
