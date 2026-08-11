/** Returns the suggested deposit only; callers remain responsible for manual overrides. */
export const calculateDefaultDeposit = (orderValue: number): number => {
  const value = Math.max(0, Number.isFinite(orderValue) ? orderValue : 0);
  if (value <= 400_000) return 100_000;
  if (value <= 700_000) return 200_000;
  if (value <= 1_000_000) return 300_000;
  return Math.round(value / 3 / 100_000) * 100_000;
};
