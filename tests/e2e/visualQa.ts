import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

const representativeViewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
  { name: '360', width: 360, height: 800 },
] as const;

export const captureResponsivePage = async (page: Page, name: string) => {
  const targetDirectory = process.env.LAMIE_VISUAL_QA_DIR;
  if (!targetDirectory) return;

  const originalViewport = page.viewportSize();
  const resolvedDirectory = path.resolve(targetDirectory);
  mkdirSync(resolvedDirectory, { recursive: true });

  for (const viewport of representativeViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(120);
    await page.screenshot({
      path: path.join(resolvedDirectory, `${name}-${viewport.name}.png`),
      fullPage: false,
    });
  }

  if (originalViewport) await page.setViewportSize(originalViewport);
};
