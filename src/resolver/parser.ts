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

export interface CampaignConfig {
  campaignId: string;
  flow: FlowConfig;
  theme: ThemeConfig;
  layout: LayoutConfig;
  seo: SEOConfig;
  state: Record<string, any>;
  steps: Record<string, StepConfig>;
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
   * Scans for A/B variant subdirectories within a campaign.
   * Variants are any subdirectories that are not reserved names ('mobile', 'steps').
   */
  async getVariants(campaignId: string): Promise<string[]> {
    const campaignPath = path.join(this.baseDir, campaignId);
    const folders = await glob('*', {
      cwd: campaignPath,
      onlyDirectories: true,
      deep: 1,
    });
    const reserved = new Set(['mobile', 'steps']);
    return folders.filter(folder => !reserved.has(folder) && !folder.startsWith('.'));
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
}
