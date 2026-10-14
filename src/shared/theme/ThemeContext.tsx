import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ADMIN_MOTION_STORAGE_KEY,
  ADMIN_THEME_STORAGE_KEY,
  applyThemeToDocument,
  getAdminTheme,
  readStoredAdminThemeId,
  readStoredMotionPreference,
  type AdminThemeId,
} from '@/shared/theme/adminTheme';

type ThemeFeedback = {
  id: number;
  message: string;
  tone: 'success' | 'warning' | 'info';
};

type ThemeContextValue = {
  appliedThemeId: AdminThemeId;
  previewThemeId: AdminThemeId;
  activeThemeId: AdminThemeId;
  activeThemeName: string;
  hasUnappliedPreview: boolean;
  motionEnabled: boolean;
  prefersReducedMotion: boolean;
  sidebarMotionEnabled: boolean;
  feedback: ThemeFeedback | null;
  previewTheme: (themeId: AdminThemeId) => void;
  applyPreview: () => boolean;
  cancelPreview: () => void;
  setMotionEnabled: (enabled: boolean) => boolean;
  clearFeedback: () => void;
  announce: (message: string, tone?: ThemeFeedback['tone']) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getInitialReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appliedThemeId, setAppliedThemeId] = useState<AdminThemeId>(readStoredAdminThemeId);
  const [previewThemeId, setPreviewThemeId] = useState<AdminThemeId>(readStoredAdminThemeId);
  const [motionEnabled, setMotionEnabledState] = useState(readStoredMotionPreference);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialReducedMotion);
  const [feedback, setFeedback] = useState<ThemeFeedback | null>(null);

  useEffect(() => {
    applyThemeToDocument(previewThemeId, motionEnabled);
  }, [motionEnabled, previewThemeId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const announce = useCallback((message: string, tone: ThemeFeedback['tone'] = 'info') => {
    setFeedback({ id: Date.now(), message, tone });
  }, []);

  const applyPreview = useCallback(() => {
    let persisted = true;
    try {
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, previewThemeId);
    } catch {
      persisted = false;
    }
    setAppliedThemeId(previewThemeId);
    const themeName = getAdminTheme(previewThemeId).name;
    announce(
      persisted
        ? `Đã áp dụng chủ đề ${themeName}.`
        : `Đã áp dụng ${themeName} trong phiên này, nhưng trình duyệt chưa cho phép lưu.`,
      persisted ? 'success' : 'warning',
    );
    return persisted;
  }, [announce, previewThemeId]);

  const cancelPreview = useCallback(() => {
    setPreviewThemeId(appliedThemeId);
    announce(`Đã trở về chủ đề ${getAdminTheme(appliedThemeId).name}.`, 'info');
  }, [announce, appliedThemeId]);

  const setMotionEnabled = useCallback((enabled: boolean) => {
    setMotionEnabledState(enabled);
    let persisted = true;
    try {
      window.localStorage.setItem(ADMIN_MOTION_STORAGE_KEY, enabled ? 'on' : 'off');
    } catch {
      persisted = false;
      announce('Đã đổi thiết lập chuyển động trong phiên này, nhưng trình duyệt chưa cho phép lưu.', 'warning');
    }
    return persisted;
  }, [announce]);

  const value = useMemo<ThemeContextValue>(() => ({
    appliedThemeId,
    previewThemeId,
    activeThemeId: previewThemeId,
    activeThemeName: getAdminTheme(previewThemeId).name,
    hasUnappliedPreview: appliedThemeId !== previewThemeId,
    motionEnabled,
    prefersReducedMotion,
    sidebarMotionEnabled: motionEnabled && !prefersReducedMotion,
    feedback,
    previewTheme: setPreviewThemeId,
    applyPreview,
    cancelPreview,
    setMotionEnabled,
    clearFeedback: () => setFeedback(null),
    announce,
  }), [
    announce,
    appliedThemeId,
    applyPreview,
    cancelPreview,
    feedback,
    motionEnabled,
    prefersReducedMotion,
    previewThemeId,
    setMotionEnabled,
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAdminTheme = (): ThemeContextValue => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAdminTheme must be used inside ThemeProvider');
  return value;
};

