import fs from 'fs-extra';
import path from 'path';
import glob from 'fast-glob';
import { 
  FlowConfig, 
  ThemeConfig, 
  LayoutConfig, 
  SEOConfig, 
  StepConfig 
} from '@/types/schema';
import { deepMerge, resolveCascadingConfig, ResolutionParams, DeviceType } from './cascade';

export interface CampaignConfig {
  campaignId: string;
  flow: FlowConfig;
  theme: ThemeConfig;
  layout: LayoutConfig;
  seo: SEOConfig;
  state: Record<string, any>;
  steps: Record<string, StepConfig>;
}

export interface OverrideLoadingMetadata {
  variant?: string;
  device?: string;
  appliedOverrides: {
    device?: boolean;
    variant?: boolean;
    variantDevice?: boolean;
  };
}

export class ConfigParser {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  /**
   * Scans the base directory for campaign folders.
   */
  async getCampaigns(): Promise<string[]> {
    const folders = await glob('*', {
      cwd: this.baseDir,
      onlyDirectories: true,
      deep: 1,
    });
    return folders;
  }

  /**
   * Reads and parses a JSON file with descriptive error handling.
   */
  private async readJson<T>(filePath: string): Promise<T | null> {
    const fullPath = path.resolve(this.baseDir, filePath);
    
    if (!(await fs.pathExists(fullPath))) {
      return null;
    }

    try {
      const content = await fs.readJson(fullPath);
      return content as T;
    } catch (error: any) {
      throw new Error(`Failed to parse JSON at ${filePath}: ${error.message}`);
    }
  }

  /**
   * Loads the base campaign configuration (non-overridden).
   */
  async loadCampaignBase(campaignId: string): Promise<CampaignConfig> {
    const [flow, theme, layout, seo, state] = await Promise.all([
      this.readJson<FlowConfig>(`${campaignId}/flow.json`),
      this.readJson<ThemeConfig>(`${campaignId}/theme.json`),
      this.readJson<LayoutConfig>(`${campaignId}/layout.json`),
      this.readJson<SEOConfig>(`${campaignId}/seo.json`),
      this.readJson<Record<string, any>>(`${campaignId}/state.json`),
    ]);

    if (!flow) throw new Error(`Missing mandatory flow.json for campaign: ${campaignId}`);
    if (!flow.initialStep) throw new Error(`flow.json must have an 'initialStep' for campaign: ${campaignId}`);
    
    if (!theme) throw new Error(`Missing mandatory theme.json for campaign: ${campaignId}`);
    if (!theme.colors) throw new Error(`theme.json must have a 'colors' object for campaign: ${campaignId}`);

    // Load steps
    const stepFiles = await glob(`${campaignId}/steps/*.json`, { cwd: this.baseDir });
    const steps: Record<string, StepConfig> = {};

    for (const stepFile of stepFiles) {
      const stepName = path.basename(stepFile, '.json');
      const stepConfig = await this.readJson<StepConfig>(stepFile);
      if (stepConfig) {
        if (!stepConfig.sections || !Array.isArray(stepConfig.sections)) {
          throw new Error(`Step '${stepName}' in campaign '${campaignId}' must have a 'sections' array.`);
        }
        steps[stepName] = stepConfig;
      }
    }

    if (Object.keys(steps).length === 0) {
      throw new Error(`Campaign '${campaignId}' must have at least one step in the 'steps' directory.`);
    }

    return {
      campaignId,
      flow,
      theme,
      layout: layout || { scripts: [] },
      seo: seo || { title: campaignId },
      state: state || {},
      steps,
    };
  }

  /**
   * Helper to load overrides from a specific sub-folder.
   * @deprecated Use loadCampaignWithOverrides instead for better override handling
   */
  async loadOverrides(campaignId: string, subPath: string): Promise<Partial<CampaignConfig>> {
    const relPath = `${campaignId}/${subPath}`;
    const [flow, theme, layout, seo, state] = await Promise.all([
      this.readJson<Partial<FlowConfig>>(`${relPath}/flow.json`),
      this.readJson<Partial<ThemeConfig>>(`${relPath}/theme.json`),
      this.readJson<Partial<LayoutConfig>>(`${relPath}/layout.json`),
      this.readJson<Partial<SEOConfig>>(`${relPath}/seo.json`),
      this.readJson<Record<string, any>>(`${relPath}/state.json`),
    ]);

    const stepFiles = await glob(`${relPath}/steps/*.json`, { cwd: this.baseDir });
    const steps: Record<string, Partial<StepConfig>> = {};

    for (const stepFile of stepFiles) {
      const stepName = path.basename(stepFile, '.json');
      const stepConfig = await this.readJson<Partial<StepConfig>>(stepFile);
      if (stepConfig) {
        steps[stepName] = stepConfig;
      }
    }

    const overrides: Partial<CampaignConfig> = {};
    if (flow) overrides.flow = flow as FlowConfig;
    if (theme) overrides.theme = theme as ThemeConfig;
    if (layout) overrides.layout = layout as LayoutConfig;
    if (seo) overrides.seo = seo as SEOConfig;
    if (state) overrides.state = state;
    if (Object.keys(steps).length > 0) overrides.steps = steps as Record<string, StepConfig>;

    return overrides;
  }

  /**
   * Loads the base campaign config file with an optional name suffix.
   * Used for loading device/variant specific config files.
   */
  private async loadConfigFile<T>(
    campaignId: string,
    fileName: string,
    fileSuffix?: string
  ): Promise<T | null> {
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const fileWithSuffix = fileSuffix ? `${baseName}${fileSuffix}${ext}` : fileName;
    
    return this.readJson<T>(`${campaignId}/${fileWithSuffix}`);
  }

  /**
   * Loads steps using cascade/override logic.
   * Searches for base steps, then device/variant specific overrides.
   */
  private async loadStepsWithOverrides(
    campaignId: string,
    params: ResolutionParams
  ): Promise<Record<string, StepConfig>> {
    // Load base step files
    const stepFiles = await glob(`${campaignId}/steps/*.json`, { 
      cwd: this.baseDir,
      ignore: ['**/*-*', '**/.*'],
    });

    const steps: Record<string, StepConfig> = {};

    for (const stepFile of stepFiles) {
      const stepName = path.basename(stepFile, '.json');
      let stepConfig = await this.readJson<StepConfig>(stepFile);

      if (!stepConfig) continue;
      if (!stepConfig.sections || !Array.isArray(stepConfig.sections)) {
        throw new Error(`Step '${stepName}' must have a 'sections' array.`);
      }

      // Load and apply device override for this step
      let deviceOverride: Partial<StepConfig> | null = null;
      if (params.device) {
        deviceOverride = await this.readJson<Partial<StepConfig>>(
          `${campaignId}/steps/${stepName}.${params.device}.json`
        );
      }

      // Load and apply variant override for this step
      let variantOverride: Partial<StepConfig> | null = null;
      if (params.variant) {
        variantOverride = await this.readJson<Partial<StepConfig>>(
          `${campaignId}/steps/${stepName}-${params.variant}.json`
        );
      }

      // Load and apply variant+device override for this step
      let variantDeviceOverride: Partial<StepConfig> | null = null;
      if (params.variant && params.device) {
        variantDeviceOverride = await this.readJson<Partial<StepConfig>>(
          `${campaignId}/steps/${stepName}-${params.variant}-${params.device}.json`
        );
      }

      // Apply cascading resolution
      const resolved = resolveCascadingConfig(
        stepConfig,
        deviceOverride || undefined,
        variantOverride || undefined,
        variantDeviceOverride || undefined
      );

      steps[stepName] = resolved;
    }

    if (Object.keys(steps).length === 0) {
      throw new Error(`Campaign '${campaignId}' must have at least one step in the 'steps' directory.`);
    }

    return steps;
  }

  /**
   * Loads a campaign configuration with optional device/variant overrides.
   * 
   * Supports cascading configuration lookup with priority order:
   * 1. Base config (e.g., flow.json)
   * 2. Device override (e.g., flow.desktop.json)
   * 3. Variant override (e.g., flow-beta.json)
   * 4. Variant+Device override (e.g., flow-beta-desktop.json) - highest priority
   * 
   * @param campaignId - Campaign folder name
   * @param params - Optional device/variant parameters
   * @throws Error if mandatory config files are missing
   */
  async loadCampaignWithOverrides(
    campaignId: string,
    params?: ResolutionParams
  ): Promise<{ config: CampaignConfig; metadata: OverrideLoadingMetadata }> {
    // Load base configs
    const [flow, theme, layout, seo, state] = await Promise.all([
      this.readJson<FlowConfig>(`${campaignId}/flow.json`),
      this.readJson<ThemeConfig>(`${campaignId}/theme.json`),
      this.readJson<LayoutConfig>(`${campaignId}/layout.json`),
      this.readJson<SEOConfig>(`${campaignId}/seo.json`),
      this.readJson<Record<string, any>>(`${campaignId}/state.json`),
    ]);

    // Validate mandatory files
    if (!flow) throw new Error(`Missing mandatory flow.json for campaign: ${campaignId}`);
    if (!flow.initialStep) throw new Error(`flow.json must have an 'initialStep' for campaign: ${campaignId}`);
    if (!theme) throw new Error(`Missing mandatory theme.json for campaign: ${campaignId}`);
    if (!theme.colors) throw new Error(`theme.json must have a 'colors' object for campaign: ${campaignId}`);

    const metadata: OverrideLoadingMetadata = {
      variant: params?.variant,
      device: params?.device,
      appliedOverrides: {
        device: false,
        variant: false,
        variantDevice: false,
      },
    };

    let resolvedFlow = flow;
    let resolvedTheme = theme;
    let resolvedLayout = layout || { scripts: [] };
    let resolvedSeo = seo || { title: campaignId };
    let resolvedState = state || {};

    // Apply device overrides if specified
    if (params?.device) {
      const deviceFlow = await this.loadConfigFile<Partial<FlowConfig>>(
        campaignId,
        'flow.json',
        `.${params.device}`
      );
      const deviceTheme = await this.loadConfigFile<Partial<ThemeConfig>>(
        campaignId,
        'theme.json',
        `.${params.device}`
      );
      const deviceLayout = await this.loadConfigFile<Partial<LayoutConfig>>(
        campaignId,
        'layout.json',
        `.${params.device}`
      );
      const deviceSeo = await this.loadConfigFile<Partial<SEOConfig>>(
        campaignId,
        'seo.json',
        `.${params.device}`
      );
      const deviceState = await this.loadConfigFile<Record<string, any>>(
        campaignId,
        'state.json',
        `.${params.device}`
      );

      if (deviceFlow) {
        resolvedFlow = deepMerge(resolvedFlow, deviceFlow);
        metadata.appliedOverrides.device = true;
      }
      if (deviceTheme) {
        resolvedTheme = deepMerge(resolvedTheme, deviceTheme);
      }
      if (deviceLayout) {
        resolvedLayout = deepMerge(resolvedLayout, deviceLayout);
      }
      if (deviceSeo) {
        resolvedSeo = deepMerge(resolvedSeo, deviceSeo);
      }
      if (deviceState) {
        resolvedState = deepMerge(resolvedState, deviceState);
      }
    }

    // Apply variant overrides if specified
    if (params?.variant) {
      const variantFlow = await this.loadConfigFile<Partial<FlowConfig>>(
        campaignId,
        'flow.json',
        `-${params.variant}`
      );
      const variantTheme = await this.loadConfigFile<Partial<ThemeConfig>>(
        campaignId,
        'theme.json',
        `-${params.variant}`
      );
      const variantLayout = await this.loadConfigFile<Partial<LayoutConfig>>(
        campaignId,
        'layout.json',
        `-${params.variant}`
      );
      const variantSeo = await this.loadConfigFile<Partial<SEOConfig>>(
        campaignId,
        'seo.json',
        `-${params.variant}`
      );
      const variantState = await this.loadConfigFile<Record<string, any>>(
        campaignId,
        'state.json',
        `-${params.variant}`
      );

      if (variantFlow) {
        resolvedFlow = deepMerge(resolvedFlow, variantFlow);
        metadata.appliedOverrides.variant = true;
      }
      if (variantTheme) {
        resolvedTheme = deepMerge(resolvedTheme, variantTheme);
      }
      if (variantLayout) {
        resolvedLayout = deepMerge(resolvedLayout, variantLayout);
      }
      if (variantSeo) {
        resolvedSeo = deepMerge(resolvedSeo, variantSeo);
      }
      if (variantState) {
        resolvedState = deepMerge(resolvedState, variantState);
      }
    }

    // Apply variant+device overrides if specified (highest priority)
    if (params?.variant && params?.device) {
      const variantDeviceFlow = await this.loadConfigFile<Partial<FlowConfig>>(
        campaignId,
        'flow.json',
        `-${params.variant}-${params.device}`
      );
      const variantDeviceTheme = await this.loadConfigFile<Partial<ThemeConfig>>(
        campaignId,
        'theme.json',
        `-${params.variant}-${params.device}`
      );
      const variantDeviceLayout = await this.loadConfigFile<Partial<LayoutConfig>>(
        campaignId,
        'layout.json',
        `-${params.variant}-${params.device}`
      );
      const variantDeviceSeo = await this.loadConfigFile<Partial<SEOConfig>>(
        campaignId,
        'seo.json',
        `-${params.variant}-${params.device}`
      );
      const variantDeviceState = await this.loadConfigFile<Record<string, any>>(
        campaignId,
        'state.json',
        `-${params.variant}-${params.device}`
      );

      if (variantDeviceFlow) {
        resolvedFlow = deepMerge(resolvedFlow, variantDeviceFlow);
        metadata.appliedOverrides.variantDevice = true;
      }
      if (variantDeviceTheme) {
        resolvedTheme = deepMerge(resolvedTheme, variantDeviceTheme);
      }
      if (variantDeviceLayout) {
        resolvedLayout = deepMerge(resolvedLayout, variantDeviceLayout);
      }
      if (variantDeviceSeo) {
        resolvedSeo = deepMerge(resolvedSeo, variantDeviceSeo);
      }
      if (variantDeviceState) {
        resolvedState = deepMerge(resolvedState, variantDeviceState);
      }
    }

    // Load steps with cascading overrides
    const steps = await this.loadStepsWithOverrides(campaignId, params || {});

    const config: CampaignConfig = {
      campaignId,
      flow: resolvedFlow,
      theme: resolvedTheme,
      layout: resolvedLayout,
      seo: resolvedSeo,
      state: resolvedState,
      steps,
    };

    return { config, metadata };
  }

  /**
   * Detects available variants for a campaign by scanning directory structure.
   * Looks for files or directories with variant suffixes like "-beta", "-variant-name".
   * 
   * @param campaignId Campaign directory name
   * @returns Array of variant identifiers found
   * 
   * @example
   * // If campaign has: flow.json, flow-beta.json, flow-v2.json, flow-beta-desktop.json
   * // Returns: ['beta', 'v2', 'beta-desktop']
   * // Variants are detected from file suffixes
   */
  async detectVariants(campaignId: string): Promise<string[]> {
    try {
      const campaignPath = path.join(this.baseDir, campaignId);
      if (!(await fs.pathExists(campaignPath))) {
        return [];
      }

      const variants = new Set<string>();

      // Check all JSON files in campaign root for variant patterns
      const jsonFiles = await glob('*.json', { cwd: campaignPath });

      for (const file of jsonFiles) {
        const baseName = path.basename(file, '.json');
        // Look for suffixes like "flow-beta" (after the base name)
        const baseNames = ["flow", "theme", "layout", "seo", "state"];
        
        for (const base of baseNames) {
          if (baseName.startsWith(base + '-')) {
            const suffix = baseName.substring(base.length + 1); // Remove "flow-" prefix
            // Extract variant part (before any device suffix)
            // Example: "beta" from "beta", "beta-mobile" → "beta"
            const variant = suffix.split('-')[0];
            if (variant && !['desktop', 'mobile', 'tablet', 'phone', 'pad'].includes(variant)) {
              variants.add(variant);
            }
          }
        }
      }

      return Array.from(variants).sort();
    } catch (error) {
      console.warn(`Failed to detect variants for campaign '${campaignId}':`, error);
      return [];
    }
  }

  /**
   * Detects available devices for a campaign by scanning file/directory names.
   * Looks for known device suffixes like "-mobile", "-desktop", "-tablet".
   * 
   * @param campaignId Campaign directory name
   * @returns Array of device identifiers found
   * 
   * @example
   * // If campaign has: flow.desktop.json, flow.mobile.json, flow-beta-tablet.json
   * // Returns: ['desktop', 'mobile', 'tablet']
   */
  async detectDevices(campaignId: string): Promise<string[]> {
    try {
      const campaignPath = path.join(this.baseDir, campaignId);
      if (!(await fs.pathExists(campaignPath))) {
        return [];
      }

      const devices = new Set<string>();
      const knownDevices = ['mobile', 'desktop', 'tablet', 'phone', 'pad'];

      // Check all JSON files for device patterns
      const jsonFiles = await glob('*.json', { cwd: campaignPath });

      for (const file of jsonFiles) {
        const baseName = path.basename(file, '.json');
        
        for (const device of knownDevices) {
          // Match patterns like "flow.desktop" or "flow-beta-mobile"
          if (baseName.endsWith(`.${device}`) || baseName.endsWith(`-${device}`)) {
            devices.add(device);
          }
        }
      }

      return Array.from(devices).sort();
    } catch (error) {
      console.warn(`Failed to detect devices for campaign '${campaignId}':`, error);
      return [];
    }
  }

  /**
   * Gets all available variant/device combinations for a campaign.
   * Useful for generating all possible static routes.
   * 
   * @param campaignId Campaign directory name
   * @returns Array of {variant?, device?} combinations
   * 
   * @example
   * // If campaign has variants ['beta', 'v2'] and devices ['mobile', 'desktop']
   * // Returns: 
   * // [
   * //   {},                              (base)
   * //   {device: 'mobile'},
   * //   {device: 'desktop'},
   * //   {variant: 'beta'},
   * //   {variant: 'beta', device: 'mobile'},
   * //   {variant: 'beta', device: 'desktop'},
   * //   ... etc
   * // ]
   */
  async getVariantDeviceCombinations(campaignId: string): Promise<ResolutionParams[]> {
    const variants = await this.detectVariants(campaignId);
    const devices = await this.detectDevices(campaignId);

    const combinations: ResolutionParams[] = [
      {}, // Base with no overrides
    ];

    // Add device-only combinations
    for (const device of devices) {
      combinations.push({ device });
    }

    // Add variant-only combinations
    for (const variant of variants) {
      combinations.push({ variant });
    }

    // Add variant+device combinations
    for (const variant of variants) {
      for (const device of devices) {
        combinations.push({ variant, device });
      }
    }

    return combinations;
  }
}
