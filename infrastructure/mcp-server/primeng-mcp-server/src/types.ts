export interface PrimeNGComponent {
  name: string;
  category: string;
  description: string;
  url: string;
  apiUrl?: string;
  examples?: ComponentExample[];
  properties?: ComponentProperty[];
  events?: ComponentEvent[];
  templates?: ComponentTemplate[];
  cssClasses?: ComponentCSSClass[];
  designTokens?: ComponentDesignToken[];
}

export interface ComponentExample {
  title: string;
  description?: string;
  code: string;
  template?: string;
}

export interface ComponentProperty {
  name: string;
  type: string;
  default?: string;
  description: string;
  required?: boolean;
}

export interface ComponentEvent {
  name: string;
  parameters?: string;
  description: string;
}

export interface ComponentTemplate {
  name: string;
  parameters?: string;
  description: string;
}

export interface ComponentCSSClass {
  class: string;
  description: string;
}

export interface ComponentDesignToken {
  name: string;
  token: string;
  variable: string;
  description: string;
}

export interface PrimeNGSearchResult {
  components: PrimeNGComponent[];
  total: number;
}

export interface ComponentDocumentation {
  component: PrimeNGComponent;
  fullDocumentation: string;
  codeExamples: ComponentExample[];
  installation?: string;
  dependencies?: string[];
}
