import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  slowestRequests: Array<{
    method: string;
    url: string;
    duration: number;
    timestamp: Date;
  }>;
}

const metrics: PerformanceMetrics = {
  requestCount: 0,
  totalResponseTime: 0,
  averageResponseTime: 0,
  slowestRequests: [],
};

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    // Update metrics
    metrics.requestCount++;
    metrics.totalResponseTime += duration;
    metrics.averageResponseTime = metrics.totalResponseTime / metrics.requestCount;
    
    // Track slow requests (>1 second)
    if (duration > 1000) {
      metrics.slowestRequests.push({
        method: req.method,
        url: req.url,
        duration,
        timestamp: new Date(),
      });
      
      // Keep only the 10 slowest requests
      metrics.slowestRequests.sort((a, b) => b.duration - a.duration);
      metrics.slowestRequests = metrics.slowestRequests.slice(0, 10);
    }
    
    // Log slow requests
    if (duration > 2000) {
      console.warn(`[Performance] Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

export const getPerformanceMetrics = (): PerformanceMetrics => {
  return { ...metrics };
};

export const resetPerformanceMetrics = (): void => {
  metrics.requestCount = 0;
  metrics.totalResponseTime = 0;
  metrics.averageResponseTime = 0;
  metrics.slowestRequests = [];
};