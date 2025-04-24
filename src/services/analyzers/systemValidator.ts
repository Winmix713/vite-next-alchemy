
import { ValidationResult, AnalyzerComponent, AnalyzerComponentStatus } from '@/types/analyzer';
import { analyzeNextJsRoutes } from '../routeConverter';
import { transformCode } from '../codeTransformer';

export async function validateConversionSystem(): Promise<ValidationResult> {
  const components: AnalyzerComponent[] = [
    { name: 'routeConverter', status: 'ok' },
    { name: 'codeTransformer', status: 'ok' },
    { name: 'apiRouteTransformer', status: 'ok' }
  ];
  
  const issues: string[] = [];

  try {
    const routeConverterValid = typeof analyzeNextJsRoutes === 'function';
    if (!routeConverterValid) {
      components[0].status = 'error';
      components[0].message = 'RouteConverter validation warning';
      issues.push('RouteConverter validation warning');
    }
    
    const codeTransformerValid = typeof transformCode === 'function';
    if (!codeTransformerValid) {
      components[1].status = 'error';
      components[1].message = 'CodeTransformer validation warning';
      issues.push('CodeTransformer validation warning');
    }
    
  } catch (error) {
    issues.push(`System validation error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    components
  };
}
