export function assignVariant(campaignId: string, variants: string[]): string | null {
  if (!variants || variants.length === 0) return null;

  const storageKey = `lander-variant-${campaignId}`;
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(storageKey);
    if (stored && variants.includes(stored)) {
      return stored;
    }
    const chosen = variants[Math.floor(Math.random() * variants.length)];
    localStorage.setItem(storageKey, chosen);
    return chosen;
  }
  return null;
}
