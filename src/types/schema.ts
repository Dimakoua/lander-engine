export interface ThemeConfig {
  colors: Record<string, string>;
  fonts?: Record<string, string>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  tokens?: Record<string, any>;
}

export interface SEOConfig {
  title: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

export interface LayoutConfig {
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

export interface FlowConfig {
  initialStep: string;
  steps: Record<string, {
    type: 'normal' | 'popup';
    next?: string;
  }>;
}

export interface StepSection {
  component: string;
  props?: Record<string, any>;
  renderIf?: string; // Logic string or state key
}

export interface StepConfig {
  sections: StepSection[];
  seo?: Partial<SEOConfig>;
  layout?: Partial<LayoutConfig>;
  state?: Record<string, any>;
}
