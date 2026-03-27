import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getRestLoadingKey, watchLoadingAction, getLoadingActionState } from './loading';
import { $state } from './state';

describe('loading', () => {
  beforeEach(() => {
    $state.set({});
  });

  describe('getRestLoadingKey', () => {
    it('should return loadingKey if provided', () => {
      expect(getRestLoadingKey('custom-key', 'data')).toBe('custom-key');
    });

    it('should use stateKey if loadingKey is missing', () => {
      expect(getRestLoadingKey(undefined, 'data')).toBe('loading_data');
    });

    it('should default to request if both are missing', () => {
      expect(getRestLoadingKey()).toBe('loading_request');
    });
  });

  describe('watchLoadingAction', () => {
    it('should call callback immediately with initial state', () => {
      const callback = vi.fn();
      const action = { type: 'rest', payload: { stateKey: 'user' } };
      
      watchLoadingAction(action, callback);
      
      expect(callback).toHaveBeenCalledWith({
        isLoading: false,
        values: {},
      });
    });

    it('should update state when monitored key changes', () => {
      const callback = vi.fn();
      const action = { type: 'rest', payload: { stateKey: 'user' } };
      
      watchLoadingAction(action, callback);
      
      // Simulate loading start
      $state.setKey('loading_user', true);
      expect(callback).toHaveBeenLastCalledWith({
        isLoading: true,
        values: {},
      });

      // Simulate loading end and data arrival
      $state.set({
        loading_user: false,
        user: { name: 'Alice' },
      });
      expect(callback).toHaveBeenLastCalledWith({
        isLoading: false,
        values: { user: { name: 'Alice' } },
      });
    });

    it('should work with sequences and conditionals', () => {
      const callback = vi.fn();
      const action = {
        type: 'sequence',
        payload: {
          actions: [
            { type: 'rest', payload: { stateKey: 'a' } },
            { 
              type: 'conditional',
              payload: {
                onTrue: [{ type: 'rest', payload: { stateKey: 'b' } }]
              }
            }
          ]
        }
      };

      watchLoadingAction(action, callback);

      $state.setKey('loading_b', true);
      expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ isLoading: true }));
    });
  });

  describe('getLoadingActionState', () => {
    it('should return current state synchronously', () => {
      $state.set({ loading_request: true, data: 'old' });
      const action = { type: 'rest' };
      
      const state = getLoadingActionState(action);
      expect(state.isLoading).toBe(true);
    });
  });
});
