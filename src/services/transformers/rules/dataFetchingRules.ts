
import { TransformationRule } from '@/types/transformerTypes';

export const dataFetchingTransformationRules: TransformationRule[] = [
  {
    pattern: /import\s+{\s*GetServerSideProps\s*(?:,\s*[^}]+)?\s*}\s+from\s+'next'/g,
    replacement: "// Vite equivalent not needed - use React Query or similar",
    description: "Remove Next.js SSR imports",
    complexity: 'simple',
    category: 'data-fetching'
  },
  {
    pattern: /export\s+const\s+getServerSideProps\s*=\s*async\s*\(\s*(?:context)?\s*\)\s*=>\s*{([^}]*)}/gs,
    replacement: (match, funcBody) => {
      return `// Converted to React Query fetch function
export const fetchData = async () => {
  // Original getServerSideProps logic:
  ${funcBody}
}`;
    },
    description: "Convert SSR getServerSideProps to client-side fetching",
    complexity: 'medium',
    category: 'data-fetching'
  }
];
