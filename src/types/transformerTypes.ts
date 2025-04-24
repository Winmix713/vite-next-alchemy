
export interface TransformationRule {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  description: string;
  complexity: 'simple' | 'medium' | 'complex';
  category: 'component' | 'routing' | 'data-fetching' | 'api' | 'config' | 'general';
}

export interface TransformResult {
  transformedCode: string;
  appliedTransformations: string[];
}

export interface ASTTransformResult {
  code: string;
  changes: string[];
  warnings: string[];
}

export interface ComponentTransformation {
  type: 'Image' | 'Link' | 'Head' | 'Script' | 'Other';
  originalImport: string;
  newImport: string;
  replacements: { from: string; to: string }[];
}

export interface RoutingTransformation {
  type: 'useRouter' | 'Link' | 'dynamic-route' | 'catch-all';
  changes: string[];
}

export interface DataFetchingTransformation {
  type: 'getServerSideProps' | 'getStaticProps' | 'getStaticPaths';
  changes: string[];
  newImplementation: string;
}

export interface ApiRouteTransformation {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  newImplementation: string;
}

export interface DependencyChange {
  name: string;
  oldVersion?: string;
  newVersion?: string;
  action: 'add' | 'remove' | 'update';
}

export interface ConfigTransformation {
  file: 'next.config.js' | 'vite.config.js' | 'package.json' | 'tsconfig.json';
  changes: string[];
}
