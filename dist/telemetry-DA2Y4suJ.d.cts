type TelemetryEventType = 'view_step' | 'click_cta' | 'submit_lead' | 'open_modal' | 'variant_assigned' | 'custom';
interface TelemetryConfig {
    ga4?: {
        measurementId: string;
    };
    metaPixel?: {
        pixelId: string;
    };
    posthog?: {
        apiKey: string;
        apiHost?: string;
    };
    webhook?: {
        endpoint: string;
        headers?: Record<string, string>;
    };
}

export type { TelemetryConfig as T, TelemetryEventType as a };
