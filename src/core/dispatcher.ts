import { Action } from '@/types/actions';
import { setState, toggleState, $state } from './state';
import { registry } from './registry';

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
        const loadKey = loadingKey || `loading_${stateKey || 'request'}`;
        
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
          // Internal step navigation logic (Astro View Transitions / router)
          // For now, simple URL change. In Phase 5, this will be more integrated.
          if (replace) {
            window.location.replace(to);
          } else {
            window.location.href = to;
          }
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
          // Try to infer campaign from current URL, fallback to payload campaignId
          const currentPathParts = window.location.pathname.split('/').filter(Boolean); // ['campaign_alpha','secondary']
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

        window.location.href = targetPath;
        break;
      }
      // Popup logic will be implemented in Phase 5 with Astro templates
    }
  }
}

export const dispatcher = new ActionDispatcher();
