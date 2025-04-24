
import { TypeScriptAnalyzer } from '../typescriptAnalyzer';
import { APIAnalyzer } from '../apiAnalyzer';
import { MiddlewareAnalyzer } from '../middlewareAnalyzer';
import { RouteAnalyzer } from '../routeAnalyzer';
import { RouteInfo } from '@/types/analyzer';

describe('TypeScript Analyzer', () => {
  describe('analyze()', () => {
    it('should analyze TypeScript files correctly', async () => {
      const mockFile = new File(['type Test = string;'], 'test.ts', {
        type: 'text/typescript',
      });
      
      const analyzer = new TypeScriptAnalyzer([mockFile]);
      const result = await analyzer.analyze();
      
      expect(result.totalTypes).toBe(1);
      expect(result.customTypes).toBe(1);
    });
  });
});

describe('API Analyzer', () => {
  describe('analyze()', () => {
    it('should analyze API routes correctly', async () => {
      const mockFile = new File(['export default function handler(req, res) {}'], 'pages/api/test.ts', {
        type: 'text/typescript',
      });
      
      const analyzer = new APIAnalyzer([mockFile]);
      const result = await analyzer.analyze();
      
      expect(result.endpoints).toBe(1);
    });
  });
});

describe('Middleware Analyzer', () => {
  describe('analyze()', () => {
    it('should analyze middleware files correctly', async () => {
      const mockFile = new File(['export function middleware() {}'], 'middleware.ts', {
        type: 'text/typescript',
      });
      
      const analyzer = new MiddlewareAnalyzer([mockFile]);
      const result = await analyzer.analyze();
      
      expect(result.count).toBe(1);
    });
  });
});

describe('Route Analyzer', () => {
  describe('analyze()', () => {
    it('should analyze routes correctly', () => {
      const mockRoutes: RouteInfo[] = [{
        path: '/test',
        type: 'static',
        parameters: [],
        complexity: 'simple',
        components: []
      }];
      
      const analyzer = new RouteAnalyzer(mockRoutes);
      const result = analyzer.analyze();
      
      expect(result.routes.length).toBe(1);
    });
  });
});
