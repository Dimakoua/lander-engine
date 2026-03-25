/**
 * Simple deep merge utility for JSON objects.
 * Prioritizes properties from the 'source' object.
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
        result[key] = deepMerge(
          (targetValue && typeof targetValue === 'object' ? targetValue : {}) as any,
          sourceValue
        );
      } else {
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}

/**
 * Resolves the final configuration by applying overrides in priority order.
 * Priority: Base < Device < Variant < Variant+Device
 */
export function resolveCascadingConfig<T extends Record<string, any>>(
  base: T,
  deviceOverride?: Partial<T>,
  variantOverride?: Partial<T>,
  variantDeviceOverride?: Partial<T>
): T {
  let resolved = { ...base };

  if (deviceOverride) {
    resolved = deepMerge(resolved, deviceOverride);
  }

  if (variantOverride) {
    resolved = deepMerge(resolved, variantOverride);
  }

  if (variantDeviceOverride) {
    resolved = deepMerge(resolved, variantDeviceOverride);
  }

  return resolved;
}
