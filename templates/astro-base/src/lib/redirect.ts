import { DomainRouting } from './types';

export function performDomainRedirect(
  hostname: string,
  pathname: string,
  search: string,
  domainRouting: DomainRouting
): string | null {
  const hostMapping = domainRouting[hostname];
  if (!hostMapping) return null;

  const campaignId = hostMapping.campaign;
  const expectedBase = '/' + campaignId;
  const targetStep = hostMapping.defaultStep || 'main';

  if (hostMapping.renderFromRoot) {
    // If the user requests the actual initial step path directly, redirect to the root "/"
    if (pathname === `${expectedBase}/${targetStep}` || pathname === expectedBase) {
      return '/';
    }
    // If at root, do not redirect
    if (pathname === '/') {
      return null;
    }
  }

  if (!pathname.startsWith(expectedBase + '/')) {
    if (pathname !== expectedBase) {
      if (hostMapping.renderFromRoot) {
        return '/';
      }
      return `${expectedBase}/${targetStep}`;
    }
  }
  return null;
}

export function safeRedirect(targetUrl: string, currentUrl: URL): void {
  // Normalize and compare to prevent redirect loops and duplicate redirects
  if (targetUrl === currentUrl.pathname + currentUrl.search + currentUrl.hash || targetUrl === currentUrl.pathname) {
    return;
  }
  
  if (typeof window !== 'undefined' && window.location) {
    window.location.replace(targetUrl);
  }
}
