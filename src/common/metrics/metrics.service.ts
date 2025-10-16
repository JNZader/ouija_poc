import { Injectable } from '@nestjs/common';

interface HttpMetric {
  method: string;
  route: string;
  statusCode: number;
  count: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
}

interface WebSocketMetric {
  event: string;
  count: number;
}

@Injectable()
export class MetricsService {
  private httpMetrics: Map<string, HttpMetric> = new Map();
  private wsMetrics: Map<string, WebSocketMetric> = new Map();
  private wsConnections = 0;
  private aiRequests = {
    ollama: { total: 0, success: 0, failed: 0, totalDuration: 0 },
    deepseek: { total: 0, success: 0, failed: 0, totalDuration: 0 },
  };

  // HTTP Metrics
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ) {
    const key = `${method}:${route}:${statusCode}`;
    const existing = this.httpMetrics.get(key);

    if (existing) {
      existing.count++;
      existing.totalDuration += duration;
      existing.minDuration = Math.min(existing.minDuration, duration);
      existing.maxDuration = Math.max(existing.maxDuration, duration);
    } else {
      this.httpMetrics.set(key, {
        method,
        route,
        statusCode,
        count: 1,
        totalDuration: duration,
        minDuration: duration,
        maxDuration: duration,
      });
    }
  }

  getHttpMetrics() {
    const metrics: any[] = [];
    this.httpMetrics.forEach((metric, key) => {
      const avgDuration = metric.totalDuration / metric.count;
      metrics.push({
        method: metric.method,
        route: metric.route,
        statusCode: metric.statusCode,
        count: metric.count,
        avgDuration: Math.round(avgDuration),
        minDuration: metric.minDuration,
        maxDuration: metric.maxDuration,
      });
    });
    return metrics;
  }

  // WebSocket Metrics
  incrementWsConnections() {
    this.wsConnections++;
  }

  decrementWsConnections() {
    this.wsConnections = Math.max(0, this.wsConnections - 1);
  }

  getWsConnections() {
    return this.wsConnections;
  }

  recordWsEvent(event: string) {
    const existing = this.wsMetrics.get(event);
    if (existing) {
      existing.count++;
    } else {
      this.wsMetrics.set(event, { event, count: 1 });
    }
  }

  getWsMetrics() {
    const metrics: any[] = [];
    this.wsMetrics.forEach((metric) => {
      metrics.push({
        event: metric.event,
        count: metric.count,
      });
    });
    return metrics;
  }

  // AI Metrics
  recordAiRequest(
    engine: 'ollama' | 'deepseek',
    success: boolean,
    duration: number,
  ) {
    const engineMetrics = this.aiRequests[engine];
    engineMetrics.total++;
    if (success) {
      engineMetrics.success++;
    } else {
      engineMetrics.failed++;
    }
    engineMetrics.totalDuration += duration;
  }

  getAiMetrics() {
    return {
      ollama: {
        ...this.aiRequests.ollama,
        avgDuration:
          this.aiRequests.ollama.total > 0
            ? Math.round(
                this.aiRequests.ollama.totalDuration /
                  this.aiRequests.ollama.total,
              )
            : 0,
        successRate:
          this.aiRequests.ollama.total > 0
            ? (
                (this.aiRequests.ollama.success /
                  this.aiRequests.ollama.total) *
                100
              ).toFixed(2)
            : '0.00',
      },
      deepseek: {
        ...this.aiRequests.deepseek,
        avgDuration:
          this.aiRequests.deepseek.total > 0
            ? Math.round(
                this.aiRequests.deepseek.totalDuration /
                  this.aiRequests.deepseek.total,
              )
            : 0,
        successRate:
          this.aiRequests.deepseek.total > 0
            ? (
                (this.aiRequests.deepseek.success /
                  this.aiRequests.deepseek.total) *
                100
              ).toFixed(2)
            : '0.00',
      },
    };
  }

  // Prometheus format export
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // HTTP request metrics
    lines.push('# HELP http_requests_total Total number of HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    this.httpMetrics.forEach((metric) => {
      lines.push(
        `http_requests_total{method="${metric.method}",route="${metric.route}",status="${metric.statusCode}",service="ouija-api"} ${metric.count}`,
      );
    });

    // HTTP request duration
    lines.push(
      '# HELP http_request_duration_ms HTTP request duration in milliseconds',
    );
    lines.push('# TYPE http_request_duration_ms histogram');
    this.httpMetrics.forEach((metric) => {
      const avgDuration = metric.totalDuration / metric.count;
      lines.push(
        `http_request_duration_ms_bucket{method="${metric.method}",route="${metric.route}",le="50",service="ouija-api"} ${metric.count}`,
      );
      lines.push(
        `http_request_duration_ms_sum{method="${metric.method}",route="${metric.route}",service="ouija-api"} ${metric.totalDuration}`,
      );
      lines.push(
        `http_request_duration_ms_count{method="${metric.method}",route="${metric.route}",service="ouija-api"} ${metric.count}`,
      );
    });

    // WebSocket connections
    lines.push('# HELP websocket_connections Active WebSocket connections');
    lines.push('# TYPE websocket_connections gauge');
    lines.push(
      `websocket_connections{service="ouija-api"} ${this.wsConnections}`,
    );

    // AI requests
    lines.push('# HELP ai_requests_total Total number of AI requests');
    lines.push('# TYPE ai_requests_total counter');
    lines.push(
      `ai_requests_total{engine="ollama",status="success",service="ouija-api"} ${this.aiRequests.ollama.success}`,
    );
    lines.push(
      `ai_requests_total{engine="ollama",status="failed",service="ouija-api"} ${this.aiRequests.ollama.failed}`,
    );
    lines.push(
      `ai_requests_total{engine="deepseek",status="success",service="ouija-api"} ${this.aiRequests.deepseek.success}`,
    );
    lines.push(
      `ai_requests_total{engine="deepseek",status="failed",service="ouija-api"} ${this.aiRequests.deepseek.failed}`,
    );

    return lines.join('\n');
  }

  // Get all metrics
  getAllMetrics() {
    return {
      http: this.getHttpMetrics(),
      websocket: {
        activeConnections: this.getWsConnections(),
        events: this.getWsMetrics(),
      },
      ai: this.getAiMetrics(),
    };
  }

  // Reset metrics (useful for testing)
  reset() {
    this.httpMetrics.clear();
    this.wsMetrics.clear();
    this.wsConnections = 0;
    this.aiRequests = {
      ollama: { total: 0, success: 0, failed: 0, totalDuration: 0 },
      deepseek: { total: 0, success: 0, failed: 0, totalDuration: 0 },
    };
  }
}
