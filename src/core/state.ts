import { map } from 'nanostores';

export const $state = map<Record<string, any>>({});

/**
 * Hydrates the global state with initial data.
 */
export function hydrateState(initialData: Record<string, any>) {
  $state.set(initialData);
}

/**
 * Updates a specific key in the global state.
 */
export function setState(key: string, value: any) {
  $state.setKey(key, value);
}

/**
 * Toggles a boolean value in the global state.
 */
export function toggleState(key: string) {
  const current = $state.get()[key];
  $state.setKey(key, !current);
}

/**
 * Retrieves a value from the global state.
 */
export function getState(key: string) {
  return $state.get()[key];
}
