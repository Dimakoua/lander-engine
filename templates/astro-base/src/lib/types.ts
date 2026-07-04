export interface CampaignConfig {
  variants: string[];
  hasMobileRoute: boolean;
}

export interface DomainRouteMapping {
  campaign: string;
  basePath: string;
  defaultStep?: string;
}

export type DomainRouting = Record<string, DomainRouteMapping>;

declare global {
  interface Window {
    __landerCampaignConfigs?: Record<string, CampaignConfig>;
    __landerBasePath?: string;
    __landerDomainRouting?: DomainRouting;
    __landerResolveUrl?: (pathname: string) => string | null;
    __landerNavigate?: (href: string) => void;
  }
}
