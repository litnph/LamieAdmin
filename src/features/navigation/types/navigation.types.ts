export type CurrentNavigationItem = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  path?: string | null;
  iconKey?: string | null;
  permissionCode?: string | null;
  sortOrder: number;
  openInNewTab: boolean;
  children: CurrentNavigationItem[];
};

export type CurrentNavigationRoute = {
  id: string;
  key: string;
  moduleKey: string;
  pageKey: string;
  path: string;
  permissionCode?: string | null;
  sortOrder: number;
};
