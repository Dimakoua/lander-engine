import { describe, it, expect, beforeEach, vi } from 'vitest';
import { $state, hydrateState, setState, toggleState, getState } from './state';

describe('state', () => {
  beforeEach(() => {
    // Reset state before each test
    $state.set({});
    // Mock sessionStorage
    const mockStorage: Record<string, string> = {};
    global.window = {
      sessionStorage: {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => { mockStorage[key] = value; },
      }
    } as any;
  });

  it('should hydrate state', () => {
    const initial = { foo: 'bar' };
    hydrateState(initial);
    expect($state.get()).toEqual(initial);
  });

  it('should set state key', () => {
    setState('a', 1);
    expect($state.get()).toEqual({ a: 1 });
    expect(getState('a')).toBe(1);
  });

  it('should toggle state key', () => {
    setState('active', false);
    toggleState('active');
    expect(getState('active')).toBe(true);
    toggleState('active');
    expect(getState('active')).toBe(false);
  });

  it('should persist state to sessionStorage', () => {
    setState('persist', 'me');
    const stored = window.sessionStorage.getItem('lander-engine-state');
    expect(JSON.parse(stored!)).toEqual({ persist: 'me' });
  });

  it('should load state from sessionStorage', () => {
    // This is a bit tricky because the persistence logic is at the top level of state.ts
    // and runs when the module is imported.
    // However, hydrateState and setState also call persistState.
    // Let's test getState's fallback to sessionStorage.
    const mockData = { fallback: 'data' };
    window.sessionStorage.setItem('lander-engine-state', JSON.stringify(mockData));
    
    // Clear in-memory state
    $state.set({});
    
    expect(getState('fallback')).toBe('data');
  });
});
