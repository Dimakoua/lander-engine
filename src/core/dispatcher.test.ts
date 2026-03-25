import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionDispatcher } from '@/core/dispatcher';
import { setState, toggleState, $state } from '@/core/state';

describe('Action Dispatcher', () => {
  let dispatcher: ActionDispatcher;

  beforeEach(() => {
    dispatcher = new ActionDispatcher();
    $state.set({});
    // Setup browser API mocks
    global.fetch = vi.fn();
    global.window = {
      location: { href: '', replace: vi.fn() },
      scrollTo: vi.fn(),
    } as any;
    global.document = {
      querySelector: vi.fn(),
    } as any;
    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: { writeText: vi.fn() },
      },
      writable: true,
      configurable: true,
    });
  });

  describe('setState Action', () => {
    it('should execute setState action', async () => {
      const action = {
        type: 'setState' as const,
        payload: { key: 'user', value: 'john' },
      };

      await dispatcher.dispatch(action);
      expect($state.get().user).toBe('john');
    });

    it('should handle multiple setState actions', async () => {
      const actions = [
        { type: 'setState' as const, payload: { key: 'name', value: 'Alice' } },
        { type: 'setState' as const, payload: { key: 'age', value: 30 } },
      ];

      await dispatcher.dispatch(actions);
      expect($state.get().name).toBe('Alice');
      expect($state.get().age).toBe(30);
    });
  });

  describe('toggleState Action', () => {
    it('should toggle boolean state', async () => {
      $state.set({ flag: false });

      await dispatcher.dispatch({
        type: 'toggleState',
        payload: { key: 'flag' },
      });

      expect($state.get().flag).toBe(true);
    });

    it('should toggle undefined to true', async () => {
      await dispatcher.dispatch({
        type: 'toggleState',
        payload: { key: 'newFlag' },
      });

      expect($state.get().newFlag).toBe(true);
    });
  });

  describe('REST Action', () => {
    it('should fetch data from URL', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Test' }),
      });

      global.fetch = mockFetch;

      await dispatcher.dispatch({
        type: 'rest',
        payload: {
          url: 'https://api.example.com/data',
          method: 'GET',
          stateKey: 'data',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', expect.any(Object));
      expect($state.get().data).toEqual({ id: 1, name: 'Test' });
    });

    it('should set loading state', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      global.fetch = mockFetch;

      await dispatcher.dispatch({
        type: 'rest',
        payload: {
          url: 'https://api.example.com/data',
          stateKey: 'result',
        },
      });

      expect($state.get().loading_result).toBe(false);
    });

    it('should handle POST requests', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ created: true }),
      });

      global.fetch = mockFetch;

      const body = { name: 'John' };

      await dispatcher.dispatch({
        type: 'rest',
        payload: {
          url: 'https://api.example.com/users',
          method: 'POST',
          body,
          stateKey: 'user',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  describe('Navigation Action', () => {
    it('should handle external navigation', async () => {
      const mockLocation = { href: '', replace: vi.fn() };
      global.window = { location: mockLocation } as any;

      await dispatcher.dispatch({
        type: 'navigation',
        payload: { to: 'https://example.com', type: 'external' },
      });

      expect(mockLocation.href).toBe('https://example.com');
    });

    it('should handle external navigation with replace', async () => {
      const mockLocation = { href: '', replace: vi.fn() };
      global.window = { location: mockLocation } as any;

      await dispatcher.dispatch({
        type: 'navigation',
        payload: { to: 'https://example.com', type: 'external', replace: true },
      });

      expect(mockLocation.replace).toHaveBeenCalledWith('https://example.com');
    });
  });

  describe('Sequence Action', () => {
    it('should execute actions in sequence', async () => {
      await dispatcher.dispatch({
        type: 'sequence',
        payload: {
          actions: [
            { type: 'setState', payload: { key: 'step1', value: true } },
            { type: 'setState', payload: { key: 'step2', value: true } },
          ],
        },
      });

      expect($state.get().step1).toBe(true);
      expect($state.get().step2).toBe(true);
    });
  });

  describe('Conditional Action', () => {
    it('should execute onTrue when condition is true', async () => {
      $state.set({ feature: true });

      await dispatcher.dispatch({
        type: 'conditional',
        payload: {
          condition: 'feature',
          onTrue: [{
            type: 'setState',
            payload: { key: 'result', value: 'was-true' },
          }],
          onFalse: [{
            type: 'setState',
            payload: { key: 'result', value: 'was-false' },
          }],
        },
      });

      expect($state.get().result).toBe('was-true');
    });

    it('should execute onFalse when condition is false', async () => {
      $state.set({ feature: false });

      await dispatcher.dispatch({
        type: 'conditional',
        payload: {
          condition: 'feature',
          onTrue: [{
            type: 'setState',
            payload: { key: 'result', value: 'was-true' },
          }],
          onFalse: [{
            type: 'setState',
            payload: { key: 'result', value: 'was-false' },
          }],
        },
      });

      expect($state.get().result).toBe('was-false');
    });
  });

  describe('UI Action', () => {
    it('should scroll to viewport', async () => {
      const mockScrollTo = vi.fn();
      global.window = { ...global.window, scrollTo: mockScrollTo } as any;

      await dispatcher.dispatch({
        type: 'ui',
        payload: {
          operation: 'scrollTo',
          params: { top: 100, behavior: 'smooth' },
        },
      });

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 100,
        behavior: 'smooth',
      });
    });

    it('should copy to clipboard', async () => {
      const mockClipboard = { writeText: vi.fn().mockResolvedValueOnce(undefined) };
      Object.defineProperty(global, 'navigator', {
        value: { clipboard: mockClipboard },
        writable: true,
        configurable: true,
      });

      await dispatcher.dispatch({
        type: 'ui',
        payload: {
          operation: 'copyToClipboard',
          params: { text: 'Hello World' },
        },
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith('Hello World');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown action type', async () => {
      const action: any = {
        type: 'unknownType',
        payload: {},
      };

      await expect(dispatcher.dispatch(action)).resolves.not.toThrow();
    });
  });
});
