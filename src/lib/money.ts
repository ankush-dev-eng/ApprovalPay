export const fmt = (cents: number): string => (cents / 100).toFixed(2);
export const toCents = (usd: number): number => Math.round(usd * 100);

