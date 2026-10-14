import React, { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw, Save } from '@/shared/icons/lucideAnimated';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { contentApi } from '../api/contentApi';
import { ContentShell, ContentStatus, platformLabel } from '../components/ContentShell';
import {
  CONTENT_PLATFORMS,
  type ContentFooterSettingDto,
  type ContentPlatform,
} from '../types/content.types';

type FooterDraft = {
  content: string;
  hashtagsText: string;
  isEnabled: boolean;
  updatedAt?: string | null;
};

const textareaClass = 'w-full resize-y rounded-admin-control border border-admin-input-border bg-admin-card px-3 py-2.5 text-sm leading-6 text-admin-text-primary outline-none transition-colors placeholder:text-admin-text-muted focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/15 disabled:cursor-not-allowed disabled:bg-admin-muted';

const emptyDrafts = (): Record<ContentPlatform, FooterDraft> => ({
  facebook: { content: '', hashtagsText: '', isEnabled: false },
  instagram: { content: '', hashtagsText: '', isEnabled: false },
  tiktok: { content: '', hashtagsText: '', isEnabled: false },
});

const toDrafts = (settings: ContentFooterSettingDto[]) => {
  const drafts = emptyDrafts();
  settings.forEach((setting) => {
    drafts[setting.platform] = {
      content: setting.content,
      hashtagsText: setting.hashtags.join(' '),
      isEnabled: setting.isEnabled,
      updatedAt: setting.updatedAt,
    };
  });
  return drafts;
};

const parseHashtags = (value: string) => Array.from(new Set(
  value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.startsWith('#') ? item : `#${item}`),
));

const formatUpdatedAt = (value?: string | null) => {
  if (!value) return 'Chưa lưu';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
};

export const ContentFooterSettingsPage: React.FC = () => {
  const [drafts, setDrafts] = useState<Record<ContentPlatform, FooterDraft>>(emptyDrafts);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState<ContentPlatform | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const settings = await contentApi.footerSettings();
      setDrafts(toDrafts(settings));
      setEmpty(settings.length === 0);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (platform: ContentPlatform, patch: Partial<FooterDraft>) => {
    setDrafts((current) => ({ ...current, [platform]: { ...current[platform], ...patch } }));
    setSuccess('');
  };

  const save = async (platform: ContentPlatform) => {
    const draft = drafts[platform];
    const hashtags = parseHashtags(draft.hashtagsText);
    if (draft.isEnabled && !draft.content.trim() && hashtags.length === 0) {
      setError(`Footer ${platformLabel(platform)} đang bật nhưng chưa có nội dung hoặc hashtag.`);
      return;
    }
    if (hashtags.some((hashtag) => hashtag.length > 100)) {
      setError(`Footer ${platformLabel(platform)} có hashtag dài quá 100 ký tự.`);
      return;
    }
    setSaving(platform);
    setError('');
    try {
      const response = await contentApi.saveFooterSetting(platform, {
        content: draft.content.trim(),
        hashtags,
        isEnabled: draft.isEnabled,
      });
      setDrafts((current) => ({
        ...current,
        [platform]: {
          content: response.content,
          hashtagsText: response.hashtags.join(' '),
          isEnabled: response.isEnabled,
          updatedAt: response.updatedAt,
        },
      }));
      setEmpty(false);
      setSuccess(`Đã lưu footer ${platformLabel(platform)}.`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(null);
    }
  };

  return (
    <ContentShell title="Cấu hình footer" description="Footer được ghép ở máy chủ sau phần body và được chụp lại khi lưu content, nên lịch sử không đổi theo cấu hình mới.">
      <div className="space-y-4">
        {success ? <ContentStatus kind="success">{success}</ContentStatus> : null}
        {error ? <ContentStatus kind="error"><div className="flex flex-wrap items-center justify-between gap-3"><span>{error}</span><button type="button" onClick={() => void load()} className="inline-flex min-h-9 items-center gap-1.5 font-semibold underline underline-offset-2"><RefreshCw size={15} aria-hidden="true" /> Tải lại</button></div></ContentStatus> : null}
        {empty && !loading ? <ContentStatus kind="info">Chưa có cấu hình footer. Ba mẫu bên dưới đang tắt; lưu từng nền tảng khi sẵn sàng.</ContentStatus> : null}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-admin-panel border border-admin-border bg-admin-surface text-sm text-admin-text-secondary" role="status">Đang tải cấu hình footer...</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {CONTENT_PLATFORMS.map((platform) => {
              const draft = drafts[platform];
              const hashtags = parseHashtags(draft.hashtagsText);
              const busy = saving === platform;
              return (
                <article key={platform} className="flex min-w-0 flex-col rounded-admin-panel border border-admin-border bg-admin-surface p-4 shadow-admin-panel sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h2 className="font-semibold text-admin-text-primary">{platformLabel(platform)}</h2><p className="mt-1 text-xs text-admin-text-muted">Cập nhật: {formatUpdatedAt(draft.updatedAt)}</p></div>
                    <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-admin-control border border-admin-border px-3 text-sm font-medium text-admin-text-primary"><input type="checkbox" checked={draft.isEnabled} onChange={(event) => update(platform, { isEnabled: event.target.checked })} className="h-4 w-4 accent-admin-primary" /> {draft.isEnabled ? 'Đang bật' : 'Đang tắt'}</label>
                  </div>
                  <div className="mt-4 flex-1 space-y-4">
                    <div><label htmlFor={`footer-content-${platform}`} className="mb-1.5 block text-sm font-medium text-admin-text-primary">Thông tin cửa hàng / CTA</label><textarea id={`footer-content-${platform}`} value={draft.content} onChange={(event) => update(platform, { content: event.target.value })} className={`${textareaClass} min-h-40`} maxLength={2000} placeholder="Thông tin liên hệ và lời kêu gọi hành động đã xác thực..." /></div>
                    <div><label htmlFor={`footer-hashtags-${platform}`} className="mb-1.5 block text-sm font-medium text-admin-text-primary">Hashtag mặc định</label><textarea id={`footer-hashtags-${platform}`} value={draft.hashtagsText} onChange={(event) => update(platform, { hashtagsText: event.target.value })} className={`${textareaClass} min-h-24`} maxLength={1200} placeholder="#Lamie #HoaTuoi" /><p className="mt-1.5 text-xs leading-5 text-admin-text-muted">Phân cách bằng dấu cách, dấu phẩy hoặc xuống dòng. Dấu # được tự thêm khi lưu.</p></div>
                    <div className="rounded-admin-control border border-dashed border-admin-border bg-admin-muted/45 p-3" aria-label={`Xem trước footer ${platformLabel(platform)}`}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-admin-text-muted">Xem trước</p>
                      {draft.isEnabled ? <><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-admin-text-secondary">{draft.content.trim() || 'Không có nội dung cố định'}</p>{hashtags.length ? <p className="mt-2 break-words text-sm leading-6 text-admin-primary">{hashtags.join(' ')}</p> : null}</> : <p className="mt-2 text-sm italic text-admin-text-muted">Footer đang tắt và sẽ không được ghép vào bài mới.</p>}
                    </div>
                  </div>
                  <button type="button" onClick={() => void save(platform)} disabled={Boolean(saving)} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-primary px-4 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary-hover disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Save size={17} aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}{busy ? 'Đang lưu...' : `Lưu ${platformLabel(platform)}`}</button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </ContentShell>
  );
};
