export function formatPrize(usdc: number): string {
  if (usdc < 0.01) return usdc.toFixed(6).replace(/\.?0+$/, '') + ' USDC';
  return usdc.toFixed(2) + ' USDC';
}