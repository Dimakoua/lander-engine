import { describe, it, expect, beforeEach } from 'vitest';
import { registry } from '@/core/registry';

describe('Component & Action Registry', () => {
  let testCounter = 0;

  beforeEach(() => {
    testCounter++;
  });

  const uniqueName = (base: string) => `${base}_${testCounter}`;

  describe('Component Registration', () => {
    it('should register a single component', () => {
      const name = uniqueName('test');
      const Component = { name: 'TestComponent' };
      registry.registerComponent(name, Component);
      expect(registry.getComponent(name)).toBe(Component);
    });

    it('should register multiple components', () => {
      const names = [uniqueName('btn'), uniqueName('card'), uniqueName('modal')];
      registry.registerComponent(names[0], { name: 'Button' });
      registry.registerComponent(names[1], { name: 'Card' });
      registry.registerComponent(names[2], { name: 'Modal' });

      expect(registry.getComponent(names[0])).toBeDefined();
      expect(registry.getComponent(names[1])).toBeDefined();
      expect(registry.getComponent(names[2])).toBeDefined();
    });

    it('should return undefined for unregistered', () => {
      expect(registry.getComponent(uniqueName('nonexistent'))).toBeUndefined();
    });
  });

  describe('Action Registration', () => {
    it('should register an action', () => {
      const name = uniqueName('log');
      const handler = () => console.log('action');
      registry.registerAction(name, handler);
      expect(registry.getAction(name)).toBe(handler);
    });

    it('should register multiple actions', () => {
      const base = uniqueName('action');
      registry.registerAction(base + '_1', () => {});
      registry.registerAction(base + '_2', () => {});
      registry.registerAction(base + '_3', () => {});

      expect(registry.getAction(base + '_1')).toBeDefined();
      expect(registry.getAction(base + '_2')).toBeDefined();
      expect(registry.getAction(base + '_3')).toBeDefined();
    });

    it('should return undefined for unregistered action', () => {
      expect(registry.getAction(uniqueName('missing'))).toBeUndefined();
    });
  });

  describe('Registry Isolation', () => {
    it('should isolate components and actions', () => {
      const name = uniqueName('test');
      const comp = { type: 'component' };
      const action = () => {};

      registry.registerComponent(name, comp);
      registry.registerAction(name, action);

      expect(registry.getComponent(name)).toBe(comp);
      expect(registry.getAction(name)).toBe(action);
    });
  });

  describe('Error Handling', () => {
    it('should handle null/undefined values', () => {
      registry.registerComponent(uniqueName('null'), null);
      registry.registerComponent(uniqueName('undef'), undefined);
      expect(registry.getComponent(uniqueName('null'))).toBeNull();
    });

    it('should handle special characters', () => {
      const name = uniqueName('test-name_123');
      registry.registerComponent(name, { test: true });
      expect(registry.getComponent(name)).toBeDefined();
    });
  });
});