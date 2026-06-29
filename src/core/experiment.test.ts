import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { selectVariant, VariantAllocationConfig } from './experiment';

describe('selectVariant', () => {
  const campaignId = 'test-campaign';

  beforeEach(() => {
    // Mock window and document
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      location: {
        search: ''
      }
    });
    vi.stubGlobal('document', {
      cookie: '',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return null if variants array is empty', () => {
    expect(selectVariant(campaignId, [])).toBeNull();
  });

  it('should default to uniform random selection if no config provided', () => {
    const variants = ['a', 'b', 'c'];
    const result = selectVariant(campaignId, variants);
    expect(variants).toContain(result);
  });

  it('should respect weighted distribution', () => {
    const variants = ['control', 'variant_b'];
    const allocation: VariantAllocationConfig = {
      strategy: 'weighted',
      trafficSplit: { control: 70, variant_b: 30 },
      sticky: false
    };

    let controlCount = 0;
    const iterations = 1000;

    // Stub storage to simulate fresh visits
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
      },
      location: {
        search: ''
      }
    });

    for (let i = 0; i < iterations; i++) {
      if (selectVariant(campaignId, variants, allocation) === 'control') {
        controlCount++;
      }
    }

    const controlRatio = controlCount / iterations;
    expect(controlRatio).toBeGreaterThan(0.6);
    expect(controlRatio).toBeLessThan(0.8);
  });

  it('should normalize unbalanced weights', () => {
    const variants = ['a', 'b'];
    const allocation: VariantAllocationConfig = {
      strategy: 'weighted',
      trafficSplit: { a: 10, b: 10 }, // Sums to 20, should be 50/50
      sticky: false
    };

    let aCount = 0;
    const iterations = 1000;

    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
      },
      location: {
        search: ''
      }
    });

    for (let i = 0; i < iterations; i++) {
      if (selectVariant(campaignId, variants, allocation) === 'a') {
        aCount++;
      }
    }

    const aRatio = aCount / iterations;
    expect(aRatio).toBeGreaterThan(0.4);
    expect(aRatio).toBeLessThan(0.6);
  });

  it('should load variant from sessionStorage if sticky', () => {
    const variants = ['a', 'b'];
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn().mockReturnValue('b'),
        setItem: vi.fn(),
      },
      location: {
        search: ''
      }
    });

    const result = selectVariant(campaignId, variants);
    expect(result).toBe('b');
  });

  it('should load variant from cookies if sticky and not in sessionStorage', () => {
    const variants = ['a', 'b'];
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
      },
      location: {
        search: ''
      }
    });
    vi.stubGlobal('document', {
      cookie: `lander_variant_${campaignId}=a; other=cookie`,
    });

    const result = selectVariant(campaignId, variants);
    expect(result).toBe('a');
  });

  it('should persist selected variant to storage if sticky', () => {
    const variants = ['a'];
    const setItemMock = vi.fn();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: setItemMock,
      },
      location: {
        search: ''
      }
    });

    const doc: any = { cookie: '' };
    vi.stubGlobal('document', doc);

    selectVariant(campaignId, variants);

    expect(setItemMock).toHaveBeenCalledWith(`lander_variant_${campaignId}`, 'a');
    expect(doc.cookie).toContain(`lander_variant_${campaignId}=a`);
  });

  it('should fallback to basic bandit selection', () => {
    const variants = ['a', 'b'];
    const allocation: VariantAllocationConfig = {
      strategy: 'bandit'
    };

    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
      },
      location: {
        search: ''
      }
    });

    const result = selectVariant(campaignId, variants, allocation);
    expect(variants).toContain(result);
  });
});
