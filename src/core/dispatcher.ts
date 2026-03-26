import { Action } from '@/types/actions';
import { setState, toggleState, $state } from './state';
import { registry } from './registry';
import { getRestLoadingKey } from './loading';

export class ActionDispatcher {
  /**
   * Dispatches a single action or an array of actions.
   */
  async dispatch(action: Action | Action[]) {
    if (Array.isArray(action)) {
      for (const a of action) {
        await this.executeAction(a);
      }
    } else {
      await this.executeAction(action);
    }
  }

  /**
   * Resolves an internal step path to the correct variant+mobile URL.
   *
   * Accepts a bare step name ("secondary"), an absolute step path
   * ("/campaign/secondary"), or an already-suffixed path.  Reads
   * __landerCampaignConfigs (registered by the Astro template) and the stored
   * variant from localStorage, plus the current user-agent, to produce the
   * canonical URL the router should navigate to.
   */
  private resolveInternalUrl(to: string): string {
    // Normalise: ensure we always have /campaign/step
    const toParts = to.replace(/^\//, '').split('/').filter(Boolean);
    if (toParts.length === 1) {
      const campaign = window.location.pathname.split('/').filter(Boolean)[0];
      if (campaign) toParts.unshift(campaign);
    }
    if (toParts.length < 2) return to;

    const configs: Record<string, { variants: string[]; hasMobileRoute: boolean }> =
      (window as any).__landerCampaignConfigs ?? {};

    const campaignId = toParts[0];
    const config = configs[campaignId];
    if (!config) return to; // unknown campaign — return as-is

    const { variants, hasMobileRoute } = config;

    // Strip any existing suffixes so we always start from the bare step slug
    let stepSlug = toParts[toParts.length - 1];
    const slugNoMobile = stepSlug.endsWith('.mobile') ? stepSlug.slice(0, -7) : stepSlug;
    let baseSlug = slugNoMobile;
    for (const v of variants) {
      if (slugNoMobile.endsWith('.' + v)) {
        baseSlug = slugNoMobile.slice(0, -(v.length + 1));
        break;
      }
    }

    // Determine target variant from localStorage
    let targetVariant: string | null = null;
    if (variants.length > 0) {
      const stored = localStorage.getItem(`lander-variant-${campaignId}`);
      if (stored && variants.includes(stored)) {
        targetVariant = stored;
      } else {
        targetVariant = variants[Math.floor(Math.random() * variants.length)];
        localStorage.setItem(`lander-variant-${campaignId}`, targetVariant);
      }
    }

    // Determine mobile
    const isMobile = hasMobileRoute && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || navigator.vendor || (window as any).opera || ''
    );

    let targetSlug = baseSlug;
    if (targetVariant) targetSlug += '.' + targetVariant;
    if (isMobile)      targetSlug += '.mobile';

    toParts[toParts.length - 1] = targetSlug;
    return '/' + toParts.join('/');
  }

  /** Navigate internally using Astro's SPA router when available. */
  private navigateTo(path: string, replace = false): void {
    const nav: ((p: string) => void) | undefined = (window as any).__landerNavigate;
    if (nav) {
      nav(path);
    } else if (replace) {
      window.location.replace(path);
    } else {
      window.location.href = path;
    }
  }

  /**
   * Evaluates a condition string against the current state.
   */
  private evaluateCondition(condition: string): boolean {
    const currentState = $state.get();
    try {
      // Basic evaluation: check if it's a key in state or a boolean-like string
      if (Object.prototype.hasOwnProperty.call(currentState, condition)) {
        return !!currentState[condition];
      }
      // Future: integrate a safe expression evaluator (e.g., jexl)
      return new Function('state', `with(state) { return ${condition}; }`)(currentState);
    } catch (e) {
      console.error(`Failed to evaluate condition: ${condition}`, e);
      return false;
    }
  }

  /**
   * Core logic for executing a single action.
   */
  private async executeAction(action: Action) {
    switch (action.type) {
      case 'setState':
        setState(action.payload.key, action.payload.value);
        break;

      case 'toggleState':
        toggleState(action.payload.key);
        break;

      case 'rest': {
        const { url, method = 'GET', headers, body, onSuccess, onError, stateKey, loadingKey } = action.payload;
        const loadKey = getRestLoadingKey(loadingKey, stateKey);
        
        try {
          // Set loading state
          setState(loadKey, true);
          
          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
          });

          if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
          
          const data = await response.json();
          if (stateKey) {
            setState(stateKey, data);
          }
          
          // Clear loading state on success
          setState(loadKey, false);
          
          if (onSuccess) await this.dispatch(onSuccess);
        } catch (error) {
          console.error(`REST Action failed: ${url}`, error);
          
          // Clear loading state on error
          setState(loadKey, false);
          
          if (onError) await this.dispatch(onError);
        }
        break;
      }

      case 'navigation': {
        const { to, type, replace } = action.payload;
        if (type === 'external') {
          if (replace) {
            window.location.replace(to);
          } else {
            window.location.href = to;
          }
        } else {
          const corrected = this.resolveInternalUrl(to);
          this.navigateTo(corrected, replace);
        }
        break;
      }

      case 'sequence':
        await this.dispatch(action.payload.actions);
        break;

      case 'conditional':
        if (this.evaluateCondition(action.payload.condition)) {
          await this.dispatch(action.payload.onTrue);
        } else if (action.payload.onFalse) {
          await this.dispatch(action.payload.onFalse);
        }
        break;

      case 'ui':
        this.handleUIAction(action.payload.operation, action.payload.params);
        break;

      default: {
        // Handle custom actions registered via registry
        const customAction = registry.getAction((action as any).type);
        if (customAction) {
          await customAction((action as any).payload);
        } else {
          console.warn(`Unknown action type: ${(action as any).type}`);
        }
      }
    }
  }

  private handleUIAction(operation: string, params?: Record<string, any>) {
    switch (operation) {
      case 'scrollTo':
        window.scrollTo({
          top: params?.top || 0,
          behavior: params?.behavior || 'smooth',
        });
        break;
      case 'copyToClipboard':
        if (params?.text) {
          navigator.clipboard.writeText(params.text);
        }
        break;
      case 'openPopup': {
        const popupId = params?.popupId;
        if (!popupId) {
          console.warn('openPopup requires popupId in params');
          return;
        }
        const modal = document.getElementById(`modal-${popupId}`);
        if (modal) {
          modal.classList.remove('modal-hidden');
        } else {
          console.warn(`Modal with id 'modal-${popupId}' not found`);
        }
        break;
      }
      case 'closePopup': {
        const popupId = params?.popupId;
        if (!popupId) {
          console.warn('closePopup requires popupId in params');
          return;
        }
        const modal = document.getElementById(`modal-${popupId}`);
        if (modal) {
          modal.classList.add('modal-hidden');
        }
        break;
      }
      case 'goToNextStep': {
        const nextStep = params?.next;
        let targetPath = '/';

        if (typeof nextStep === 'string') {
          const currentPathParts = window.location.pathname.split('/').filter(Boolean);
          const campaign = params?.campaignId || currentPathParts[0];

          if (campaign) {
            targetPath = `/${campaign}/${nextStep}`;
          } else {
            console.warn('goToNextStep: cannot infer campaign, defaulting to /');
            targetPath = `/${nextStep}`;
          }
        } else {
          console.warn('goToNextStep requires next step string in params.next');
        }

        this.navigateTo(this.resolveInternalUrl(targetPath));
        break;
      }
      // Popup logic will be implemented in Phase 5 with Astro templates
    }
  }
}

export const dispatcher = new ActionDispatcher();
