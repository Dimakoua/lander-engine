import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  hydrateState,
  setState,
  toggleState,
  getState,
  $state,
} from '@/core/state';

describe('State Management (Nanostores)', () => {
  beforeEach(() => {
    $state.set({});
    // Mock window object
    global.window = {
      sessionStorage: {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] || null;
        },
        setItem(key: string, value: string) {
          this.store[key] = value;
        },
        removeItem(key: string) {
          delete this.store[key];
        },
        clear() {
          this.store = {};
        },
      },
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('hydrateState', () => {
    it('should initialize state with provided data', () => {
      const initialData = { user: 'john', count: 42 };
      hydrateState(initialData);
      expect($state.get()).toEqual(initialData);
    });

    it('should handle empty state', () => {
      hydrateState({});
      expect($state.get()).toEqual({});
    });

    it('should overwrite existing state', () => {
      $state.set({ old: true });
      hydrateState({ new: true });
      expect($state.get()).toEqual({ new: true });
    });

    it('should handle nested objects', () => {
      const data = {
        user: { name: 'John', address: { city: 'NYC' } },
        settings: { theme: 'dark' },
      };
      hydrateState(data);
      expect($state.get()).toEqual(data);
    });
  });

  describe('setState', () => {
    it('should set a simple value in state', () => {
      setState('counter', 5);
      expect(getState('counter')).toBe(5);
    });

    it('should update an existing key', () => {
      $state.set({ counter: 1 });
      setState('counter', 10);
      expect(getState('counter')).toBe(10);
    });

    it('should handle different data types', () => {
      setState('string', 'hello');
      setState('number', 42);
      setState('boolean', true);
      setState('array', [1, 2, 3]);
      setState('object', { key: 'value' });

      expect(getState('string')).toBe('hello');
      expect(getState('number')).toBe(42);
      expect(getState('boolean')).toBe(true);
      expect(getState('array')).toEqual([1, 2, 3]);
      expect(getState('object')).toEqual({ key: 'value' });
    });

    it('should handle null and undefined values', () => {
      setState('nullValue', null);
      setState('undefinedValue', undefined);

      expect(getState('nullValue')).toBeNull();
      expect(getState('undefinedValue')).toBeUndefined();
    });

    it('should add new keys to existing state', () => {
      $state.set({ existing: 'value' });
      setState('newKey', 'newValue');

      const currentState = $state.get();
      expect(currentState.existing).toBe('value');
      expect(currentState.newKey).toBe('newValue');
    });
  });

  describe('toggleState', () => {
    it('should toggle false to true', () => {
      setState('flag', false);
      toggleState('flag');
      expect(getState('flag')).toBe(true);
    });

    it('should toggle true to false', () => {
      setState('flag', true);
      toggleState('flag');
      expect(getState('flag')).toBe(false);
    });

    it('should toggle undefined to true', () => {
      toggleState('flag');
      expect(getState('flag')).toBe(true);
    });

    it('should toggle truthy value to false', () => {
      setState('value', 'something');
      toggleState('value');
      expect(getState('value')).toBe(false);
    });

    it('should toggle zero to true', () => {
      setState('counter', 0);
      toggleState('counter');
      expect(getState('counter')).toBe(true);
    });

    it('should toggle non-zero to false', () => {
      setState('counter', 42);
      toggleState('counter');
      expect(getState('counter')).toBe(false);
    });
  });

  describe('getState', () => {
    it('should retrieve a value from state', () => {
      $state.set({ key: 'value' });
      expect(getState('key')).toBe('value');
    });

    it('should return undefined for non-existent key', () => {
      $state.set({});
      expect(getState('nonexistent')).toBeUndefined();
    });

    it('should handle nested keys', () => {
      $state.set({ user: { name: 'John' } });
      const user = getState('user');
      expect(user.name).toBe('John');
    });

    it('should return falsy values correctly', () => {
      $state.set({ zero: 0, empty: '', bool: false, nil: null });

      expect(getState('zero')).toBe(0);
      expect(getState('empty')).toBe('');
      expect(getState('bool')).toBe(false);
      expect(getState('nil')).toBeNull();
    });
  });

  describe('Multiple Operations', () => {
    it('should maintain multiple keys in state', () => {
      setState('user', 'john');
      setState('count', 5);
      setState('active', true);

      const state = $state.get();
      expect(Object.keys(state)).toHaveLength(3);
      expect(state.user).toBe('john');
      expect(state.count).toBe(5);
      expect(state.active).toBe(true);
    });

    it('should update individual keys without affecting others', () => {
      hydrateState({ a: 1, b: 2, c: 3 });
      setState('b', 20);

      const state = $state.get();
      expect(state.a).toBe(1);
      expect(state.b).toBe(20);
      expect(state.c).toBe(3);
    });

    it('should toggle individual keys without affecting others', () => {
      hydrateState({ flag1: true, flag2: true });
      toggleState('flag1');

      const state = $state.get();
      expect(state.flag1).toBe(false);
      expect(state.flag2).toBe(true);
    });
  });
});
