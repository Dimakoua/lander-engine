export type TelemetryEventType = 'view_step' | 'click_cta' | 'submit_lead' | 'open_modal' | 'variant_assigned' | 'custom';

export interface TelemetryEvent {
  name: TelemetryEventType;
  campaignId: string;
  stepId?: string;
  variantId?: string;
  payload?: Record<string, any>;
  timestamp: number;
}

export interface TelemetryConfig {
  ga4?: { measurementId: string };
  metaPixel?: { pixelId: string };
  posthog?: { apiKey: string; apiHost?: string };
  webhook?: { endpoint: string; headers?: Record<string, string> };
}
