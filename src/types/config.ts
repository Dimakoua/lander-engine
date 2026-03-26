/**
 * Maps domain names to campaign IDs.
 * Defined in `routing.config.js` in the project root.
 *
 * @example
 * { "campaign-a.com": "campaign_alpha", "campaign-b.com": "campaign_beta" }
 */
export type RoutingConfig = Record<string, string>;

export interface LanderPlugin {
  name: string;
  onBeforeBuild?: (config: LanderConfig) => void | Promise<void>;
  onAfterBuild?: (config: LanderConfig) => void | Promise<void>;
  registerActions?: () => Record<string, Function>;
  registerComponents?: () => Record<string, any>;
}

export interface LanderConfig {
  projectRoot: string;
  engineRoot: string;      // Root of lander-engine package (used for template files)
  jsonConfigsDir?: string; // Default: 'json_configs'
  componentsDir?: string;  // Default: 'components'
  actionsDir?: string;     // Default: 'actions'
  outputDir?: string;      // Default: 'dist'
  plugins?: LanderPlugin[];
  adapter?: any;           // Future: SSG/SSR adapter config
  routingConfig?: RoutingConfig; // Domain → campaign mapping from routing.config.js
}

export type UserLanderConfig = Partial<LanderConfig>;
