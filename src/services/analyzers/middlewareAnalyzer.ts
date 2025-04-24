
import { MiddlewareAnalysis } from '@/types/analyzer';
import { readFileContent, isMiddlewareFile } from '@/utils/fileReader';

export class MiddlewareAnalyzer {
  constructor(private files: File[]) {}

  async analyze(): Promise<MiddlewareAnalysis> {
    let count = 0;
    let complexMiddlewares = 0;
    let edgeMiddlewares = 0;
    const issues: string[] = [];

    for (const file of this.files) {
      if (isMiddlewareFile(file.name)) {
        count++;
        
        try {
          const content = await readFileContent(file);
          
          if (content.includes('runtime: "edge"') || content.includes("runtime: 'edge'")) {
            edgeMiddlewares++;
          }
          
          if (content.includes('matcher') || 
              content.includes('config') ||
              content.includes('withAuth') ||
              content.includes('middleware.config')) {
            complexMiddlewares++;
          }
        } catch (error) {
          issues.push(`Error analyzing middleware ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return {
      count,
      complexMiddlewares,
      edgeMiddlewares,
      issues
    };
  }
}
