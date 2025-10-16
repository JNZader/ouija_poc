import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class HealthService implements OnModuleInit {
  private startTime: Date;
  private isApplicationReady = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.startTime = new Date();
    // Mark as ready after a short delay (allowing all modules to initialize)
    setTimeout(() => {
      this.isApplicationReady = true;
    }, 2000);
  }

  async isReady(): Promise<boolean> {
    if (!this.isApplicationReady) {
      return false;
    }

    // Check critical dependencies
    try {
      await this.checkDatabase();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getDetailedHealth() {
    const [database, redis, ollama] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkOllama(),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      dependencies: {
        database: this.getStatusFromPromise(database),
        redis: this.getStatusFromPromise(redis),
        ollama: this.getStatusFromPromise(ollama),
      },
    };
  }

  private async checkDatabase(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      throw {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  private async checkRedis(): Promise<{ status: string; latency: number }> {
    // Redis check would go here if we have a Redis service injected
    // For now, return a placeholder
    return {
      status: 'not_configured',
      latency: 0,
    };
  }

  private async checkOllama(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    try {
      const response = await axios.get(`${ollamaUrl}/api/tags`, {
        timeout: 5000,
      });

      return {
        status: response.status === 200 ? 'healthy' : 'degraded',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
      };
    }
  }

  private getStatusFromPromise(result: PromiseSettledResult<{ status: string; latency: number }>): {
    status: string;
    latency?: number;
    details?: unknown;
  } {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        details: result.reason,
      };
    }
  }
}
