import { $state } from './state';

/**
 * Derives the loading state key for a `rest` action.
 * Single source of truth used by both the dispatcher (write) and loading observers (read).
 */
export function getRestLoadingKey(loadingKey?: string, stateKey?: string): string {
  return loadingKey || `loading_${stateKey || 'request'}`;
}

interface LoadingActionResult {
  isLoading: boolean;
  values: Record<string, any>;
}

/**
 * Extracts loading and state keys from ANY action payloads.
 * Works with any action type (rest, navigation, custom, etc.) that defines:
 * - `loadingKey` - marks when action is in progress
 * - `stateKey` - stores result in global state
 */
function extractActionKeys(actions: any[]) {
  const loadingKeys = new Set<string>();
  const stateKeys = new Set<string>();

  const walk = (action: any) => {
    if (!action || typeof action !== 'object') return;

    // Extract loading key from payload (works for any action type)
    const loadingKey = action.payload?.loadingKey;
    if (loadingKey) {
      loadingKeys.add(loadingKey);
    } else if (action.type === 'rest') {
      loadingKeys.add(getRestLoadingKey(action.payload?.loadingKey, action.payload?.stateKey));
    }

    // Extract state key from payload (works for any action type)
    const stateKey = action.payload?.stateKey;
    if (stateKey) {
      stateKeys.add(stateKey);
    }

    // Recurse through action sequences
    if (action.type === 'sequence' && Array.isArray(action.payload?.actions)) {
      action.payload.actions.forEach(walk);
    }

    // Recurse through conditional branches
    if (action.type === 'conditional') {
      if (Array.isArray(action.payload?.onTrue)) action.payload.onTrue.forEach(walk);
      if (Array.isArray(action.payload?.onFalse)) action.payload.onFalse.forEach(walk);
    }
  };

  if (Array.isArray(actions)) {
    actions.forEach(walk);
  }

  return { loadingKeys: Array.from(loadingKeys), stateKeys: Array.from(stateKeys) };
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
export function watchLoadingAction(
  actions: any = null,
  callback: (state: LoadingActionResult) => void,
  explicitLoadingKeys: string[] = []
): () => void {
  let { loadingKeys, stateKeys } = extractActionKeys(
    Array.isArray(actions) ? actions : actions ? [actions] : []
  );

  // Merge with explicit keys
  loadingKeys = Array.from(new Set([...loadingKeys, ...explicitLoadingKeys]));

  const updateState = () => {
    const current = $state.get();
    const isLoading = loadingKeys.some((k) => Boolean(current[k]));
    const values: Record<string, any> = {};

    stateKeys.forEach((key) => {
      // Only include keys that have been set — omit undefined to avoid
      // SSR/hydration mismatches and "undefined" string renders
      if (current[key] !== undefined) {
        values[key] = current[key];
      }
    });

    callback({ isLoading, values });
  };

  // Initialize
  updateState();

  // Subscribe to changes
  const unsubscribe = $state.listen(updateState);
  return unsubscribe;
}

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
export function getLoadingActionState(
  actions: any = null,
  explicitLoadingKeys: string[] = []
): LoadingActionResult {
  let { loadingKeys, stateKeys } = extractActionKeys(
    Array.isArray(actions) ? actions : actions ? [actions] : []
  );

  loadingKeys = Array.from(new Set([...loadingKeys, ...explicitLoadingKeys]));

  const current = $state.get();
  const isLoading = loadingKeys.some((k) => Boolean(current[k]));
  const values: Record<string, any> = {};

  stateKeys.forEach((key) => {
    if (current[key] !== undefined) {
      values[key] = current[key];
    }
  });

  return { isLoading, values };
}
