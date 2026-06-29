import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { dispatcher } from './dispatcher';
import { $state, getState } from './state';

describe('ActionDispatcher', () => {
  beforeEach(() => {
    $state.set({});
    
    // Mock global objects
    global.window = {
      location: {
        pathname: '/',
        href: 'http://localhost/',
        replace: vi.fn(),
      },
      __landerCampaignConfigs: {},
      __landerNavigate: vi.fn(),
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      }
    } as any;

    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    } as any;

    global.navigator = {
      userAgent: 'Mozilla/5.0',
    } as any;

    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should dispatch setState action', async () => {
    await dispatcher.dispatch({
      type: 'setState',
      payload: { key: 'foo', value: 'bar' },
    });
    expect(getState('foo')).toBe('bar');
  });

  it('should dispatch toggleState action', async () => {
    $state.set({ active: false });
    await dispatcher.dispatch({
      type: 'toggleState',
      payload: { key: 'active' },
    });
    expect(getState('active')).toBe(true);
  });

  it('should dispatch sequence of actions', async () => {
    await dispatcher.dispatch({
      type: 'sequence',
      payload: {
        actions: [
          { type: 'setState', payload: { key: 'a', value: 1 } },
          { type: 'setState', payload: { key: 'b', value: 2 } },
        ],
      },
    });
    expect(getState('a')).toBe(1);
    expect(getState('b')).toBe(2);
  });

  it('should dispatch conditional action (true case)', async () => {
    $state.set({ flag: true });
    await dispatcher.dispatch({
      type: 'conditional',
      payload: {
        condition: 'flag',
        onTrue: { type: 'setState', payload: { key: 'result', value: 'yes' } },
        onFalse: { type: 'setState', payload: { key: 'result', value: 'no' } },
      },
    });
    expect(getState('result')).toBe('yes');
  });

  it('should dispatch conditional action (false case)', async () => {
    $state.set({ flag: false });
    await dispatcher.dispatch({
      type: 'conditional',
      payload: {
        condition: 'flag',
        onTrue: { type: 'setState', payload: { key: 'result', value: 'yes' } },
        onFalse: { type: 'setState', payload: { key: 'result', value: 'no' } },
      },
    });
    expect(getState('result')).toBe('no');
  });

  it('should handle REST actions', async () => {
    const mockData = { id: 123 };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    await dispatcher.dispatch({
      type: 'rest',
      payload: {
        url: 'https://api.example.com/data',
        stateKey: 'apiData',
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({ method: 'GET' })
    );
    expect(getState('apiData')).toEqual(mockData);
    expect(getState('loading_apiData')).toBe(false);
  });

  it('should resolve internal URLs correctly without basePath configured (fallback)', async () => {
    window.location.pathname = '/campaign-a/step-1';
    (window as any).__landerCampaignConfigs = {
      'campaign-a': {
        variants: ['v1', 'v2'],
        hasMobileRoute: true,
      }
    };
    (localStorage.getItem as any).mockReturnValue('v1');
    (navigator as any).userAgent = 'iPhone';

    // Mock resolveInternalUrl indirectly through navigation action
    await dispatcher.dispatch({
      type: 'navigation',
      payload: {
        to: 'step-2',
        operation: 'step',
      },
    });

    // The dispatcher should navigate to /campaign-a/step-2.v1.mobile
    expect((window as any).__landerNavigate).toHaveBeenCalledWith('/campaign-a/step-2.v1.mobile');
  });

  it('should resolve internal URLs correctly with root basePath (/) and operation', async () => {
    window.location.pathname = '/step-1';
    (window as any).__landerBasePath = '/';
    (window as any).__landerCampaignConfigs = {
      'campaign-a': { // Root campaigns won't pass campaignId explicitly through path
        variants: ['v1', 'v2'],
        hasMobileRoute: true,
      }
    };
    // Mock the external resolve function that would be loaded on root paths
    (window as any).__landerResolveUrl = vi.fn().mockReturnValue('/step-2.v1.mobile');

    (localStorage.getItem as any).mockReturnValue('v1');
    (navigator as any).userAgent = 'iPhone';

    await dispatcher.dispatch({
      type: 'navigation',
      payload: {
        to: 'step-2',
        operation: 'step',
      },
    });

    // The dispatcher should navigate to /step-2.v1.mobile
    expect((window as any).__landerResolveUrl).toHaveBeenCalledWith('/step-2');
    expect((window as any).__landerNavigate).toHaveBeenCalledWith('/step-2.v1.mobile');
  });

  it('should support legacy deprecated type property as fallback in navigation action', async () => {
    window.location.pathname = '/step-1';
    (window as any).__landerBasePath = '/';
    (window as any).__landerCampaignConfigs = {
      'campaign-a': {
        variants: ['v1', 'v2'],
        hasMobileRoute: true,
      }
    };
    (window as any).__landerResolveUrl = vi.fn().mockReturnValue('/step-2.v1.mobile');

    await dispatcher.dispatch({
      type: 'navigation',
      payload: {
        to: 'step-2',
        type: 'step',
      },
    });

    expect((window as any).__landerNavigate).toHaveBeenCalledWith('/step-2.v1.mobile');
  });

  it('should default operation to step if neither operation nor type is specified', async () => {
    window.location.pathname = '/step-1';
    (window as any).__landerBasePath = '/';
    (window as any).__landerCampaignConfigs = {
      'campaign-a': {
        variants: ['v1', 'v2'],
        hasMobileRoute: true,
      }
    };
    (window as any).__landerResolveUrl = vi.fn().mockReturnValue('/step-2.v1.mobile');

    await dispatcher.dispatch({
      type: 'navigation',
      payload: {
        to: 'step-2',
      } as any,
    });

    expect((window as any).__landerNavigate).toHaveBeenCalledWith('/step-2.v1.mobile');
  });

  it('should resolve internal URLs correctly with custom basePath', async () => {
    window.location.pathname = '/welcome/step-1';
    (window as any).__landerBasePath = '/welcome';
    (window as any).__landerCampaignConfigs = {
      'campaign-a': {
        variants: [],
        hasMobileRoute: false,
      }
    };
    // Providing a custom resolve fallback for the dispatcher manually
    (window as any).__landerResolveUrl = vi.fn().mockReturnValue('/welcome/step-2');

    await dispatcher.dispatch({
      type: 'navigation',
      payload: {
        to: 'step-2',
        operation: 'step',
      },
    });

    expect((window as any).__landerResolveUrl).toHaveBeenCalledWith('/welcome/step-2');
    expect((window as any).__landerNavigate).toHaveBeenCalledWith('/welcome/step-2');
  });
});
