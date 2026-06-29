export type DomainRouteConfig = {
  campaign: string;
  basePath?: string; // e.g., '/' (root), '/welcome', or default campaign path
  defaultStep?: string; // Optional custom starting step override
};

/**
 * Maps domain names to campaign IDs or detailed route configurations.
 * Defined in `routing.config.js` in the project root.
 *
 * @example
 * {
 *   "campaign-a.com": "campaign_alpha",
 *   "campaign-b.com": { campaign: "campaign_beta", basePath: "/" }
 * }
 */
export type RoutingConfig = Record<string, string | DomainRouteConfig>;

export interface LanderPlugin {
  name: string;
  onBeforeBuild?: (config: LanderConfig) => void | Promise<void>;
  onAfterBuild?: (config: LanderConfig) => void | Promise<void>;
  registerActions?: () => Record<string, Function>;
  registerComponents?: () => Record<string, any>;
}

import type { TelemetryConfig } from './telemetry';

export interface LanderConfig {
  telemetry?: TelemetryConfig;
  projectRoot: string;
  engineRoot: string;      // Root of lander-engine package (used for template files)
  jsonConfigsDir?: string; // Default: 'json_configs'
  componentsDir?: string;  // Default: 'components'
  actionsDir?: string;     // Default: 'actions'
  assetsDir?: string;      // Default: 'assets'
  outputDir?: string;      // Default: 'dist'
  plugins?: LanderPlugin[];
  adapter?: any;           // Future: SSG/SSR adapter config
  routingConfig?: RoutingConfig; // Domain → campaign mapping from routing.config.js
  errorPages?: Record<string, {
    component: string;
    props?: Record<string, any>;
  }>;
}

export type UserLanderConfig = Partial<LanderConfig>;
