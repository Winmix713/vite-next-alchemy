
import { DependencyAnalysis } from '@/types/analyzer';

export class DependencyAnalyzer {
  constructor(private packageJson: any) {}

  analyze(): DependencyAnalysis {
    const dependencies = this.analyzeDependencies();
    const compatibility = this.checkVersionCompatibility(dependencies);

    return {
      dependencies,
      compatibility
    };
  }

  private analyzeDependencies() {
    const deps = [];
    const allDeps = {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies
    };

    for (const [name, version] of Object.entries(allDeps)) {
      deps.push({
        name,
        version: version as string,
        isNextRelated: name.startsWith('next') || name.includes('next-'),
        replacements: this.getReplacements(name)
      });
    }

    return deps;
  }

  private getReplacements(packageName: string): string[] {
    const replacementMap: Record<string, string[]> = {
      'next/image': ['@unpic/react'],
      'next/router': ['react-router-dom'],
      'next/head': ['react-helmet-async'],
      'next/link': ['react-router-dom']
    };

    return replacementMap[packageName] || [];
  }

  private checkVersionCompatibility(deps: any[]): { compatible: boolean; issues: string[] } {
    const issues: string[] = [];
    let compatible = true;

    for (const dep of deps) {
      if (dep.isNextRelated) {
        compatible = false;
        issues.push(`${dep.name} needs to be replaced with ${dep.replacements?.join(' or ') || 'an alternative'}`);
      }
    }

    return { compatible, issues };
  }
}
