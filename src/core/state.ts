import { map } from 'nanostores';

export const $state = map<Record<string, any>>({});
const STORAGE_KEY = 'lander-engine-state';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function persistState() {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify($state.get()));
  } catch (err) {
    console.warn('lander-engine: failed to persist state', err);
  }
}

function loadPersistedState(): Record<string, any> | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('lander-engine: failed to load persisted state', err);
    return null;
  }
}

const persisted = loadPersistedState();
if (persisted) {
  $state.set(persisted);
}

/**
 * Hydrates the global state with initial data.
 */
export function hydrateState(initialData: Record<string, any>) {
  $state.set(initialData);
  persistState();
}

/**
 * Updates a specific key in the global state.
 */
export function setState(key: string, value: any) {
  $state.setKey(key, value);
  persistState();
}

/**
 * Toggles a boolean value in the global state.
 */
export function toggleState(key: string) {
  const current = $state.get()[key];
  $state.setKey(key, !current);
  persistState();
}

/**
 * Retrieves a value from the global state.
 */
export function getState(key: string) {
  const current = $state.get()[key];
  if (current !== undefined) {
    return current;
  }
  const fromStorage = loadPersistedState();
  return fromStorage ? fromStorage[key] : undefined;
}
