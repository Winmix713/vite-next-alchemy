
import { CodebaseAnalysis } from '@/types/analyzer';
import { analyzeCodeStructure } from '../astTransformer';

export class CodebaseAnalyzer {
  constructor(private files: File[]) {}

  async analyze(): Promise<CodebaseAnalysis> {
    let reactComponents = 0;
    let hooks = 0;
    let apiRoutes = 0;
    let jsFiles = 0;
    let tsFiles = 0;
    let cssFiles = 0;
    const nextjsFeatureUsage: Record<string, number> = {
      'next/image': 0,
      'next/link': 0,
      'next/head': 0,
      'next/router': 0,
      'getServerSideProps': 0,
      'getStaticProps': 0,
      'getStaticPaths': 0,
      'NextApiRequest': 0,
      'NextApiResponse': 0,
      'middleware': 0
    };

    for (const file of this.files) {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) {
        jsFiles++;
      } else if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
        tsFiles++;
      } else if (fileName.endsWith('.css') || fileName.endsWith('.scss')) {
        cssFiles++;
      }
      
      if (fileName.includes('/api/') && (fileName.endsWith('.js') || fileName.endsWith('.ts'))) {
        apiRoutes++;
      }
      
      const content = await this.readFileContent(file);
      
      Object.keys(nextjsFeatureUsage).forEach(feature => {
        if (content.includes(feature)) {
          nextjsFeatureUsage[feature]++;
        }
      });
      
      if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) {
        try {
          const analysis = analyzeCodeStructure(content);
          reactComponents += analysis.components.length;
          hooks += analysis.hooks.length;
        } catch (error) {
          console.error(`Error analyzing ${fileName}:`, error);
        }
      }
    }
    
    return {
      totalFiles: this.files.length,
      jsFiles,
      tsFiles,
      reactComponents,
      hooks,
      cssFiles,
      apiRoutes,
      nextjsFeatureUsage
    };
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  }
}
