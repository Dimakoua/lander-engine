import type { TelemetryConfig, TelemetryEvent, TelemetryEventType } from '../types/telemetry';

export class TelemetryManager {
  private config: TelemetryConfig | null = null;
  private lastViewStepTarget: string | null = null;
  private lastViewStepTimestamp: number = 0;

  setConfig(config: TelemetryConfig) {
    this.config = config;
  }

  track(name: TelemetryEventType, payload?: Record<string, any>) {
    if (!this.config) return;

    // Deduplication logic for view_step
    if (name === 'view_step') {
      const target = payload?.path || '';
      const now = Date.now();

      // If same step triggered within 1000ms, ignore it
      if (this.lastViewStepTarget === target && (now - this.lastViewStepTimestamp) < 1000) {
        return;
      }

      this.lastViewStepTarget = target;
      this.lastViewStepTimestamp = now;
    }

    // Extract basic information from URL if possible
    let campaignId = '';
    let stepId = '';

    try {
        const pathParts = window.location.pathname.replace(/^\//, '').split('/').filter(Boolean);
        if (pathParts.length > 0) {
            campaignId = pathParts[0];
            stepId = pathParts[1] || '';
        }
    } catch (e) {
        // window might not be available in some environments
    }

    // Check if campaignId was explicitly provided in payload and override
    if (payload?.campaignId) {
        campaignId = payload.campaignId;
    }

    const event: TelemetryEvent = {
      name,
      campaignId,
      stepId,
      payload,
      timestamp: Date.now(),
    };

    // Dispatch asynchronously to avoid blocking the main thread
    Promise.resolve().then(() => {
      this.dispatchToAdapters(event);
    }).catch((err) => {
        console.error('Telemetry tracking failed', err);
    });
  }

  private dispatchToAdapters(event: TelemetryEvent) {
    if (!this.config) return;

    // GA4 Adapter
    if (this.config.ga4?.measurementId) {
      try {
        const win = window as any;
        if (typeof win.gtag === 'function') {
          win.gtag('event', event.name, {
              ...event.payload,
              campaign_id: event.campaignId,
              step_id: event.stepId
          });
        }
      } catch (err) {
        // Graceful failure
      }
    }

    // Meta Pixel Adapter
    if (this.config.metaPixel?.pixelId) {
      try {
        const win = window as any;
        if (typeof win.fbq === 'function') {
          // Standard events mapping or custom track
          win.fbq('trackCustom', event.name, {
            ...event.payload,
            campaignId: event.campaignId,
            stepId: event.stepId
          });
        }
      } catch (err) {
        // Graceful failure
      }
    }

    // PostHog Adapter
    if (this.config.posthog?.apiKey) {
      try {
        const win = window as any;
        if (win.posthog && typeof win.posthog.capture === 'function') {
          win.posthog.capture(event.name, {
              ...event.payload,
              campaignId: event.campaignId,
              stepId: event.stepId
          });
        }
      } catch (err) {
        // Graceful failure
      }
    }

    // Webhook Adapter
    if (this.config.webhook?.endpoint) {
      try {
        fetch(this.config.webhook.endpoint, {
          method: 'POST',
          keepalive: true, // Important for tracking events before navigation
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.webhook.headers || {})
          },
          body: JSON.stringify(event)
        }).catch(() => {
            // ignore network errors silently
        });
      } catch (err) {
        // Graceful failure
      }
    }
  }
}

export const telemetry = new TelemetryManager();
