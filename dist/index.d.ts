export { $ as $state, A as Action, a as ActionDispatcher, b as ActionHandler, c as ActionMap, d as ActionType, C as ComponentMap, e as ConditionalAction, N as NavigationAction, R as RestAction, S as SequenceAction, f as SetStateAction, T as ToggleStateAction, U as UIAction, g as dispatcher, h as getLoadingActionState, i as getState, j as hydrateState, r as registry, s as setState, t as toggleState, w as watchLoadingAction } from './index-DUPWXBCm.js';
export { C as CampaignConfig, a as ConfigParser, F as FlowConfig, L as LayoutConfig, M as ModalConfig, S as SEOConfig, b as StepConfig, c as StepSection, T as ThemeConfig, d as deepMerge, r as resolveCascadingConfig } from './index-BEokHqhe.js';
import 'nanostores';

/**
 * Maps domain names to campaign IDs.
 * Defined in `routing.config.js` in the project root.
 *
 * @example
 * { "campaign-a.com": "campaign_alpha", "campaign-b.com": "campaign_beta" }
 */
type RoutingConfig = Record<string, string>;
interface LanderPlugin {
    name: string;
    onBeforeBuild?: (config: LanderConfig) => void | Promise<void>;
    onAfterBuild?: (config: LanderConfig) => void | Promise<void>;
    registerActions?: () => Record<string, Function>;
    registerComponents?: () => Record<string, any>;
}
interface LanderConfig {
    projectRoot: string;
    engineRoot: string;
    jsonConfigsDir?: string;
    componentsDir?: string;
    actionsDir?: string;
    outputDir?: string;
    plugins?: LanderPlugin[];
    adapter?: any;
    routingConfig?: RoutingConfig;
}
type UserLanderConfig = Partial<LanderConfig>;

export type { LanderConfig, LanderPlugin, RoutingConfig, UserLanderConfig };
