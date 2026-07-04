import { navigate } from 'astro:transitions/client';

export function rewriteLinks(resolveUrlFn: (pathname: string) => string | null): void {
  if (window.location.search.includes('no-redirect')) return;

  const links = document.querySelectorAll<HTMLAnchorElement>('a[href]');
  links.forEach(a => {
    try {
      const url = new URL(a.href);
      if (url.origin !== window.location.origin) return;

      const corrected = resolveUrlFn(url.pathname);
      if (corrected) {
        a.href = corrected + url.search + url.hash;
      }
    } catch {
      // ignore unparseable hrefs
    }
  });
}

export function setupLinkInterception(resolveUrlFn: (pathname: string) => string | null): () => void {
  const clickHandler = (e: MouseEvent) => {
    if (window.location.search.includes('no-redirect')) return;
    
    const a = (e.target as Element).closest('a');
    if (!a) return;

    try {
      const url = new URL(a.href);
      if (url.origin !== window.location.origin) return;

      const corrected = resolveUrlFn(url.pathname);
      if (!corrected) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      
      const navigateFn = window.__landerNavigate || navigate;
      navigateFn(corrected + url.search + url.hash);
    } catch {
      // ignore
    }
  };

  document.addEventListener('click', clickHandler, { capture: true });
  return () => document.removeEventListener('click', clickHandler, { capture: true });
}

export function setupModalBackdrop(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const modal = target.closest('.lander-modal') as HTMLElement;
    if (modal && target === modal) {
      if (modal.dataset.closeOnBackdrop === 'true') {
        modal.classList.add('modal-hidden');
      }
    }
  });
}
