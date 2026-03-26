import * as nanostores from 'nanostores';

declare const $state: nanostores.MapStore<Record<string, any>>;
/**
 * Hydrates the global state with initial data.
 */
declare function hydrateState(initialData: Record<string, any>): void;
/**
 * Updates a specific key in the global state.
 */
declare function setState(key: string, value: any): void;
/**
 * Toggles a boolean value in the global state.
 */
declare function toggleState(key: string): void;
/**
 * Retrieves a value from the global state.
 */
declare function getState(key: string): any;

type ActionType = 'setState' | 'toggleState' | 'rest' | 'navigation' | 'sequence' | 'conditional' | 'ui';
interface SetStateAction {
    type: 'setState';
    payload: {
        key: string;
        value: any;
    };
}
interface ToggleStateAction {
    type: 'toggleState';
    payload: {
        key: string;
    };
}
interface RestAction {
    type: 'rest';
    payload: {
        url: string;
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        headers?: Record<string, string>;
        body?: Record<string, any>;
        onSuccess?: Action[];
        onError?: Action[];
        stateKey?: string;
        loadingKey?: string;
    };
}
interface NavigationAction {
    type: 'navigation';
    payload: {
        to: string;
        type: 'step' | 'external';
        replace?: boolean;
    };
}
interface SequenceAction {
    type: 'sequence';
    payload: {
        actions: Action[];
    };
}
interface ConditionalAction {
    type: 'conditional';
    payload: {
        condition: string;
        onTrue: Action[];
        onFalse?: Action[];
    };
}
interface UIAction {
    type: 'ui';
    payload: {
        operation: 'scrollTo' | 'copyToClipboard' | 'openPopup' | 'closePopup' | 'goToNextStep';
        params?: Record<string, any>;
    };
}
type Action = SetStateAction | ToggleStateAction | RestAction | NavigationAction | SequenceAction | ConditionalAction | UIAction;

declare class ActionDispatcher {
    /**
     * Dispatches a single action or an array of actions.
     */
    dispatch(action: Action | Action[]): Promise<void>;
    /**
     * Resolves an internal step path to the correct variant+mobile URL.
     *
     * Accepts a bare step name ("secondary"), an absolute step path
     * ("/campaign/secondary"), or an already-suffixed path.  Reads
     * __landerCampaignConfigs (registered by the Astro template) and the stored
     * variant from localStorage, plus the current user-agent, to produce the
     * canonical URL the router should navigate to.
     */
    private resolveInternalUrl;
    /** Navigate internally using Astro's SPA router when available. */
    private navigateTo;
    /**
     * Evaluates a condition string against the current state.
     */
    private evaluateCondition;
    /**
     * Core logic for executing a single action.
     */
    private executeAction;
    private handleUIAction;
}
declare const dispatcher: ActionDispatcher;

type ComponentMap = Record<string, any>;
type ActionHandler = (payload: any) => void | Promise<void>;
type ActionMap = Record<string, ActionHandler>;
declare class Registry {
    private components;
    private actions;
    registerComponent(name: string, component: any): void;
    registerComponents(components: ComponentMap): void;
    getComponent(name: string): any;
    registerAction(name: string, handler: ActionHandler): void;
    registerActions(actions: ActionMap): void;
    getAction(name: string): ActionHandler;
    getAllComponents(): ComponentMap;
    getAllActions(): ActionMap;
}
declare const registry: Registry;

interface LoadingActionResult {
    isLoading: boolean;
    values: Record<string, any>;
}
/**
 * Framework-agnostic function to watch loading state and action results.
 * Works with any JavaScript framework or vanilla JS.
 *
 * @param actions - Single action or array of actions to track
 * @param callback - Called with { isLoading, values } whenever state changes
 * @param explicitLoadingKeys - Optional: explicit loading keys to monitor
 * @returns Unsubscribe function to stop watching
 *
 * @example
 * ```javascript
 * // Vanilla JS
 * const unsubscribe = watchLoadingAction(actions, (state) => {
 *   console.log('Loading:', state.isLoading);
 *   console.log('Values:', state.values);
 *   updateUI(state);
 * });
 *
 * // Clean up
 * unsubscribe();
 * ```
 */
declare function watchLoadingAction(actions: any | undefined, callback: (state: LoadingActionResult) => void, explicitLoadingKeys?: string[]): () => void;
/**
 * Get current loading state synchronously.
 * Useful for one-time checks without subscribing.
 *
 * @param actions - Single action or array of actions
 * @param explicitLoadingKeys - Optional: explicit loading keys
 * @returns Current { isLoading, values } state
 *
 * @example
 * ```javascript
 * const { isLoading, values } = getLoadingActionState(actions);
 * if (isLoading) {
 *   console.log('Still loading...');
 * }
 * ```
 */
declare function getLoadingActionState(actions?: any, explicitLoadingKeys?: string[]): LoadingActionResult;

export { $state as $, type Action as A, type ComponentMap as C, type NavigationAction as N, type RestAction as R, type SequenceAction as S, type ToggleStateAction as T, type UIAction as U, ActionDispatcher as a, type ActionHandler as b, type ActionMap as c, type ActionType as d, type ConditionalAction as e, type SetStateAction as f, dispatcher as g, getLoadingActionState as h, getState as i, hydrateState as j, registry as r, setState as s, toggleState as t, watchLoadingAction as w };
