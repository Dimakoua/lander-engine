export { $ as $state, A as Action, a as ActionDispatcher, b as ActionHandler, c as ActionMap, d as ActionType, C as ComponentMap, e as ConditionalAction, N as NavigationAction, R as RestAction, S as SequenceAction, f as SetStateAction, T as TelemetryAction, g as ToggleStateAction, U as UIAction, h as dispatcher, i as getLoadingActionState, j as getState, k as hydrateState, r as registry, s as setState, t as toggleState, w as watchLoadingAction } from './index-BVno9mvk.cjs';
export { C as CampaignConfig, a as ConfigParser, D as DeepPartial, F as FlowConfig, L as LayoutConfig, M as ModalConfig, S as SEOConfig, b as StepConfig, c as StepSection, T as ThemeConfig, d as deepMerge, i as interpolateVariables, r as resolveCascadingConfig } from './index-DPc_4M2-.cjs';
import { T as TelemetryConfig } from './telemetry-DA2Y4suJ.cjs';
import 'nanostores';

type DomainRouteConfig = {
    campaign: string;
    basePath?: string;
    defaultStep?: string;
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
type RoutingConfig = Record<string, string | DomainRouteConfig>;
interface LanderPlugin {
    name: string;
    onBeforeBuild?: (config: LanderConfig) => void | Promise<void>;
    onAfterBuild?: (config: LanderConfig) => void | Promise<void>;
    registerActions?: () => Record<string, Function>;
    registerComponents?: () => Record<string, any>;
}

interface LanderConfig {
    telemetry?: TelemetryConfig;
    projectRoot: string;
    engineRoot: string;
    jsonConfigsDir?: string;
    componentsDir?: string;
    actionsDir?: string;
    assetsDir?: string;
    outputDir?: string;
    plugins?: LanderPlugin[];
    adapter?: any;
    routingConfig?: RoutingConfig;
    errorPages?: Record<string, {
        component: string;
        props?: Record<string, any>;
    }>;
    redirectPage?: {
        component?: string;
        props?: Record<string, any>;
        theme?: {
            title?: string;
            loadingText?: string;
            backgroundColor?: string;
            spinnerColor?: string;
            textColor?: string;
        };
    };
}
type UserLanderConfig = Partial<LanderConfig>;

export type { DomainRouteConfig, LanderConfig, LanderPlugin, RoutingConfig, UserLanderConfig };
