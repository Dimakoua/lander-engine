/**
 * Simple deep merge utility for JSON objects.
 * Prioritizes properties from the 'source' object.
 */
declare function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
/**
 * Resolves the final configuration by applying overrides in priority order.
 * Priority: Base < Device < Variant < Variant+Device
 */
declare function resolveCascadingConfig<T extends Record<string, any>>(base: T, deviceOverride?: Partial<T>, variantOverride?: Partial<T>, variantDeviceOverride?: Partial<T>): T;

interface ThemeConfig {
    colors: Record<string, string>;
    fonts?: Record<string, string>;
    spacing?: Record<string, string>;
    borderRadius?: Record<string, string>;
    tokens?: Record<string, any>;
    /**
     * URL of the campaign favicon. Supports absolute URLs and root-relative paths.
     * File extension is used to infer the MIME type automatically.
     * Supported: .svg, .ico, .png, .jpg/.jpeg, .webp
     * Falls back to /favicon.svg if not set.
     * @example "/assets/my-icon.svg"
     * @example "https://cdn.example.com/favicon.ico"
     */
    favicon?: string;
}
interface SEOConfig {
    title: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonical?: string;
    noindex?: boolean;
}
interface LayoutConfig {
    header?: {
        component: string;
        props?: Record<string, any>;
    };
    footer?: {
        component: string;
        props?: Record<string, any>;
    };
    scripts?: Array<{
        src: string;
        async?: boolean;
        defer?: boolean;
        position: 'head' | 'body-start' | 'body-end';
    }>;
}
interface ModalConfig {
    backgroundColor?: string;
    backdropColor?: string;
    backdropOpacity?: number;
    borderRadius?: string;
    maxWidth?: string;
    width?: string;
    maxHeight?: string;
    padding?: string;
    boxShadow?: string;
    closeOnBackdropClick?: boolean;
    animation?: 'fade' | 'scale' | 'slide' | 'none';
    animationDuration?: number;
}
interface FlowConfig {
    initialStep: string;
    steps: Record<string, {
        type: 'normal' | 'popup';
        next?: string;
    }>;
    modals?: Record<string, ModalConfig>;
}
interface StepSection {
    component: string;
    props?: Record<string, any>;
    renderIf?: string;
}
interface StepConfig {
    sections: StepSection[];
    seo?: Partial<SEOConfig>;
    layout?: Partial<LayoutConfig>;
    state?: Record<string, any>;
}

interface CampaignConfig {
    campaignId: string;
    flow: FlowConfig;
    theme: ThemeConfig;
    layout: LayoutConfig;
    seo: SEOConfig;
    state: Record<string, any>;
    steps: Record<string, StepConfig>;
}
declare class ConfigParser {
    private baseDir;
    constructor(baseDir: string);
    /**
     * Scans the base directory for campaign folders.
     */
    getCampaigns(): Promise<string[]>;
    /**
     * Reads and parses a JSON file with descriptive error handling.
     */
    private readJson;
    /**
     * Loads the base campaign configuration (non-overridden).
     */
    loadCampaignBase(campaignId: string): Promise<CampaignConfig>;
    /**
     * Helper to load overrides from a specific sub-folder.
     */
    loadOverrides(campaignId: string, subPath: string): Promise<Partial<CampaignConfig>>;
}

export { type CampaignConfig as C, type FlowConfig as F, type LayoutConfig as L, type ModalConfig as M, type SEOConfig as S, type ThemeConfig as T, ConfigParser as a, type StepConfig as b, type StepSection as c, deepMerge as d, resolveCascadingConfig as r };
