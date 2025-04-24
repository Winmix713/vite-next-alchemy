export type AnalyzerComponentStatus = 'ok' | 'warning' | 'error';

export interface AnalyzerComponent {
  name: string;
  status: AnalyzerComponentStatus;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  components: AnalyzerComponent[];
}

export interface CodebaseAnalysis {
  totalFiles: number;
  jsFiles: number;
  tsFiles: number;
  reactComponents: number;
  hooks: number;
  cssFiles: number;
  apiRoutes: number;
  nextjsFeatureUsage: Record<string, number>;
}

export interface DependencyAnalysis {
  dependencies: {
    name: string;
    version: string;
    isNextRelated: boolean;
    replacements?: string[];
  }[];
  compatibility: {
    compatible: boolean;
    issues: string[];
  };
}

export interface RouteInfo {
  path: string;
  type: 'static' | 'dynamic' | 'catch-all' | 'api';
  parameters: string[];
  complexity: 'simple' | 'medium' | 'complex';
  components: string[];
  dataFetching?: 'getServerSideProps' | 'getStaticProps' | 'getStaticPaths';
}

export interface RoutingAnalysis {
  routes: RouteInfo[];
  dynamicRoutes: number;
  complexRoutes: number;
}

export interface ComplexityMetrics {
  fileComplexity: Record<string, number>;
  overallComplexity: number;
  dataFetchingComplexity: number;
  routingComplexity: number;
  componentComplexity: number;
}

export interface TypeScriptAnalysis {
  totalTypes: number;
  nextJsTypes: number;
  customTypes: number;
  issues: string[];
}

export interface APIAnalysis {
  endpoints: number;
  dynamicEndpoints: number;
  methods: {
    GET: number;
    POST: number;
    PUT: number;
    DELETE: number;
    PATCH: number;
  };
  issues: string[];
}

export interface MiddlewareAnalysis {
  count: number;
  complexMiddlewares: number;
  edgeMiddlewares: number;
  issues: string[];
}
