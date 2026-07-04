import { CampaignConfig } from './types';

export function detectMobile(userAgent?: string): boolean {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent || navigator.vendor || (window as any).opera : '');
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

// Simple in-memory cache for resolved URLs to optimize performance
const urlResolutionCache = new Map<string, string | null>();

export function resolveUrl(
  pathname: string,
  campaignId: string,
  basePath: string,
  campaignConfig: CampaignConfig | undefined,
  isMobile: boolean,
  currentVariant: string | null
): string | null {
  if (!pathname || !campaignConfig) return null;

  const cacheKey = `${pathname}:${campaignId}:${basePath}:${isMobile}:${currentVariant}`;
  if (urlResolutionCache.has(cacheKey)) {
    return urlResolutionCache.get(cacheKey)!;
  }

  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (parts.length === 0) return null;

  let bpParts = 0;
  if (basePath !== '/') {
    const bpSegments = basePath.replace(/^\//, '').split('/');
    let match = true;
    for (let i = 0; i < bpSegments.length; i++) {
      if (parts[i] !== bpSegments[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      bpParts = bpSegments.length;
    } else {
      bpParts = 1; // Fallback for multi-campaign setups
    }
  }

  // Need at least one step segment
  if (parts.length <= bpParts) {
    urlResolutionCache.set(cacheKey, null);
    return null;
  }

  const stepSlug = parts[parts.length - 1];
  const isMobileSlug = stepSlug.endsWith('.mobile');
  const slugNoMobile = isMobileSlug ? stepSlug.slice(0, stepSlug.length - 7) : stepSlug;

  let baseStepSlug = slugNoMobile;
  let detectedVariant: string | null = null;

  const variants = campaignConfig.variants;
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    if (slugNoMobile.endsWith('.' + v)) {
      detectedVariant = v;
      baseStepSlug = slugNoMobile.slice(0, slugNoMobile.length - v.length - 1);
      break;
    }
  }

  const targetVariant = currentVariant ?? detectedVariant;
  const targetMobile = campaignConfig.hasMobileRoute && isMobile;

  let targetSlug = baseStepSlug;
  if (targetVariant) targetSlug += '.' + targetVariant;
  if (targetMobile) targetSlug += '.mobile';

  if (targetSlug === stepSlug) {
    urlResolutionCache.set(cacheKey, null);
    return null;
  }

  parts[parts.length - 1] = targetSlug;
  const resolved = '/' + parts.join('/');
  urlResolutionCache.set(cacheKey, resolved);
  return resolved;
}
