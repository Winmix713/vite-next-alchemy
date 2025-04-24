
export interface ConversionOptions {
  useReactRouter: boolean;
  convertApiRoutes: boolean;
  transformDataFetching: boolean;
  replaceComponents: boolean;
  updateDependencies: boolean;
  preserveTypeScript: boolean;
  handleMiddleware: boolean;
}

export interface ConversionState {
  isConverting: boolean;
  conversionOptions: ConversionOptions;
  progress: number;
  message: string;
  projectData?: {
    files: File[];
    packageJson?: Record<string, any>;
  };
  originalCode?: string;
  convertedCode?: string;
  conversionResult?: ConversionResult | null;
  conversionError?: string | null;
}

export interface ConversionResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  stats: ConversionStats;
  originalCode: string;
  transformedCode: string;
  appliedTransformations: string[];
  changes: string[];
}

export interface ConversionStats {
  totalFiles: number;
  modifiedFiles: number;
  transformationRate: number;
  dependencyChanges: number;
  routeChanges: number;
  totalTransformations?: number;
  changeMade?: number;
  warningCount?: number;
  conversionRate?: number;
}

export type ConversionAction =
  | { type: 'SET_IS_CONVERTING'; payload: boolean }
  | { type: 'SET_CONVERSION_OPTIONS'; payload: ConversionOptions }
  | { type: 'SET_CONVERSION_PROGRESS'; payload: { progress: number, message: string } }
  | { type: 'SET_PROJECT_DATA'; payload: ConversionState['projectData'] }
  | { type: 'SET_ORIGINAL_CODE'; payload: string }
  | { type: 'SET_CONVERTED_CODE'; payload: string }
  | { type: 'SET_CONVERSION_RESULT'; payload: { success: boolean, result: ConversionResult } }
  | { type: 'SET_CONVERSION_ERROR'; payload: string };

export interface ConversionContextType {
  state: ConversionState;
  dispatch: React.Dispatch<ConversionAction>;
  toggleOption: (option: keyof ConversionOptions) => void;
  updateOriginalCode: (code: string) => void;
  updateConvertedCode: (code: string) => void;
}
