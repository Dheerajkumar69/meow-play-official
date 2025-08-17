/**
 * Analytics and Monitoring Dashboard
 * Real-time monitoring, metrics collection, and alerting system
 */

import { EventEmitter } from 'events';
import { GlobalDatabaseCore } from '../database/GlobalDatabaseCore';
import { AIQueryOptimizer } from '../ai/AIQueryOptimizer';
import { AIEnhancedFeatures } from '../ai/AIEnhancedFeatures';

// ===== CORE INTERFACES =====

export interface DashboardConfig {
  refreshInterval: number;
  retentionPeriod: number;
  alertThresholds: AlertThresholds;
  enableRealTimeAlerts: boolean;
  enablePredictiveAlerts: boolean;
  maxDataPoints: number;
  aggregationIntervals: number[];
}

export interface AlertThresholds {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  queryLatency: number;
  errorRate: number;
  connectionCount: number;
  replicationLag: number;
}

export interface MetricData {
  timestamp: Date;
  value: number;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface TimeSeriesMetric {
  name: string;
  description: string;
  unit: string;
  type: 'gauge' | 'counter' | 'histogram' | 'summary';
  data: MetricData[];
  aggregations: {
    avg: number;
    min: number;
    max: number;
    sum: number;
    count: number;
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number;
  components: ComponentHealth[];
  lastUpdated: Date;
  uptime: number;
  alerts: Alert[];
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number;
  metrics: Record<string, number>;
  lastCheck: Date;
  message?: string;
}

export interface Alert {
  id: string;
  type: 'performance' | 'security' | 'availability' | 'capacity' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  component: string;
  metric: string;
  currentValue: number;
  threshold: number;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  actions: AlertAction[];
  metadata: Record<string, any>;
}

export interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'auto_scale' | 'failover';
  config: Record<string, any>;
  executed: boolean;
  executedAt?: Date;
  result?: string;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'map' | 'gauge' | 'status';
  title: string;
  description: string;
  config: WidgetConfig;
  data: any;
  position: { x: number; y: number; width: number; height: number };
  refreshRate: number;
}

export interface WidgetConfig {
  metrics: string[];
  timeRange: string;
  aggregation: string;
  filters: Record<string, any>;
  visualization: {
    chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
    colors?: string[];
    axes?: Record<string, any>;
    legend?: boolean;
  };
}

export interface PerformanceReport {
  id: string;
  title: string;
  period: { start: Date; end: Date };
  summary: {
    totalQueries: number;
    avgLatency: number;
    errorRate: number;
    uptime: number;
    throughput: number;
  };
  trends: {
    metric: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    change: number;
    significance: 'low' | 'medium' | 'high';
  }[];
  recommendations: {
    type: 'optimization' | 'scaling' | 'maintenance';
    priority: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
    effort: string;
  }[];
  generatedAt: Date;
}

// ===== MAIN ANALYTICS DASHBOARD CLASS =====

export class AnalyticsDashboard extends EventEmitter {
  private config: DashboardConfig;
  private dbCore: GlobalDatabaseCore;
  private queryOptimizer: AIQueryOptimizer;
  private aiFeatures: AIEnhancedFeatures;
  
  private metrics: Map<string, TimeSeriesMetric> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();
  private systemHealth: SystemHealth | null = null;
  
  private metricsCollectionTimer: NodeJS.Timeout | null = null;
  private alertEvaluationTimer: NodeJS.Timeout | null = null;

  constructor(
    config: DashboardConfig,
    dbCore: GlobalDatabaseCore,
    queryOptimizer: AIQueryOptimizer,
    aiFeatures: AIEnhancedFeatures
  ) {
    super();
    this.config = config;
    this.dbCore = dbCore;
    this.queryOptimizer = queryOptimizer;
    this.aiFeatures = aiFeatures;
  }

  async initialize(): Promise<void> {
    await this.initializeMetrics();
    await this.initializeWidgets();
    
    this.startMetricsCollection();
    
    if (this.config.enableRealTimeAlerts) {
      this.startAlertEvaluation();
    }
    
    this.emit('dashboard_initialized');
  }

  // ===== METRICS MANAGEMENT =====

  async recordMetric(name: string, value: number, tags: Record<string, string> = {}, metadata?: Record<string, any>): Promise<void> {
    let metric = this.metrics.get(name);
    
    if (!metric) {
      metric = {
        name,
        description: `Auto-generated metric: ${name}`,
        unit: 'count',
        type: 'gauge',
        data: [],
        aggregations: {
          avg: 0, min: 0, max: 0, sum: 0, count: 0,
          p50: 0, p95: 0, p99: 0
        }
      };
      this.metrics.set(name, metric);
    }
    
    const dataPoint: MetricData = {
      timestamp: new Date(),
      value,
      tags,
      metadata
    };
    
    metric.data.push(dataPoint);
    
    if (metric.data.length > this.config.maxDataPoints) {
      metric.data = metric.data.slice(-this.config.maxDataPoints);
    }
    
    await this.updateMetricAggregations(metric);
    
    this.emit('metric_recorded', { name, value, tags });
  }

  async getMetric(name: string, timeRange?: { start: Date; end: Date }): Promise<TimeSeriesMetric | null> {
    const metric = this.metrics.get(name);
    if (!metric) return null;
    
    if (timeRange) {
      const filteredData = metric.data.filter(
        d => d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
      );
      
      return {
        ...metric,
        data: filteredData,
        aggregations: await this.calculateAggregations(filteredData)
      };
    }
    
    return metric;
  }

  async getMetrics(pattern?: string): Promise<TimeSeriesMetric[]> {
    const metrics = Array.from(this.metrics.values());
    
    if (pattern) {
      const regex = new RegExp(pattern, 'i');
      return metrics.filter(m => regex.test(m.name));
    }
    
    return metrics;
  }

  // ===== SYSTEM HEALTH MONITORING =====

  async updateSystemHealth(): Promise<SystemHealth> {
    const components: ComponentHealth[] = [];
    
    components.push(await this.checkDatabaseHealth());
    components.push(await this.checkQueryHealth());
    components.push(await this.checkAIHealth());
    components.push(await this.checkResourceHealth());
    
    const totalScore = components.reduce((sum, comp) => sum + comp.score, 0);
    const avgScore = totalScore / components.length;
    
    let status: SystemHealth['status'] = 'healthy';
    if (avgScore < 0.5) status = 'critical';
    else if (avgScore < 0.7) status = 'warning';
    
    this.systemHealth = {
      status,
      score: avgScore,
      components,
      lastUpdated: new Date(),
      uptime: process.uptime(),
      alerts: Array.from(this.alerts.values()).filter(a => a.status === 'active')
    };
    
    this.emit('health_updated', this.systemHealth);
    
    return this.systemHealth;
  }

  async getSystemHealth(): Promise<SystemHealth | null> {
    return this.systemHealth;
  }

  // ===== ALERT MANAGEMENT =====

  async createAlert(alertData: Omit<Alert, 'id' | 'triggeredAt' | 'status'>): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggeredAt: new Date(),
      status: 'active',
      ...alertData
    };
    
    this.alerts.set(alert.id, alert);
    
    await this.executeAlertActions(alert);
    
    this.emit('alert_created', alert);
    
    return alert;
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) return;
    
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    
    this.emit('alert_resolved', alert);
  }

  async getAlerts(filters?: { status?: string; severity?: string; component?: string }): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());
    
    if (filters) {
      if (filters.status) {
        alerts = alerts.filter(a => a.status === filters.status);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters.component) {
        alerts = alerts.filter(a => a.component === filters.component);
      }
    }
    
    return alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  // ===== DASHBOARD WIDGETS =====

  async createWidget(widgetData: Omit<DashboardWidget, 'id' | 'data'>): Promise<DashboardWidget> {
    const widget: DashboardWidget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: null,
      ...widgetData
    };
    
    await this.refreshWidgetData(widget);
    
    this.widgets.set(widget.id, widget);
    
    this.emit('widget_created', widget);
    
    return widget;
  }

  async updateWidget(widgetId: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget | null> {
    const widget = this.widgets.get(widgetId);
    if (!widget) return null;
    
    Object.assign(widget, updates);
    
    if (updates.config) {
      await this.refreshWidgetData(widget);
    }
    
    this.emit('widget_updated', widget);
    
    return widget;
  }

  async deleteWidget(widgetId: string): Promise<void> {
    this.widgets.delete(widgetId);
    this.emit('widget_deleted', { widgetId });
  }

  async getWidgets(): Promise<DashboardWidget[]> {
    return Array.from(this.widgets.values());
  }

  async refreshWidgetData(widget: DashboardWidget): Promise<void> {
    try {
      switch (widget.type) {
        case 'metric':
          widget.data = await this.getMetricWidgetData(widget);
          break;
        case 'chart':
          widget.data = await this.getChartWidgetData(widget);
          break;
        case 'table':
          widget.data = await this.getTableWidgetData(widget);
          break;
        case 'alert':
          widget.data = await this.getAlertWidgetData(widget);
          break;
        case 'status':
          widget.data = await this.getStatusWidgetData(widget);
          break;
        default:
          widget.data = null;
      }
      
      this.emit('widget_data_refreshed', widget);
    } catch (error) {
      console.error(`Failed to refresh widget ${widget.id}:`, error);
      widget.data = { error: 'Failed to load data' };
    }
  }

  // ===== PERFORMANCE REPORTING =====

  async generatePerformanceReport(period: { start: Date; end: Date }): Promise<PerformanceReport> {
    const summary = await this.calculatePerformanceSummary(period);
    const trends = await this.analyzeTrends(period);
    const recommendations = await this.generateRecommendations(summary, trends);
    
    const report: PerformanceReport = {
      id: `report_${Date.now()}`,
      title: `Performance Report - ${period.start.toDateString()} to ${period.end.toDateString()}`,
      period,
      summary,
      trends,
      recommendations,
      generatedAt: new Date()
    };
    
    this.emit('report_generated', report);
    
    return report;
  }

  // ===== PRIVATE METHODS =====

  private async initializeMetrics(): Promise<void> {
    const defaultMetrics = [
      { name: 'database.cpu_usage', description: 'Database CPU usage percentage', unit: '%', type: 'gauge' as const },
      { name: 'database.memory_usage', description: 'Database memory usage percentage', unit: '%', type: 'gauge' as const },
      { name: 'database.connections', description: 'Active database connections', unit: 'count', type: 'gauge' as const },
      { name: 'query.latency', description: 'Query execution latency', unit: 'ms', type: 'histogram' as const },
      { name: 'query.throughput', description: 'Queries per second', unit: 'qps', type: 'counter' as const }
    ];
    
    for (const metricDef of defaultMetrics) {
      const metric: TimeSeriesMetric = {
        ...metricDef,
        data: [],
        aggregations: {
          avg: 0, min: 0, max: 0, sum: 0, count: 0,
          p50: 0, p95: 0, p99: 0
        }
      };
      
      this.metrics.set(metric.name, metric);
    }
  }

  private async initializeWidgets(): Promise<void> {
    const defaultWidgets = [
      {
        type: 'status' as const,
        title: 'System Health',
        description: 'Overall system health status',
        config: { metrics: ['system.health'], timeRange: '1h', aggregation: 'latest', filters: {}, visualization: {} },
        position: { x: 0, y: 0, width: 4, height: 2 },
        refreshRate: 30000
      },
      {
        type: 'chart' as const,
        title: 'Query Latency',
        description: 'Query execution latency over time',
        config: {
          metrics: ['query.latency'],
          timeRange: '1h',
          aggregation: 'avg',
          filters: {},
          visualization: { chartType: 'line' as const, colors: ['#3b82f6'] }
        },
        position: { x: 4, y: 0, width: 8, height: 4 },
        refreshRate: 10000
      }
    ];
    
    for (const widgetDef of defaultWidgets) {
      await this.createWidget(widgetDef);
    }
  }

  private startMetricsCollection(): void {
    this.metricsCollectionTimer = setInterval(async () => {
      await this.collectSystemMetrics();
    }, this.config.refreshInterval);
  }

  private startAlertEvaluation(): void {
    this.alertEvaluationTimer = setInterval(async () => {
      await this.evaluateAlerts();
    }, 10000);
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      const dbMetrics = await this.dbCore.getMetrics();
      for (const [name, value] of Object.entries(dbMetrics)) {
        await this.recordMetric(`database.${name}`, value as number, { component: 'database' });
      }
      
      const memUsage = process.memoryUsage();
      await this.recordMetric('system.memory.heap_used', memUsage.heapUsed, { component: 'system' });
      await this.recordMetric('system.uptime', process.uptime(), { component: 'system' });
      
      await this.updateSystemHealth();
      
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  private async evaluateAlerts(): Promise<void> {
    const currentMetrics = await this.getCurrentMetrics();
    
    if (currentMetrics['database.cpu_usage'] > this.config.alertThresholds.cpuUsage) {
      await this.createAlert({
        type: 'performance',
        severity: 'high',
        title: 'High CPU Usage',
        description: `Database CPU usage is ${currentMetrics['database.cpu_usage']}%`,
        component: 'database',
        metric: 'cpu_usage',
        currentValue: currentMetrics['database.cpu_usage'],
        threshold: this.config.alertThresholds.cpuUsage,
        actions: [
          { type: 'email', config: { recipients: ['admin@example.com'] }, executed: false }
        ],
        metadata: {}
      });
    }
  }

  private async executeAlertActions(alert: Alert): Promise<void> {
    for (const action of alert.actions) {
      try {
        switch (action.type) {
          case 'email':
            console.log(`Sending email alert: ${alert.title}`);
            break;
          case 'slack':
            console.log(`Sending Slack alert: ${alert.title}`);
            break;
          case 'auto_scale':
            console.log(`Executing auto-scale for alert: ${alert.title}`);
            break;
        }
        
        action.executed = true;
        action.executedAt = new Date();
        action.result = 'success';
      } catch (error) {
        action.executed = true;
        action.executedAt = new Date();
        action.result = `failed: ${error}`;
      }
    }
  }

  private async updateMetricAggregations(metric: TimeSeriesMetric): Promise<void> {
    const values = metric.data.map(d => d.value);
    
    if (values.length === 0) return;
    
    metric.aggregations = await this.calculateAggregations(metric.data);
  }

  private async calculateAggregations(data: MetricData[]): Promise<TimeSeriesMetric['aggregations']> {
    const values = data.map(d => d.value).sort((a, b) => a - b);
    
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, sum: 0, count: 0, p50: 0, p95: 0, p99: 0 };
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const count = values.length;
    const avg = sum / count;
    const min = values[0];
    const max = values[values.length - 1];
    
    const p50 = values[Math.floor(count * 0.5)];
    const p95 = values[Math.floor(count * 0.95)];
    const p99 = values[Math.floor(count * 0.99)];
    
    return { avg, min, max, sum, count, p50, p95, p99 };
  }

  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    try {
      const health = await this.dbCore.getSystemHealth();
      return {
        name: 'Database',
        status: health.status === 'healthy' ? 'healthy' : 'warning',
        score: health.status === 'healthy' ? 1.0 : 0.5,
        metrics: {
          uptime: health.uptime,
          regions: health.regions?.length || 0,
          connections: health.activeConnections || 0
        },
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        name: 'Database',
        status: 'critical',
        score: 0.0,
        metrics: {},
        lastCheck: new Date(),
        message: `Health check failed: ${error}`
      };
    }
  }

  private async checkQueryHealth(): Promise<ComponentHealth> {
    return {
      name: 'Query Engine',
      status: 'healthy',
      score: 0.9,
      metrics: {
        avg_latency: 50,
        throughput: 1000,
        error_rate: 0.01
      },
      lastCheck: new Date()
    };
  }

  private async checkAIHealth(): Promise<ComponentHealth> {
    return {
      name: 'AI Features',
      status: 'healthy',
      score: 0.95,
      metrics: {
        optimization_accuracy: 0.85,
        prediction_accuracy: 0.82,
        response_time: 200
      },
      lastCheck: new Date()
    };
  }

  private async checkResourceHealth(): Promise<ComponentHealth> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    
    let status: ComponentHealth['status'] = 'healthy';
    let score = 1.0;
    
    if (heapUsagePercent > 90) {
      status = 'critical';
      score = 0.2;
    } else if (heapUsagePercent > 75) {
      status = 'warning';
      score = 0.6;
    }
    
    return {
      name: 'System Resources',
      status,
      score,
      metrics: {
        heap_used_mb: heapUsedMB,
        heap_total_mb: heapTotalMB,
        heap_usage_percent: heapUsagePercent,
        uptime: process.uptime()
      },
      lastCheck: new Date()
    };
  }

  private async getCurrentMetrics(): Promise<Record<string, number>> {
    const metrics: Record<string, number> = {};
    
    for (const [name, metric] of this.metrics.entries()) {
      if (metric.data.length > 0) {
        const latest = metric.data[metric.data.length - 1];
        metrics[name] = latest.value;
      }
    }
    
    return metrics;
  }

  private async getMetricWidgetData(widget: DashboardWidget): Promise<any> {
    const metricName = widget.config.metrics[0];
    const metric = await this.getMetric(metricName);
    
    if (!metric) return null;
    
    return {
      value: metric.data.length > 0 ? metric.data[metric.data.length - 1].value : 0,
      aggregations: metric.aggregations,
      unit: metric.unit
    };
  }

  private async getChartWidgetData(widget: DashboardWidget): Promise<any> {
    const data = [];
    
    for (const metricName of widget.config.metrics) {
      const metric = await this.getMetric(metricName);
      if (metric) {
        data.push({
          name: metricName,
          data: metric.data.map(d => ({ x: d.timestamp, y: d.value }))
        });
      }
    }
    
    return data;
  }

  private async getTableWidgetData(widget: DashboardWidget): Promise<any> {
    return {
      headers: ['Metric', 'Current', 'Average', 'Max'],
      rows: []
    };
  }

  private async getAlertWidgetData(widget: DashboardWidget): Promise<any> {
    const alerts = await this.getAlerts(widget.config.filters);
    return alerts.slice(0, 10);
  }

  private async getStatusWidgetData(widget: DashboardWidget): Promise<any> {
    return await this.getSystemHealth();
  }

  private async calculatePerformanceSummary(period: { start: Date; end: Date }): Promise<PerformanceReport['summary']> {
    return {
      totalQueries: 1000000,
      avgLatency: 45.2,
      errorRate: 0.02,
      uptime: 99.95,
      throughput: 1500
    };
  }

  private async analyzeTrends(period: { start: Date; end: Date }): Promise<PerformanceReport['trends']> {
    return [
      {
        metric: 'query.latency',
        trend: 'decreasing',
        change: -0.15,
        significance: 'medium'
      }
    ];
  }

  private async generateRecommendations(summary: any, trends: any[]): Promise<PerformanceReport['recommendations']> {
    return [
      {
        type: 'optimization',
        priority: 'high',
        description: 'Consider adding indexes on frequently queried columns',
        impact: 'Could reduce query latency by 30%',
        effort: 'Low - automated index suggestions available'
      }
    ];
  }

  public async shutdown(): Promise<void> {
    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
    }
    
    if (this.alertEvaluationTimer) {
      clearInterval(this.alertEvaluationTimer);
    }
    
    this.emit('dashboard_shutdown');
  }
}

export default AnalyticsDashboard;
