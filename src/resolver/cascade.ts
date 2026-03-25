/**
 * Supported device types for targeting
 */
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | string;

/**
 * Configuration parameters for resolution
 */
export interface ResolutionParams {
  device?: DeviceType; // Target device (e.g., "desktop", "mobile")
  variant?: string; // A/B test variant ID (e.g., "beta", "v2")
  autoDetect?: boolean; // Auto-detect device if not specified (default: true)
}

/**
 * Device detection options
 */
export interface DeviceDetectionOptions {
  userAgent?: string; // User-Agent header for server-side detection
  viewportWidth?: number; // Viewport width for client-side detection
  mobileBreakpoint?: number; // Width threshold for mobile (default: 768)
  tabletBreakpoint?: number; // Width threshold for tablet (default: 1024)
}

/**
 * Detects device type from User-Agent header (server-side detection).
 * Uses common mobile and tablet User-Agent patterns.
 */
export function detectDeviceFromUserAgent(userAgent: string): DeviceType {
  // Normalize to lowercase for comparison
  const ua = userAgent.toLowerCase();

  // Tablet detection (must check before mobile as iPads contain 'mobile' in UA)
  const isTablet = /ipad|android(?!.*mobile)|tablet|playbook|silk/.test(ua);
  if (isTablet) return 'tablet';

  // Mobile detection
  const isMobile = /mobile|android|iphone|ipod|blackberry|opera mini|windows phone/.test(ua);
  if (isMobile) return 'mobile';

  // Default to desktop
  return 'desktop';
}

/**
 * Detects device type from viewport width (client-side detection).
 * Useful for runtime detection in browsers.
 */
export function detectDeviceFromViewport(
  viewportWidth: number,
  options?: { mobileBreakpoint?: number; tabletBreakpoint?: number }
): DeviceType {
  const mobileBreakpoint = options?.mobileBreakpoint ?? 768;
  const tabletBreakpoint = options?.tabletBreakpoint ?? 1024;

  if (viewportWidth < mobileBreakpoint) {
    return 'mobile';
  } else if (viewportWidth < tabletBreakpoint) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Auto-detects the device type based on available context.
 * Tries User-Agent first (server-side), falls back to viewport (client-side),
 * or defaults to desktop if no detection context available.
 */
export function autoDetectDevice(options?: DeviceDetectionOptions): DeviceType {
  // Try User-Agent detection first
  if (options?.userAgent) {
    return detectDeviceFromUserAgent(options.userAgent);
  }

  // Try viewport detection
  if (options?.viewportWidth !== undefined) {
    return detectDeviceFromViewport(options.viewportWidth, {
      mobileBreakpoint: options.mobileBreakpoint,
      tabletBreakpoint: options.tabletBreakpoint,
    });
  }

  // Browser-side fallback: check window object (if in browser context)
  if (typeof window !== 'undefined' && window.innerWidth) {
    return detectDeviceFromViewport(window.innerWidth, {
      mobileBreakpoint: options?.mobileBreakpoint,
      tabletBreakpoint: options?.tabletBreakpoint,
    });
  }

  // Default to desktop
  return 'desktop';
}

/**
 * Simple deep merge utility for JSON objects.
 * Prioritizes properties from the 'source' object.
 * Arrays are replaced, not merged.
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        sourceValue !== null
      ) {
        // Recursively merge nested objects
        result[key] = deepMerge(
          (targetValue && typeof targetValue === 'object' ? targetValue : {}) as any,
          sourceValue
        );
      } else {
        // Replace with source value (including arrays)
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}

/**
 * Resolves the final device from parameters and auto-detection.
 * Returns the device type, handling auto-detection when enabled.
 */
export function resolveDevice(
  params?: ResolutionParams,
  detectionOptions?: DeviceDetectionOptions
): DeviceType | undefined {
  // If device is explicitly specified, use it
  if (params?.device) {
    return params.device;
  }

  // If auto-detection is enabled (default: true) or explicitly requested
  const autoDetect = params?.autoDetect !== false;
  if (autoDetect) {
    return autoDetectDevice(detectionOptions);
  }

  return undefined;
}

/**
 * Resolves the final configuration by applying overrides in priority order.
 *
 * Priority order (lowest to highest):
 * 1. Base config
 * 2. Device override (e.g., desktop-specific)
 * 3. Variant override (e.g., A/B test variant)
 * 4. Variant+Device override (highest priority, combines both)
 *
 * Supports auto-detection if device is not explicitly specified.
 */
export function resolveCascadingConfig<T extends Record<string, any>>(
  base: T,
  deviceOverride?: Partial<T>,
  variantOverride?: Partial<T>,
  variantDeviceOverride?: Partial<T>
): T {
  let resolved = { ...base };

  // Apply device override (lower priority)
  if (deviceOverride) {
    resolved = deepMerge(resolved, deviceOverride);
  }

  // Apply variant override (medium priority)
  if (variantOverride) {
    resolved = deepMerge(resolved, variantOverride);
  }

  // Apply variant+device override (highest priority)
  if (variantDeviceOverride) {
    resolved = deepMerge(resolved, variantDeviceOverride);
  }

  return resolved;
}

/**
 * Helper function to determine which override files would be checked.
 * Useful for validation and logging.
 *
 * For example, with variant="beta" and device="desktop":
 * - filename-beta.json (variant-only)
 * - filename-beta-desktop.json (variant+device)
 */
export function getOverridePaths(
  baseFileName: string,
  params: ResolutionParams
): { device?: string; variant?: string; variantDevice?: string } {
  const result: { device?: string; variant?: string; variantDevice?: string } = {};
  const baseName = baseFileName.replace(/\.json$/i, '');

  // Generate device override path
  if (params.device) {
    result.device = `${baseName}-${params.device}.json`;
  }

  // Generate variant override path
  if (params.variant) {
    result.variant = `${baseName}-${params.variant}.json`;
  }

  // Generate variant+device override path (highest priority)
  if (params.variant && params.device) {
    result.variantDevice = `${baseName}-${params.variant}-${params.device}.json`;
  }

  return result;
}
