import { DomainRouting } from './types';

export function performDomainRedirect(
  hostname: string,
  pathname: string,
  search: string,
  domainRouting: DomainRouting
): string | null {
  const hostMapping = domainRouting[hostname];
  if (!hostMapping) return null;

  let expectedBase = hostMapping.basePath || '/' + hostMapping.campaign;
  if (expectedBase === '/') expectedBase = '';

  if (expectedBase !== '' && !pathname.startsWith(expectedBase + '/')) {
    if (pathname !== expectedBase) {
      const targetStep = hostMapping.defaultStep || 'main';
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
