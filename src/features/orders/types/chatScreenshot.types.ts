export const ChatPlatform = {
  Unknown: 'UNKNOWN',
  Zalo: 'ZALO',
  Meta: 'META',
  TikTok: 'TIKTOK',
} as const;

export type ChatPlatform = typeof ChatPlatform[keyof typeof ChatPlatform];

export type ChatScreenshotItemAnalysis = {
  screenshotId: string;
  fileName: string;
  detectedPlatform: ChatPlatform;
  platformConfidence: number;
  detectedOrdererName?: string | null;
  nameConfidence: number;
  detectedTexts: string[];
  evidence: string[];
  warnings: string[];
};

export type ChatScreenshotAnalysis = {
  detectedPlatform: ChatPlatform;
  platformConfidence: number;
  detectedOrdererName?: string | null;
  nameConfidence: number;
  screenshots: ChatScreenshotItemAnalysis[];
  warnings: string[];
};
