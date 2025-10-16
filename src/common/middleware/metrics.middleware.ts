import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    // Capture response finish event
    res.on('finish', () => {
      const duration = Date.now() - start;
      const route = req.route?.path || req.path;
      const method = req.method;
      const statusCode = res.statusCode;

      // Record metrics
      this.metricsService.recordHttpRequest(method, route, statusCode, duration);
    });

    next();
  }
}
