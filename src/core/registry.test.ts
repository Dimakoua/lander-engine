import { describe, it, expect, beforeEach } from 'vitest';
import { registry } from './registry';

describe('registry', () => {
  beforeEach(() => {
    // Registry is a singleton, so we might need to reset it or be careful with tests
    // For simplicity, let's use unique names
  });

  it('should register and retrieve a component', () => {
    const mockComponent = { type: 'test' };
    registry.registerComponent('TestComponent', mockComponent);
    expect(registry.getComponent('TestComponent')).toBe(mockComponent);
  });

  it('should register and retrieve multiple components', () => {
    const components = {
      CompA: { a: 1 },
      CompB: { b: 2 },
    };
    registry.registerComponents(components);
    expect(registry.getComponent('CompA')).toEqual(components.CompA);
    expect(registry.getComponent('CompB')).toEqual(components.CompB);
  });

  it('should register and retrieve an action', () => {
    const handler = () => {};
    registry.registerAction('customAction', handler);
    expect(registry.getAction('customAction')).toBe(handler);
  });

  it('should register and retrieve multiple actions', () => {
    const actions = {
      act1: () => {},
      act2: () => {},
    };
    registry.registerActions(actions);
    expect(registry.getAction('act1')).toBe(actions.act1);
    expect(registry.getAction('act2')).toBe(actions.act2);
  });

  it('should return all components and actions', () => {
    const comp = { c: 1 };
    const act = () => {};
    registry.registerComponent('OneComp', comp);
    registry.registerAction('OneAct', act);
    
    expect(registry.getAllComponents()).toHaveProperty('OneComp', comp);
    expect(registry.getAllActions()).toHaveProperty('OneAct', act);
  });
});
