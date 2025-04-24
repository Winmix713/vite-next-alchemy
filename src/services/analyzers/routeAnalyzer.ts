
import { RouteInfo, RoutingAnalysis } from '@/types/analyzer';

export class RouteAnalyzer {
  constructor(private routes: RouteInfo[]) {}

  analyze(): RoutingAnalysis {
    const dynamicRoutes = this.routes.filter(route => 
      route.type === 'dynamic' || route.type === 'catch-all'
    ).length;

    const complexRoutes = this.routes.filter(route => 
      route.complexity === 'complex' || 
      route.parameters.length > 1
    ).length;

    return {
      routes: this.routes,
      dynamicRoutes,
      complexRoutes
    };
  }
}
