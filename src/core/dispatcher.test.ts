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

  it('should resolve internal URLs correctly', async () => {
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
        type: 'step',
      },
    });

    // The dispatcher should navigate to /campaign-a/step-2.v1.mobile
    expect((window as any).__landerNavigate).toHaveBeenCalledWith('/campaign-a/step-2.v1.mobile');
  });
});
