/**
 * Multi-Region Database Distribution System
 * Handles global database distribution, failover, and load balancing
 */

import { EventEmitter } from 'events';
import { GlobalDatabaseCore, RegionConfig, DatabaseConfig } from './GlobalDatabaseCore';

export interface RegionHealth {
  regionId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  load: number;
  connections: number;
  lastCheck: Date;
  errors: number;
}

export interface FailoverConfig {
  enabled: boolean;
  threshold: {
    latency: number;
    errorRate: number;
    availability: number;
  };
  cooldown: number;
  maxRetries: number;
}

export interface LoadBalancingConfig {
  strategy: 'round-robin' | 'weighted' | 'latency-based' | 'ai-optimized';
  weights: Record<string, number>;
  healthCheckInterval: number;
  circuitBreaker: {
    enabled: boolean;
    threshold: number;
    timeout: number;
  };
}

export class MultiRegionManager extends EventEmitter {
  private regions: Map<string, RegionConfig> = new Map();
  private healthStatus: Map<string, RegionHealth> = new Map();
  private connections: Map<string, GlobalDatabaseCore> = new Map();
  private failoverConfig: FailoverConfig;
  private loadBalancingConfig: LoadBalancingConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private currentPrimary: string;

  constructor(
    private config: DatabaseConfig,
    failoverConfig: FailoverConfig,
    loadBalancingConfig: LoadBalancingConfig
  ) {
    super();
    this.failoverConfig = failoverConfig;
    this.loadBalancingConfig = loadBalancingConfig;
    this.currentPrimary = config.regions.find(r => r.role === 'primary')?.id || '';
    
    // Initialize regions
    config.regions.forEach(region => {
      this.regions.set(region.id, region);
      this.healthStatus.set(region.id, {
        regionId: region.id,
        status: 'healthy',
        latency: region.latency,
        load: 0,
        connections: 0,
        lastCheck: new Date(),
        errors: 0
      });
    });
  }

  async initialize(): Promise<void> {
    try {
      // Initialize database connections for each region
      await this.initializeRegionalConnections();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Set up failover mechanisms
      this.setupFailoverHandlers();
      
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async initializeRegionalConnections(): Promise<void> {
    const initPromises = Array.from(this.regions.values()).map(async (region) => {
      try {
        const regionConfig: DatabaseConfig = {
          ...this.config,
          regions: [region] // Single region config for this connection
        };
        
        const dbCore = new GlobalDatabaseCore(regionConfig);
        await dbCore.initialize();
        
        this.connections.set(region.id, dbCore);
        
        // Set up event handlers
        dbCore.on('error', (error) => {
          this.handleRegionError(region.id, error);
        });
        
        dbCore.on('performance', (metrics) => {
          this.updateRegionHealth(region.id, metrics);
        });
        
      } catch (error) {
        console.error(`Failed to initialize region ${region.id}:`, error);
        this.updateRegionStatus(region.id, 'unhealthy');
        throw error;
      }
    });

    await Promise.all(initPromises);
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(
      () => this.performHealthChecks(),
      this.loadBalancingConfig.healthCheckInterval
    );
  }

  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.regions.keys()).map(async (regionId) => {
      try {
        const startTime = Date.now();
        const connection = this.connections.get(regionId);
        
        if (!connection) {
          this.updateRegionStatus(regionId, 'unhealthy');
          return;
        }

        // Perform health check query
        await this.performHealthCheckQuery(connection);
        
        const latency = Date.now() - startTime;
        
        // Update health metrics
        const health = this.healthStatus.get(regionId)!;
        health.latency = latency;
        health.lastCheck = new Date();
        health.errors = Math.max(0, health.errors - 1); // Decay error count
        
        // Determine status based on thresholds
        if (latency > this.failoverConfig.threshold.latency) {
          health.status = 'degraded';
        } else if (health.errors > this.failoverConfig.threshold.errorRate) {
          health.status = 'unhealthy';
        } else {
          health.status = 'healthy';
        }
        
        this.healthStatus.set(regionId, health);
        
      } catch (error) {
        this.handleRegionError(regionId, error);
      }
    });

    await Promise.allSettled(healthPromises);
    
    // Check if failover is needed
    await this.checkFailoverConditions();
  }

  private async performHealthCheckQuery(connection: GlobalDatabaseCore): Promise<void> {
    // Simple health check - could be customized based on database type
    await connection.logEvent('health_check', { timestamp: new Date() });
  }

  private handleRegionError(regionId: string, error: any): void {
    const health = this.healthStatus.get(regionId)!;
    health.errors++;
    health.lastCheck = new Date();
    
    if (health.errors > this.failoverConfig.threshold.errorRate) {
      health.status = 'unhealthy';
    } else {
      health.status = 'degraded';
    }
    
    this.healthStatus.set(regionId, health);
    
    this.emit('region_error', { regionId, error, health });
  }

  private updateRegionHealth(regionId: string, metrics: any): void {
    const health = this.healthStatus.get(regionId)!;
    health.load = metrics.load || health.load;
    health.connections = metrics.connections || health.connections;
    health.latency = metrics.latency || health.latency;
    this.healthStatus.set(regionId, health);
  }

  private updateRegionStatus(regionId: string, status: RegionHealth['status']): void {
    const health = this.healthStatus.get(regionId)!;
    health.status = status;
    health.lastCheck = new Date();
    this.healthStatus.set(regionId, health);
  }

  private async checkFailoverConditions(): Promise<void> {
    if (!this.failoverConfig.enabled) return;

    const primaryHealth = this.healthStatus.get(this.currentPrimary);
    
    if (!primaryHealth || primaryHealth.status === 'unhealthy') {
      await this.performFailover();
    }
  }

  private async performFailover(): Promise<void> {
    const healthyRegions = Array.from(this.healthStatus.values())
      .filter(h => h.status === 'healthy' && h.regionId !== this.currentPrimary)
      .sort((a, b) => a.latency - b.latency);

    if (healthyRegions.length === 0) {
      this.emit('failover_failed', { reason: 'No healthy regions available' });
      return;
    }

    const newPrimary = healthyRegions[0].regionId;
    const oldPrimary = this.currentPrimary;
    
    try {
      // Promote new primary
      await this.promoteToPrimary(newPrimary);
      
      // Update current primary
      this.currentPrimary = newPrimary;
      
      this.emit('failover_completed', { 
        oldPrimary, 
        newPrimary, 
        reason: 'Primary region unhealthy' 
      });
      
    } catch (error) {
      this.emit('failover_failed', { error, oldPrimary, newPrimary });
    }
  }

  private async promoteToPrimary(regionId: string): Promise<void> {
    const region = this.regions.get(regionId)!;
    const connection = this.connections.get(regionId)!;
    
    // Update region role
    region.role = 'primary';
    this.regions.set(regionId, region);
    
    // Perform any necessary promotion operations
    await connection.logEvent('region_promoted', { 
      regionId, 
      timestamp: new Date(),
      previousPrimary: this.currentPrimary 
    });
  }

  private setupFailoverHandlers(): void {
    this.on('region_error', async ({ regionId, health }) => {
      if (regionId === this.currentPrimary && health.status === 'unhealthy') {
        await this.performFailover();
      }
    });
  }

  // ===== PUBLIC API =====

  async getOptimalRegion(operation: 'read' | 'write', userLocation?: string): Promise<string> {
    const availableRegions = Array.from(this.healthStatus.values())
      .filter(h => h.status !== 'unhealthy');

    if (availableRegions.length === 0) {
      throw new Error('No healthy regions available');
    }

    switch (this.loadBalancingConfig.strategy) {
      case 'latency-based':
        return this.selectByLatency(availableRegions, operation);
      
      case 'weighted':
        return this.selectByWeight(availableRegions, operation);
      
      case 'ai-optimized':
        return await this.selectByAI(availableRegions, operation, userLocation);
      
      case 'round-robin':
      default:
        return this.selectRoundRobin(availableRegions, operation);
    }
  }

  private selectByLatency(regions: RegionHealth[], operation: 'read' | 'write'): string {
    if (operation === 'write') {
      // For writes, prefer primary regions
      const primaryRegions = regions.filter(r => 
        this.regions.get(r.regionId)?.role === 'primary'
      );
      if (primaryRegions.length > 0) {
        return primaryRegions.sort((a, b) => a.latency - b.latency)[0].regionId;
      }
    }
    
    return regions.sort((a, b) => a.latency - b.latency)[0].regionId;
  }

  private selectByWeight(regions: RegionHealth[], operation: 'read' | 'write'): string {
    const weights = this.loadBalancingConfig.weights;
    const totalWeight = regions.reduce((sum, r) => sum + (weights[r.regionId] || 1), 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const region of regions) {
      currentWeight += weights[region.regionId] || 1;
      if (random <= currentWeight) {
        return region.regionId;
      }
    }
    
    return regions[0].regionId;
  }

  private async selectByAI(regions: RegionHealth[], operation: 'read' | 'write', userLocation?: string): Promise<string> {
    // AI-based selection considering:
    // - Current load
    // - Historical performance
    // - User location
    // - Time of day
    // - Predicted traffic patterns
    
    const factors = regions.map(region => ({
      regionId: region.regionId,
      score: this.calculateAIScore(region, operation, userLocation)
    }));
    
    return factors.sort((a, b) => b.score - a.score)[0].regionId;
  }

  private calculateAIScore(region: RegionHealth, operation: 'read' | 'write', userLocation?: string): number {
    let score = 100;
    
    // Latency factor (lower is better)
    score -= region.latency * 0.1;
    
    // Load factor (lower is better)
    score -= region.load * 0.2;
    
    // Health factor
    if (region.status === 'healthy') score += 20;
    else if (region.status === 'degraded') score += 5;
    else score -= 50;
    
    // Operation type factor
    const regionConfig = this.regions.get(region.regionId)!;
    if (operation === 'write' && regionConfig.role === 'primary') {
      score += 30;
    } else if (operation === 'read' && regionConfig.role === 'replica') {
      score += 10;
    }
    
    // Geographic proximity (if user location is provided)
    if (userLocation) {
      const proximity = this.calculateProximity(userLocation, regionConfig.name);
      score += proximity * 15;
    }
    
    return Math.max(0, score);
  }

  private calculateProximity(userLocation: string, regionName: string): number {
    // Simplified proximity calculation
    // In a real implementation, this would use actual geographic data
    const proximityMap: Record<string, Record<string, number>> = {
      'us': { 'us-east-1': 1, 'us-west-2': 0.8, 'eu-west-1': 0.3, 'ap-southeast-1': 0.2 },
      'eu': { 'eu-west-1': 1, 'us-east-1': 0.4, 'us-west-2': 0.3, 'ap-southeast-1': 0.2 },
      'asia': { 'ap-southeast-1': 1, 'eu-west-1': 0.3, 'us-west-2': 0.4, 'us-east-1': 0.2 }
    };
    
    const userRegion = userLocation.toLowerCase().includes('us') ? 'us' :
                      userLocation.toLowerCase().includes('eu') ? 'eu' : 'asia';
    
    return proximityMap[userRegion]?.[regionName] || 0.1;
  }

  private selectRoundRobin(regions: RegionHealth[], operation: 'read' | 'write'): string {
    // Simple round-robin selection
    const sortedRegions = regions.sort((a, b) => a.regionId.localeCompare(b.regionId));
    const index = Date.now() % sortedRegions.length;
    return sortedRegions[index].regionId;
  }

  async getConnection(regionId: string): Promise<GlobalDatabaseCore> {
    const connection = this.connections.get(regionId);
    if (!connection) {
      throw new Error(`No connection available for region: ${regionId}`);
    }
    
    const health = this.healthStatus.get(regionId);
    if (health?.status === 'unhealthy') {
      throw new Error(`Region ${regionId} is unhealthy`);
    }
    
    return connection;
  }

  getRegionHealth(regionId?: string): RegionHealth | RegionHealth[] {
    if (regionId) {
      const health = this.healthStatus.get(regionId);
      if (!health) {
        throw new Error(`Region ${regionId} not found`);
      }
      return health;
    }
    
    return Array.from(this.healthStatus.values());
  }

  async executeQuery(operation: 'read' | 'write', query: () => Promise<any>, userLocation?: string): Promise<any> {
    const maxRetries = this.failoverConfig.maxRetries;
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const regionId = await this.getOptimalRegion(operation, userLocation);
        const connection = await this.getConnection(regionId);
        
        const result = await query();
        
        // Update success metrics
        const health = this.healthStatus.get(regionId)!;
        health.errors = Math.max(0, health.errors - 1);
        this.healthStatus.set(regionId, health);
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Wait before retry
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.failoverConfig.cooldown));
        }
      }
    }
    
    throw lastError;
  }

  async shutdown(): Promise<void> {
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Close all connections
    const closePromises = Array.from(this.connections.values()).map(async (connection) => {
      // Assuming GlobalDatabaseCore has a shutdown method
      if (typeof (connection as any).shutdown === 'function') {
        await (connection as any).shutdown();
      }
    });
    
    await Promise.all(closePromises);
    
    this.emit('shutdown');
  }

  // ===== MONITORING AND METRICS =====

  getMetrics(): any {
    return {
      regions: Array.from(this.healthStatus.values()),
      currentPrimary: this.currentPrimary,
      totalConnections: Array.from(this.healthStatus.values())
        .reduce((sum, h) => sum + h.connections, 0),
      averageLatency: Array.from(this.healthStatus.values())
        .reduce((sum, h) => sum + h.latency, 0) / this.healthStatus.size,
      healthyRegions: Array.from(this.healthStatus.values())
        .filter(h => h.status === 'healthy').length,
      totalRegions: this.healthStatus.size
    };
  }

  async rebalanceLoad(): Promise<void> {
    // Implement load rebalancing logic
    const regions = Array.from(this.healthStatus.values());
    const averageLoad = regions.reduce((sum, r) => sum + r.load, 0) / regions.length;
    
    const overloadedRegions = regions.filter(r => r.load > averageLoad * 1.5);
    const underloadedRegions = regions.filter(r => r.load < averageLoad * 0.5);
    
    if (overloadedRegions.length > 0 && underloadedRegions.length > 0) {
      // Implement connection migration logic
      this.emit('load_rebalancing', { overloadedRegions, underloadedRegions });
    }
  }
}

export default MultiRegionManager;
