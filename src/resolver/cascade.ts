/**
 * Supported device types for targeting
 */
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | string;

/**
 * Configuration parameters for resolution
 */
export interface ResolutionParams {
  device?: DeviceType;  // Target device (e.g., "desktop", "mobile")
  variant?: string;     // A/B test variant ID (e.g., "beta", "v2")
}

/**
 * Simple deep merge utility for JSON objects.
 * Prioritizes properties from the 'source' object.
 * Arrays are replaced, not merged.
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
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
 * Resolves the final configuration by applying overrides in priority order.
 * 
 * Priority order (lowest to highest):
 * 1. Base config
 * 2. Device override (e.g., desktop-specific)
 * 3. Variant override (e.g., A/B test variant)
 * 4. Variant+Device override (highest priority, combines both)
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
