/** Turns text like "$29.99" or "Item total: $39.98" into the number 29.99 / 39.98. */
export function parsePrice(text: string): number {
  const match = text.match(/\$(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`No price found in "${text}"`);
  }
  return Number(match[1]);
}

/** Formats a number the way SauceDemo shows money: 39.98 -> "$39.98". */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
