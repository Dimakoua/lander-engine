// src/resolver/cascade.ts
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue) && sourceValue !== null) {
        result[key] = deepMerge(
          targetValue && typeof targetValue === "object" ? targetValue : {},
          sourceValue
        );
      } else {
        result[key] = sourceValue;
      }
    }
  }
  return result;
}
function resolveCascadingConfig(base, deviceOverride, variantOverride, variantDeviceOverride) {
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

// src/resolver/parser.ts
import fs from "fs-extra";
import path from "path";
import glob from "fast-glob";
var ConfigParser = class {
  baseDir;
  constructor(baseDir) {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }
  /**
   * Scans the base directory for campaign folders.
   */
  async getCampaigns() {
    const folders = await glob("*", {
      cwd: this.baseDir,
      onlyDirectories: true,
      deep: 1
    });
    return folders;
  }
  /**
   * Reads and parses a JSON file with descriptive error handling.
   */
  async readJson(filePath) {
    const fullPath = path.resolve(this.baseDir, filePath);
    if (!await fs.pathExists(fullPath)) {
      return null;
    }
    try {
      const content = await fs.readJson(fullPath);
      return content;
    } catch (error) {
      throw new Error(`Failed to parse JSON at ${filePath}: ${error.message}`);
    }
  }
  /**
   * Loads the base campaign configuration (non-overridden).
   */
  async loadCampaignBase(campaignId) {
    const [flow, theme, layout, seo, state] = await Promise.all([
      this.readJson(`${campaignId}/flow.json`),
      this.readJson(`${campaignId}/theme.json`),
      this.readJson(`${campaignId}/layout.json`),
      this.readJson(`${campaignId}/seo.json`),
      this.readJson(`${campaignId}/state.json`)
    ]);
    if (!flow) throw new Error(`Missing mandatory flow.json for campaign: ${campaignId}`);
    if (!flow.initialStep) throw new Error(`flow.json must have an 'initialStep' for campaign: ${campaignId}`);
    if (!theme) throw new Error(`Missing mandatory theme.json for campaign: ${campaignId}`);
    if (!theme.colors) throw new Error(`theme.json must have a 'colors' object for campaign: ${campaignId}`);
    const stepFiles = await glob(`${campaignId}/steps/*.json`, { cwd: this.baseDir });
    const steps = {};
    for (const stepFile of stepFiles) {
      const stepName = path.basename(stepFile, ".json");
      const stepConfig = await this.readJson(stepFile);
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
      steps
    };
  }
  /**
   * Helper to load overrides from a specific sub-folder.
   */
  async loadOverrides(campaignId, subPath) {
    const relPath = `${campaignId}/${subPath}`;
    const [flow, theme, layout, seo, state] = await Promise.all([
      this.readJson(`${relPath}/flow.json`),
      this.readJson(`${relPath}/theme.json`),
      this.readJson(`${relPath}/layout.json`),
      this.readJson(`${relPath}/seo.json`),
      this.readJson(`${relPath}/state.json`)
    ]);
    const stepFiles = await glob(`${relPath}/steps/*.json`, { cwd: this.baseDir });
    const steps = {};
    for (const stepFile of stepFiles) {
      const stepName = path.basename(stepFile, ".json");
      const stepConfig = await this.readJson(stepFile);
      if (stepConfig) {
        steps[stepName] = stepConfig;
      }
    }
    const overrides = {};
    if (flow) overrides.flow = flow;
    if (theme) overrides.theme = theme;
    if (layout) overrides.layout = layout;
    if (seo) overrides.seo = seo;
    if (state) overrides.state = state;
    if (Object.keys(steps).length > 0) overrides.steps = steps;
    return overrides;
  }
};

export {
  deepMerge,
  resolveCascadingConfig,
  ConfigParser
};
//# sourceMappingURL=chunk-T2PFPONB.js.map