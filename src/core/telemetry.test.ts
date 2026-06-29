import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TelemetryManager } from './telemetry';

describe('TelemetryManager', () => {
  let telemetry: TelemetryManager;

  beforeEach(() => {
    telemetry = new TelemetryManager();
    // Reset window mock for tracking APIs
    if (typeof window === 'undefined') {
        global.window = {} as any;
    }
    (window as any).gtag = vi.fn();
    (window as any).fbq = vi.fn();
    (window as any).posthog = { capture: vi.fn() };
    global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as any;

    // Default config
    telemetry.setConfig({
      ga4: { measurementId: 'G-123' },
      metaPixel: { pixelId: 'P-123' },
      posthog: { apiKey: 'PH-123' },
      webhook: { endpoint: 'https://example.com/track' }
    });
  });

  it('does nothing if config is not set', async () => {
    telemetry.setConfig(null as any);
    telemetry.track('view_step');
    await new Promise(resolve => setTimeout(resolve, 0)); // wait for promise

    expect((window as any).gtag).not.toHaveBeenCalled();
    expect((window as any).fbq).not.toHaveBeenCalled();
    expect((window as any).posthog.capture).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('dispatches to ga4 correctly', async () => {
    telemetry.track('click_cta', { ctaName: 'Buy Now' });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'click_cta',
      expect.objectContaining({ ctaName: 'Buy Now' })
    );
  });

  it('dispatches to metaPixel correctly', async () => {
    telemetry.track('submit_lead', { email: 'test@example.com' });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect((window as any).fbq).toHaveBeenCalledWith(
      'trackCustom',
      'submit_lead',
      expect.objectContaining({ email: 'test@example.com' })
    );
  });

  it('dispatches to posthog correctly', async () => {
    telemetry.track('open_modal', { popupId: 'login' });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect((window as any).posthog.capture).toHaveBeenCalledWith(
      'open_modal',
      expect.objectContaining({ popupId: 'login' })
    );
  });

  it('dispatches to webhook correctly', async () => {
    telemetry.track('variant_assigned', { variant: 'B' });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/track',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
        body: expect.stringContaining('"variant":"B"')
      })
    );
  });

  it('fails gracefully when an adapter throws an error', async () => {
    (window as any).gtag = () => { throw new Error('Blocked by adblocker'); };

    // Should not throw out of the track method
    expect(() => telemetry.track('click_cta')).not.toThrow();

    await new Promise(resolve => setTimeout(resolve, 0));

    // Other adapters should still have run successfully
    expect((window as any).fbq).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('deduplicates view_step events within timeframe', async () => {
    telemetry.track('view_step', { path: '/home' });
    telemetry.track('view_step', { path: '/home' }); // should be deduplicated
    telemetry.track('view_step', { path: '/about' }); // should NOT be deduplicated

    await new Promise(resolve => setTimeout(resolve, 0));

    // Wait and track again
    await new Promise(resolve => setTimeout(resolve, 1050));
    telemetry.track('view_step', { path: '/home' }); // should NOT be deduplicated

    await new Promise(resolve => setTimeout(resolve, 0));

    expect((global.fetch as any).mock.calls.length).toBe(3);
  });
});
