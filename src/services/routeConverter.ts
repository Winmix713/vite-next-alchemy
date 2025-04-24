
import { RouteObject } from "react-router-dom";
import { ConversionResult } from "@/types/conversion";
import { RouteInfo } from "@/types/analyzer";

export interface NextJsRoute {
  path: string;
  component: string;
  isDynamic: boolean;
  hasParams: boolean;
  params?: string[];
  layout?: string;
  isIndex?: boolean;
  isOptionalCatchAll?: boolean;
  isCatchAll?: boolean;
}

interface LayoutMapping {
  nextPath: string;
  viteLayout: string;
}

export function analyzeNextJsRoutes(files: File[]): NextJsRoute[] {
  const routes: NextJsRoute[] = [];
  const layouts = new Map<string, string>();
  
  files.forEach(file => {
    if (file.name.match(/\/_layout\.(tsx|jsx|js|ts)$/)) {
      const dirPath = file.name.replace(/\/[^/]+$/, '');
      layouts.set(dirPath, file.name);
    }
  });
  
  files.forEach(file => {
    if (isPageFile(file)) {
      const route = createRouteFromFile(file, layouts);
      routes.push(route);
    }
  });

  return routes;
}

function isPageFile(file: File): boolean {
  return file.name.includes('pages/') && 
         !file.name.includes('/_') && 
         !file.name.endsWith('.css') && 
         !file.name.endsWith('.scss');
}

function createRouteFromFile(file: File, layouts: Map<string, string>): NextJsRoute {
  const path = file.name
    .replace(/^pages/, '')
    .replace(/\.(tsx|jsx|js|ts)$/, '')
    .replace(/\/index$/, '/');

  const isIndex = file.name.match(/index\.(tsx|jsx|js|ts)$/);
  const isOptionalCatchAll = path.includes('[[') && path.includes(']]');
  const isCatchAll = path.includes('[...') && path.includes(']');
  const isDynamic = path.includes('[') && path.includes(']');
  
  const params = isDynamic 
    ? path.match(/\[(\.{0,3}[^\]]*)\]/g)?.map(p => p.replace(/[\[\]]/g, ''))
    : [];

  const layout = findLayoutForFile(file.name, layouts);

  return {
    path,
    component: file.name,
    isDynamic,
    hasParams: isDynamic,
    params,
    layout,
    isIndex: Boolean(isIndex),
    isOptionalCatchAll,
    isCatchAll
  };
}

function findLayoutForFile(filePath: string, layouts: Map<string, string>): string | undefined {
  let dirPath = filePath.replace(/\/[^/]+$/, '');
  while (dirPath !== 'pages') {
    if (layouts.has(dirPath)) {
      return layouts.get(dirPath);
    }
    dirPath = dirPath.replace(/\/[^/]+$/, '');
  }
  return undefined;
}

export function convertToReactRoutes(nextRoutes: NextJsRoute[]): RouteObject[] {
  const routesByLayout = groupRoutesByLayout(nextRoutes);
  return createRouteObjects(routesByLayout);
}

function groupRoutesByLayout(nextRoutes: NextJsRoute[]): Map<string | undefined, NextJsRoute[]> {
  const routesByLayout = new Map<string | undefined, NextJsRoute[]>();
  
  nextRoutes.forEach(route => {
    const layoutKey = route.layout || 'default';
    if (!routesByLayout.has(layoutKey)) {
      routesByLayout.set(layoutKey, []);
    }
    routesByLayout.get(layoutKey)?.push(route);
  });

  return routesByLayout;
}

function createRouteObjects(routesByLayout: Map<string | undefined, NextJsRoute[]>): RouteObject[] {
  const convertedRoutes: RouteObject[] = [];
  
  // Process default routes first
  const defaultRoutes = routesByLayout.get('default') || [];
  defaultRoutes.forEach(route => {
    convertedRoutes.push(createRouteObject(route));
  });
  
  // Process routes with layouts
  routesByLayout.forEach((routes, layout) => {
    if (layout === 'default') return;
    
    const layoutRoute: RouteObject = {
      path: getLayoutBasePath(layout),
      element: `<Layout>${layout}</Layout>`,
      children: routes.map(route => createRouteObject(route, true))
    };
    
    convertedRoutes.push(layoutRoute);
  });
  
  return convertedRoutes;
}

function getLayoutBasePath(layoutFile: string | undefined): string {
  if (!layoutFile) return '/';
  return layoutFile
    .replace(/^pages/, '')
    .replace(/\/_layout\.(tsx|jsx|js|ts)$/, '');
}

function createRouteObject(route: NextJsRoute, isChildRoute: boolean = false): RouteObject {
  let reactPath = route.path;
  
  if (route.isIndex && isChildRoute) {
    reactPath = '';
  }
  
  if (route.isDynamic) {
    reactPath = convertDynamicPath(route);
  }
  
  reactPath = cleanPath(reactPath);
  
  return {
    path: reactPath,
    element: generateRouteComponent(route)
  };
}

function convertDynamicPath(route: NextJsRoute): string {
  let path = route.path;
  
  if (route.isOptionalCatchAll) {
    route.params?.forEach(param => {
      const paramName = param.replace('...', '');
      path = path.replace(`[[...${paramName}]]`, '*');
    });
  } else if (route.isCatchAll) {
    route.params?.forEach(param => {
      const paramName = param.replace('...', '');
      path = path.replace(`[...${paramName}]`, '*');
    });
  } else {
    route.params?.forEach(param => {
      path = path.replace(`[${param}]`, `:${param}`);
    });
  }
  
  return path;
}

function cleanPath(path: string): string {
  path = path.replace(/\/+$/, '');
  return path || '/';
}

function generateRouteComponent(route: NextJsRoute): string {
  return `
    <div>
      <h1>${route.isDynamic ? 'Dynamic' : 'Static'} Route: ${route.path}</h1>
      ${route.isDynamic ? '<pre>{JSON.stringify(useParams(), null, 2)}</pre>' : ''}
    </div>
  `;
}
