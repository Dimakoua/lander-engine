export interface VariantAllocationConfig {
  trafficSplit?: Record<string, number>;
  strategy?: 'weighted' | 'bandit';
  sticky?: boolean;
}

export function selectVariant(
  campaignId: string,
  variants: string[],
  allocation?: VariantAllocationConfig
): string | null {
  if (!variants || variants.length === 0) return null;

  const sticky = allocation?.sticky ?? true;
  const storageKey = `lander_variant_${campaignId}`;

  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const forceVariant = urlParams.get('variant');
    if (forceVariant && variants.includes(forceVariant)) {
      if (sticky) {
        window.sessionStorage.setItem(storageKey, forceVariant);
        document.cookie = `${storageKey}=${forceVariant}; path=/; max-age=2592000`; // 30 days
      }
      return forceVariant;
    }
  }

  if (sticky && typeof window !== 'undefined') {
    const stored = window.sessionStorage.getItem(storageKey);
    if (stored && variants.includes(stored)) return stored;

    const match = document.cookie.match(new RegExp('(^| )' + storageKey + '=([^;]+)'));
    if (match && match[2] && variants.includes(match[2])) return match[2];
  }

  let selected = variants[Math.floor(Math.random() * variants.length)];

  if (allocation?.strategy === 'weighted' && allocation.trafficSplit) {
    const split = allocation.trafficSplit;
    const validVariants = variants.filter(v => split[v] !== undefined);
    if (validVariants.length > 0) {
      let totalWeight = validVariants.reduce((sum, v) => sum + split[v], 0);
      let random = Math.random() * totalWeight;
      for (const v of validVariants) {
        random -= split[v];
        if (random <= 0) {
          selected = v;
          break;
        }
      }
    }
  } else if (allocation?.strategy === 'bandit') {
    // Epsilon-greedy basic placeholder without external dependencies
    const epsilon = 0.1;
    if (Math.random() < epsilon) {
      selected = variants[Math.floor(Math.random() * variants.length)];
    } else {
      // Placeholder for exploit: currently acts as random since we don't have stats
      selected = variants[Math.floor(Math.random() * variants.length)];
    }
  }

  if (sticky && typeof window !== 'undefined') {
    window.sessionStorage.setItem(storageKey, selected);
    document.cookie = `${storageKey}=${selected}; path=/; max-age=2592000`; // 30 days
  }

  return selected;
}
