
import { TransformationRule, TransformResult } from '@/types/transformerTypes';
import { routingTransformationRules } from './transformers/rules/routingRules';
import { componentTransformationRules } from './transformers/rules/componentRules';
import { dataFetchingTransformationRules } from './transformers/rules/dataFetchingRules';

const allTransformationRules: TransformationRule[] = [
  ...routingTransformationRules,
  ...componentTransformationRules,
  ...dataFetchingTransformationRules
];

export function transformCode(sourceCode: string): TransformResult {
  const appliedTransformations: string[] = [];
  let transformedCode = sourceCode;

  for (const rule of allTransformationRules) {
    if (rule.pattern.test(transformedCode)) {
      transformedCode = transformedCode.replace(rule.pattern, rule.replacement as any);
      appliedTransformations.push(rule.description);
    }
  }

  return {
    transformedCode,
    appliedTransformations
  };
}

export function getTransformationsByCategory(category: string): TransformationRule[] {
  return allTransformationRules.filter(rule => rule.category === category);
}

export function getTransformationsByComplexity(complexity: 'simple' | 'medium' | 'complex'): TransformationRule[] {
  return allTransformationRules.filter(rule => rule.complexity === complexity);
}

export function getTransformationStats(sourceCode: string): {
  totalTransformations: number;
  appliedTransformations: string[];
  categoryCounts: Record<string, number>;
} {
  const { appliedTransformations } = transformCode(sourceCode);
  
  // Count transformations by category
  const categoryCounts: Record<string, number> = {};
  appliedTransformations.forEach(desc => {
    const rule = allTransformationRules.find(r => r.description === desc);
    if (rule) {
      categoryCounts[rule.category] = (categoryCounts[rule.category] || 0) + 1;
    }
  });
  
  return {
    totalTransformations: appliedTransformations.length,
    appliedTransformations,
    categoryCounts
  };
}
