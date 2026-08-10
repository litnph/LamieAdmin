import type { ComponentType } from 'react';
import type { AdminModuleManifest } from './types';

export const defineAdminModuleManifest = <TManifest extends AdminModuleManifest>(
  manifest: TManifest,
): TManifest => manifest;

export const lazyNamedComponent = <
  TModule extends Record<string, unknown>,
  TExport extends keyof TModule,
>(
  loader: () => Promise<TModule>,
  exportName: TExport,
): (() => Promise<{ default: ComponentType }>) => async () => {
  const loaded = await loader();
  const component = loaded[exportName];
  if (!component) {
    throw new Error(`Source page export is unavailable: ${String(exportName)}`);
  }
  return { default: component as ComponentType };
};
