
import { APIAnalysis } from '@/types/analyzer';
import { readFileContent, isApiFile } from '@/utils/fileReader';

export class APIAnalyzer {
  constructor(private files: File[]) {}

  async analyze(): Promise<APIAnalysis> {
    let endpoints = 0;
    let dynamicEndpoints = 0;
    const methods = {
      GET: 0,
      POST: 0,
      PUT: 0,
      DELETE: 0,
      PATCH: 0
    };
    const issues: string[] = [];

    for (const file of this.files) {
      if (isApiFile(file.name)) {
        endpoints++;
        
        try {
          const content = await readFileContent(file);
          
          if (file.name.includes('[') && file.name.includes(']')) {
            dynamicEndpoints++;
          }
          
          Object.keys(methods).forEach(method => {
            const regex = new RegExp(`\\b${method.toLowerCase()}\\b`, 'i');
            if (regex.test(content)) {
              methods[method as keyof typeof methods]++;
            }
          });
        } catch (error) {
          issues.push(`Error analyzing API endpoint ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return {
      endpoints,
      dynamicEndpoints,
      methods,
      issues
    };
  }
}
