
import { TypeScriptAnalysis } from '@/types/analyzer';
import { readFileContent, isCodeFile } from '@/utils/fileReader';

export class TypeScriptAnalyzer {
  constructor(private files: File[]) {}

  async analyze(): Promise<TypeScriptAnalysis> {
    let totalTypes = 0;
    let nextJsTypes = 0;
    let customTypes = 0;
    const issues: string[] = [];

    for (const file of this.files) {
      if (isCodeFile(file.name)) {
        try {
          const content = await readFileContent(file);
          
          const nextTypeMatches = content.match(/Next(?:Page|Api\w+|Config|Router|App\w+)/g);
          if (nextTypeMatches) {
            nextJsTypes += nextTypeMatches.length;
          }
          
          const typeMatches = content.match(/(?:type|interface)\s+\w+/g);
          if (typeMatches) {
            customTypes += typeMatches.length;
          }
          
          totalTypes = nextJsTypes + customTypes;
        } catch (error) {
          issues.push(`Error analyzing ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return {
      totalTypes,
      nextJsTypes,
      customTypes,
      issues
    };
  }
}
