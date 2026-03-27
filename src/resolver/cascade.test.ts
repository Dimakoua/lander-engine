import { describe, it, expect } from 'vitest';
import { deepMerge, resolveCascadingConfig } from './cascade';

describe('deepMerge', () => {
  it('should merge two simple objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const expected = { a: 1, b: 3, c: 4 };
    expect(deepMerge(target, source)).toEqual(expected);
  });

  it('should deeply merge objects', () => {
    const target = {
      a: 1,
      b: { b1: 1, b2: 2 },
    };
    const source = {
      b: { b2: 3, b3: 4 },
      c: 5,
    };
    const expected = {
      a: 1,
      b: { b1: 1, b2: 3, b3: 4 },
      c: 5,
    };
    expect(deepMerge(target, source)).toEqual(expected);
  });

  it('should not merge arrays (treat them as primitives)', () => {
    const target = { a: [1, 2] };
    const source = { a: [3, 4] };
    const expected = { a: [3, 4] };
    expect(deepMerge(target, source)).toEqual(expected);
  });

  it('should handle null values in source', () => {
    const target = { a: { b: 1 } };
    const source = { a: null as any };
    const expected = { a: null };
    expect(deepMerge(target, source)).toEqual(expected);
  });

  it('should handle non-object values in target when source is an object', () => {
    const target = { a: 1 };
    const source = { a: { b: 2 } };
    const expected = { a: { b: 2 } };
    expect(deepMerge(target as any, source as any)).toEqual(expected);
  });
});

describe('resolveCascadingConfig', () => {
  const base = {
    title: 'Default Title',
    theme: {
      primary: 'blue',
      secondary: 'gray',
    },
    showFooter: true,
  };

  it('should return base config when no overrides are provided', () => {
    expect(resolveCascadingConfig(base)).toEqual(base);
  });

  it('should apply device override', () => {
    const deviceOverride = {
      theme: { primary: 'red' },
    };
    const result = resolveCascadingConfig(base, deviceOverride);
    expect(result.theme.primary).toBe('red');
    expect(result.theme.secondary).toBe('gray');
    expect(result.title).toBe('Default Title');
  });

  it('should apply variant override with higher priority than device', () => {
    const deviceOverride = {
      theme: { primary: 'red' },
      showFooter: false,
    };
    const variantOverride = {
      theme: { primary: 'green' },
    };
    const result = resolveCascadingConfig(base, deviceOverride, variantOverride);
    expect(result.theme.primary).toBe('green');
    expect(result.showFooter).toBe(false);
  });

  it('should apply variant-device override with highest priority', () => {
    const deviceOverride = { title: 'Device Title' };
    const variantOverride = { title: 'Variant Title' };
    const variantDeviceOverride = { title: 'Variant Device Title' };
    const result = resolveCascadingConfig(base, deviceOverride, variantOverride, variantDeviceOverride);
    expect(result.title).toBe('Variant Device Title');
  });
});
