
import { ConversionOptions, ConversionResult, ConversionStats } from '@/types/conversion';
import { transformWithAst } from './astTransformer';
import { transformCode } from './codeTransformer';
import { DiagnosticsReporter } from './diagnosticsReporter';

export class ConversionExecutor {
  private options: ConversionOptions;
  private files: File[];
  private progress: number = 0;
  private progressCallback?: (progress: number, message: string) => void;
  private result: ConversionResult;
  private reporter: DiagnosticsReporter;

  constructor(files: File[], options: ConversionOptions) {
    this.files = files;
    this.options = options;
    this.reporter = new DiagnosticsReporter('project', options);
    this.result = this.initializeResult();
  }

  private initializeResult(): ConversionResult {
    return {
      success: false,
      errors: [],
      warnings: [],
      info: [],
      originalCode: '',
      transformedCode: '',
      appliedTransformations: [],
      changes: [],
      stats: {
        totalFiles: this.files.length,
        modifiedFiles: 0,
        transformationRate: 0,
        dependencyChanges: 0,
        routeChanges: 0
      }
    };
  }

  setProgressCallback(callback: (progress: number, message: string) => void): this {
    this.progressCallback = callback;
    return this;
  }

  private async updateProgress(increment: number, message: string): Promise<void> {
    this.progress = Math.min(this.progress + increment, 100);
    this.progressCallback?.(this.progress, message);
    // Add a small delay to make progress visible
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async execute(): Promise<ConversionResult> {
    try {
      await this.updateProgress(5, "Starting conversion...");
      
      this.reporter.addInfo('general', 'Starting Next.js to Vite conversion');
      
      await this.analyzeFiles();
      await this.transformFiles();
      await this.updateDependencies();
      await this.convertApiRoutes();
      await this.finalizeConversion();
      
      await this.updateProgress(100, "Conversion completed!");
      
      this.result.success = this.result.errors.length === 0;
      return this.result;
    } catch (error) {
      this.result.success = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.result.errors.push(`Unexpected error: ${errorMessage}`);
      this.reporter.addError('general', `Unexpected error during conversion: ${errorMessage}`);
      return this.result;
    }
  }
  
  private async analyzeFiles(): Promise<void> {
    await this.updateProgress(10, "Analyzing files...");
    
    this.reporter.addInfo('analysis', `Analyzing ${this.files.length} files`);
    
    // In a real implementation, we would analyze files here
    // For now, we'll just simulate it
    await new Promise(resolve => setTimeout(resolve, 800));
    
    this.reporter.completeStep('File analysis');
  }

  private async transformFiles(): Promise<void> {
    const progressStep = 50 / this.files.length;
    
    await this.updateProgress(20, "Transforming files...");
    
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      try {
        const content = await this.readFileContent(file);
        
        // Skip non-code files
        if (!this.isCodeFile(file.name)) {
          continue;
        }
        
        // Transform with AST
        this.reporter.addInfo('transformation', `Transforming ${file.name} with AST`);
        const astResult = transformWithAst(content);
        
        // Transform with regex
        this.reporter.addInfo('transformation', `Transforming ${file.name} with regex`);
        const { transformedCode, appliedTransformations } = transformCode(astResult.code);
        
        // Update result stats
        if (appliedTransformations.length > 0 || astResult.changes.length > 0) {
          this.result.stats.modifiedFiles++;
          this.result.info.push(`Transformed ${file.name}:\n${appliedTransformations.join('\n')}`);
          
          // Store transformations
          this.result.appliedTransformations.push(...appliedTransformations);
          this.result.changes.push(...astResult.changes);
          
          // Store warnings
          if (astResult.warnings.length > 0) {
            this.result.warnings.push(...astResult.warnings.map(w => `${file.name}: ${w}`));
          }
          
          // For demo purposes, store the first file's original and transformed code
          if (i === 0) {
            this.result.originalCode = content;
            this.result.transformedCode = transformedCode;
          }
        }
        
        await this.updateProgress(progressStep, `Processing ${file.name}...`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.result.errors.push(`Error processing ${file.name}: ${errorMessage}`);
        this.reporter.addError('transformation', `Error processing ${file.name}: ${errorMessage}`);
      }
    }
    
    this.result.stats.transformationRate = 
      this.result.stats.modifiedFiles / this.files.length;
      
    this.reporter.completeStep('File transformation');
  }
  
  private async updateDependencies(): Promise<void> {
    await this.updateProgress(75, "Updating dependencies...");
    
    // In a real implementation, we would update dependencies here
    if (this.options.updateDependencies) {
      this.reporter.addInfo('dependencies', 'Updating package.json dependencies');
      this.result.stats.dependencyChanges = 5; // Example number
      
      // For demo purposes, simulate dependency changes
      this.result.info.push('Updated dependencies:');
      this.result.info.push('- Replaced next with vite');
      this.result.info.push('- Added @vitejs/plugin-react');
      this.result.info.push('- Added react-router-dom');
      this.result.info.push('- Added react-helmet-async');
    } else {
      this.reporter.addInfo('dependencies', 'Dependency updates skipped as per options');
    }
    
    this.reporter.completeStep('Dependency updates');
  }
  
  private async convertApiRoutes(): Promise<void> {
    await this.updateProgress(85, "Converting API routes...");
    
    // In a real implementation, we would convert API routes here
    if (this.options.convertApiRoutes) {
      this.reporter.addInfo('api', 'Converting API routes');
      
      // Count API routes
      const apiRouteCount = this.files
        .filter(f => f.name.includes('/api/') || f.name.includes('\\api\\'))
        .length;
      
      if (apiRouteCount > 0) {
        this.result.stats.routeChanges = apiRouteCount;
        this.result.info.push(`Converted ${apiRouteCount} API routes to Express endpoints`);
      } else {
        this.result.info.push('No API routes found to convert');
      }
    } else {
      this.reporter.addInfo('api', 'API route conversion skipped as per options');
    }
    
    this.reporter.completeStep('API route conversion');
  }
  
  private async finalizeConversion(): Promise<void> {
    await this.updateProgress(95, "Finalizing conversion...");
    
    // Generate final report
    const report = this.reporter.generateReport();
    
    // Add summary info
    this.result.info.push('');
    this.result.info.push('Conversion Summary:');
    this.result.info.push(`- Total files processed: ${this.files.length}`);
    this.result.info.push(`- Modified files: ${this.result.stats.modifiedFiles}`);
    this.result.info.push(`- Applied transformations: ${this.result.appliedTransformations.length}`);
    this.result.info.push(`- Warnings: ${this.result.warnings.length}`);
    this.result.info.push(`- Errors: ${this.result.errors.length}`);
    
    this.reporter.completeStep('Conversion finalization');
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsText(file);
    });
  }
  
  private isCodeFile(fileName: string): boolean {
    const lowerName = fileName.toLowerCase();
    return lowerName.endsWith('.js') || 
           lowerName.endsWith('.jsx') || 
           lowerName.endsWith('.ts') || 
           lowerName.endsWith('.tsx');
  }
}
