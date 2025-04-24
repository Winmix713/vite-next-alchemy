
import { TransformationRule } from '@/types/transformerTypes';

export const componentTransformationRules: TransformationRule[] = [
  {
    pattern: /import\s+Image\s+from\s+['"]next\/image['"]/g,
    replacement: "import { Image } from '@unpic/react'",
    description: "Replace Next.js Image with @unpic/react",
    complexity: 'medium',
    category: 'component'
  },
  {
    pattern: /import\s+Head\s+from\s+['"]next\/head['"]/g,
    replacement: "import { Helmet } from 'react-helmet-async'",
    description: "Replace Next.js Head with react-helmet-async",
    complexity: 'simple',
    category: 'component'
  },
  {
    pattern: /import\s+dynamic\s+from\s+['"]next\/dynamic['"]/g,
    replacement: "import { lazy, Suspense } from 'react'",
    description: "Replace Next.js dynamic with React.lazy",
    complexity: 'simple',
    category: 'component'
  }
];
