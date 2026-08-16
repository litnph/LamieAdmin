const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const quickOrderMaximumImageCount = 10;
export const quickOrderMaximumImageBytes = 10 * 1024 * 1024;

export const quickOrderFileFingerprint = (file: File) =>
  `${file.name}:${file.size}:${file.type}:${file.lastModified}`;

export const quickOrderFileSetKey = (files: readonly File[]) => files
  .map(quickOrderFileFingerprint)
  .sort((left, right) => left.localeCompare(right))
  .join('|');

export const appendUniqueQuickOrderFiles = (current: readonly File[], additions: readonly File[]) => {
  const fingerprints = new Set(current.map(quickOrderFileFingerprint));
  const unique = [...current];
  additions.forEach((file) => {
    const fingerprint = quickOrderFileFingerprint(file);
    if (fingerprints.has(fingerprint)) return;
    fingerprints.add(fingerprint);
    unique.push(file);
  });
  return unique;
};

export const validateQuickOrderFiles = (files: readonly File[]): string[] => {
  const errors: string[] = [];
  if (files.length > quickOrderMaximumImageCount) {
    errors.push(`Mỗi đơn chỉ được tải tối đa ${quickOrderMaximumImageCount} ảnh.`);
  }
  if (files.some((file) => !allowedImageTypes.has(file.type))) {
    errors.push('Ảnh phải có định dạng JPG, PNG, WEBP hoặc GIF.');
  }
  if (files.some((file) => file.size <= 0 || file.size > quickOrderMaximumImageBytes)) {
    errors.push('Mỗi ảnh phải có dung lượng lớn hơn 0 và không vượt quá 10 MB.');
  }
  return errors;
};
