/**
 * REST API Layer for Ultimate Global Database
 * Comprehensive REST endpoints for database operations and AI features
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GlobalDatabaseCore } from '../database/GlobalDatabaseCore';
import { AIQueryOptimizer } from '../ai/AIQueryOptimizer';
import { AIEnhancedFeatures } from '../ai/AIEnhancedFeatures';
import { CRDTCollaborationEngine } from '../collaboration/CRDTCollaborationEngine';

// ===== INTERFACES =====

export interface APIConfig {
  port: number;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableSwagger: boolean;
  enableMetrics: boolean;
  apiVersion: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId: string;
  version: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface QueryParams extends PaginationParams {
  search?: string;
  filter?: string;
  sort?: string;
  fields?: string;
}

// ===== MAIN REST API CLASS =====

export class RestAPI {
  private app: express.Application;
  private config: APIConfig;
  private dbCore: GlobalDatabaseCore;
  private queryOptimizer: AIQueryOptimizer;
  private aiFeatures: AIEnhancedFeatures;
  private crdtEngine: CRDTCollaborationEngine;

  constructor(
    config: APIConfig,
    dbCore: GlobalDatabaseCore,
    queryOptimizer: AIQueryOptimizer,
    aiFeatures: AIEnhancedFeatures,
    crdtEngine: CRDTCollaborationEngine
  ) {
    this.app = express();
    this.config = config;
    this.dbCore = dbCore;
    this.queryOptimizer = queryOptimizer;
    this.aiFeatures = aiFeatures;
    this.crdtEngine = crdtEngine;
  }

  async initialize(): Promise<void> {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    
    if (this.config.enableSwagger) {
      this.setupSwagger();
    }
    
    if (this.config.enableMetrics) {
      this.setupMetrics();
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMaxRequests,
      message: 'Too many requests from this IP'
    });
    this.app.use(limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request ID and logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || this.generateRequestId();
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.headers['x-request-id']}`);
      next();
    });
  }

  private setupRoutes(): void {
    const apiRouter = express.Router();
    
    // Health check
    apiRouter.get('/health', this.healthCheck.bind(this));
    apiRouter.get('/status', this.systemStatus.bind(this));
    
    // User routes
    apiRouter.get('/users', this.getUsers.bind(this));
    apiRouter.get('/users/:id', this.getUser.bind(this));
    apiRouter.post('/users', this.createUser.bind(this));
    apiRouter.put('/users/:id', this.updateUser.bind(this));
    apiRouter.delete('/users/:id', this.deleteUser.bind(this));
    
    // Project routes
    apiRouter.get('/projects', this.getProjects.bind(this));
    apiRouter.get('/projects/:id', this.getProject.bind(this));
    apiRouter.post('/projects', this.createProject.bind(this));
    apiRouter.put('/projects/:id', this.updateProject.bind(this));
    apiRouter.delete('/projects/:id', this.deleteProject.bind(this));
    
    // Query optimization routes
    apiRouter.post('/query/optimize', this.optimizeQuery.bind(this));
    apiRouter.get('/query/metrics', this.getQueryMetrics.bind(this));
    apiRouter.post('/query/metrics', this.recordQueryMetrics.bind(this));
    apiRouter.post('/query/natural-language', this.processNaturalLanguageQuery.bind(this));
    
    // AI features routes
    apiRouter.get('/ai/insights/:database', this.getDataInsights.bind(this));
    apiRouter.get('/ai/index-suggestions/:database', this.getIndexSuggestions.bind(this));
    apiRouter.post('/ai/index-suggestions/:id/implement', this.implementIndexSuggestion.bind(this));
    apiRouter.get('/ai/predictions/:database', this.getPredictions.bind(this));
    apiRouter.post('/ai/migrations/generate', this.generateSmartMigration.bind(this));
    apiRouter.post('/ai/migrations/:id/execute', this.executeMigration.bind(this));
    apiRouter.get('/ai/scaling/evaluate/:database', this.evaluateScaling.bind(this));
    apiRouter.post('/ai/scaling/:id/execute', this.executeScaling.bind(this));
    
    // CRDT collaboration routes
    apiRouter.get('/crdt/documents/:id', this.getCRDTDocument.bind(this));
    apiRouter.post('/crdt/documents', this.createCRDTDocument.bind(this));
    apiRouter.post('/crdt/documents/:id/operations', this.applyCRDTOperation.bind(this));
    apiRouter.post('/crdt/documents/:id/join', this.joinDocument.bind(this));
    apiRouter.post('/crdt/documents/:id/leave', this.leaveDocument.bind(this));
    apiRouter.post('/crdt/documents/:id/comments', this.addComment.bind(this));
    apiRouter.put('/crdt/documents/:id/presence', this.updatePresence.bind(this));
    
    // Database management routes
    apiRouter.get('/database/regions', this.getDatabaseRegions.bind(this));
    apiRouter.get('/database/regions/:region/status', this.getRegionStatus.bind(this));
    apiRouter.post('/database/failover', this.triggerFailover.bind(this));
    apiRouter.get('/database/analytics', this.getDatabaseAnalytics.bind(this));
    
    // Mount API routes
    this.app.use(`/api/${this.config.apiVersion}`, apiRouter);
  }

  // ===== HEALTH AND STATUS ENDPOINTS =====

  private async healthCheck(req: Request, res: Response): Promise<void> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: this.config.apiVersion,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: await this.dbCore.getSystemHealth()
    };
    
    this.sendResponse(res, health);
  }

  private async systemStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.dbCore.getSystemHealth();
      this.sendResponse(res, status);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get system status', error);
    }
  }

  // ===== USER ENDPOINTS =====

  private async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { limit, offset } = this.extractPaginationParams(req);
      const users = await this.dbCore.getUsers(limit, offset);
      this.sendResponse(res, users);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get users', error);
    }
  }

  private async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.dbCore.getUserById(id);
      
      if (!user) {
        this.sendError(res, 404, 'User not found');
        return;
      }
      
      this.sendResponse(res, user);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get user', error);
    }
  }

  private async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const user = await this.dbCore.createUser(userData);
      this.sendResponse(res, user, 'User created successfully', 201);
    } catch (error) {
      this.sendError(res, 400, 'Failed to create user', error);
    }
  }

  private async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userData = req.body;
      const user = await this.dbCore.updateUser(id, userData);
      this.sendResponse(res, user, 'User updated successfully');
    } catch (error) {
      this.sendError(res, 400, 'Failed to update user', error);
    }
  }

  private async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.dbCore.deleteUser(id);
      this.sendResponse(res, { success }, 'User deleted successfully');
    } catch (error) {
      this.sendError(res, 400, 'Failed to delete user', error);
    }
  }

  // ===== PROJECT ENDPOINTS =====

  private async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;
      const { limit, offset } = this.extractPaginationParams(req);
      const projects = await this.dbCore.getProjects(userId as string, limit, offset);
      this.sendResponse(res, projects);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get projects', error);
    }
  }

  private async getProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const project = await this.dbCore.getProjectById(id);
      
      if (!project) {
        this.sendError(res, 404, 'Project not found');
        return;
      }
      
      this.sendResponse(res, project);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get project', error);
    }
  }

  private async createProject(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const projectData = req.body;
      const project = await this.dbCore.createProject(userId, projectData);
      this.sendResponse(res, project, 'Project created successfully', 201);
    } catch (error) {
      this.sendError(res, 400, 'Failed to create project', error);
    }
  }

  private async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const projectData = req.body;
      const project = await this.dbCore.updateProject(id, projectData);
      this.sendResponse(res, project, 'Project updated successfully');
    } catch (error) {
      this.sendError(res, 400, 'Failed to update project', error);
    }
  }

  private async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.dbCore.deleteProject(id);
      this.sendResponse(res, { success }, 'Project deleted successfully');
    } catch (error) {
      this.sendError(res, 400, 'Failed to delete project', error);
    }
  }

  // ===== QUERY OPTIMIZATION ENDPOINTS =====

  private async optimizeQuery(req: Request, res: Response): Promise<void> {
    try {
      const { sql, userId, database, tables } = req.body;
      const result = await this.queryOptimizer.optimizeQuery(sql, { userId, database, tables });
      this.sendResponse(res, result);
    } catch (error) {
      this.sendError(res, 400, 'Failed to optimize query', error);
    }
  }

  private async getQueryMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { queryId, limit } = req.query;
      // Mock implementation - in real system, fetch from metrics store
      const metrics = [];
      this.sendResponse(res, metrics);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get query metrics', error);
    }
  }

  private async recordQueryMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = req.body;
      await this.queryOptimizer.recordQueryMetrics(metrics);
      this.sendResponse(res, { success: true }, 'Metrics recorded successfully');
    } catch (error) {
      this.sendError(res, 400, 'Failed to record metrics', error);
    }
  }

  private async processNaturalLanguageQuery(req: Request, res: Response): Promise<void> {
    try {
      const { query, context } = req.body;
      const result = await this.queryOptimizer.processNaturalLanguageQuery(query, context);
      this.sendResponse(res, result);
    } catch (error) {
      this.sendError(res, 400, 'Failed to process natural language query', error);
    }
  }

  // ===== AI FEATURES ENDPOINTS =====

  private async getDataInsights(req: Request, res: Response): Promise<void> {
    try {
      const { database } = req.params;
      const { tables } = req.query;
      const tableList = tables ? (tables as string).split(',') : undefined;
      const insights = await this.aiFeatures.generateDataInsights(database, tableList);
      this.sendResponse(res, insights);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get data insights', error);
    }
  }

  private async getIndexSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { database } = req.params;
      const suggestions = await this.aiFeatures.analyzeIndexingOpportunities(database);
      this.sendResponse(res, suggestions);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get index suggestions', error);
    }
  }

  private async implementIndexSuggestion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.aiFeatures.implementIndexSuggestion(id);
      this.sendResponse(res, result);
    } catch (error) {
      this.sendError(res, 400, 'Failed to implement index suggestion', error);
    }
  }

  private async getPredictions(req: Request, res: Response): Promise<void> {
    try {
      const { database } = req.params;
      const { metrics } = req.query;
      const metricList = metrics ? (metrics as string).split(',') : ['cpu_usage', 'memory_usage'];
      const predictions = await this.aiFeatures.generatePredictions(database, metricList);
      this.sendResponse(res, predictions);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get predictions', error);
    }
  }

  private async generateSmartMigration(req: Request, res: Response): Promise<void> {
    try {
      const { description, context } = req.body;
      const migration = await this.aiFeatures.generateSmartMigration(description, context);
      this.sendResponse(res, migration);
    } catch (error) {
      this.sendError(res, 400, 'Failed to generate migration', error);
    }
  }

  private async executeMigration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.aiFeatures.executeMigration(id);
      this.sendResponse(res, result);
    } catch (error) {
      this.sendError(res, 400, 'Failed to execute migration', error);
    }
  }

  private async evaluateScaling(req: Request, res: Response): Promise<void> {
    try {
      const { database } = req.params;
      const { metrics } = req.body;
      const decision = await this.aiFeatures.evaluateScalingNeeds(database, metrics);
      this.sendResponse(res, decision);
    } catch (error) {
      this.sendError(res, 500, 'Failed to evaluate scaling', error);
    }
  }

  private async executeScaling(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.aiFeatures.executeScalingDecision(id);
      this.sendResponse(res, result);
    } catch (error) {
      this.sendError(res, 400, 'Failed to execute scaling', error);
    }
  }

  // ===== CRDT COLLABORATION ENDPOINTS =====

  private async getCRDTDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const document = await this.crdtEngine.getDocument(id);
      
      if (!document) {
        this.sendError(res, 404, 'Document not found');
        return;
      }
      
      this.sendResponse(res, document);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get document', error);
    }
  }

  private async createCRDTDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id, type, content, metadata } = req.body;
      const document = await this.crdtEngine.createDocument(id, type, content, metadata);
      this.sendResponse(res, document, 'Document created successfully', 201);
    } catch (error) {
      this.sendError(res, 400, 'Failed to create document', error);
    }
  }

  private async applyCRDTOperation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const operation = req.body;
      const result = await this.crdtEngine.applyOperation(id, operation);
      this.sendResponse(res, result);
    } catch (error) {
      this.sendError(res, 400, 'Failed to apply operation', error);
    }
  }

  private async joinDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, nodeId, permissions } = req.body;
      await this.crdtEngine.joinDocument(id, userId, nodeId, permissions);
      this.sendResponse(res, { success: true }, 'Joined document successfully');
    } catch (error) {
      this.sendError(res, 400, 'Failed to join document', error);
    }
  }

  private async leaveDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      await this.crdtEngine.leaveDocument(id, userId);
      this.sendResponse(res, { success: true }, 'Left document successfully');
    } catch (error) {
      this.sendError(res, 400, 'Failed to leave document', error);
    }
  }

  private async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, content, position } = req.body;
      const comment = await this.crdtEngine.addComment(id, userId, content, position);
      this.sendResponse(res, comment, 'Comment added successfully', 201);
    } catch (error) {
      this.sendError(res, 400, 'Failed to add comment', error);
    }
  }

  private async updatePresence(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, cursor, selection } = req.body;
      await this.crdtEngine.updateUserPresence(id, userId, cursor, selection);
      this.sendResponse(res, { success: true }, 'Presence updated successfully');
    } catch (error) {
      this.sendError(res, 400, 'Failed to update presence', error);
    }
  }

  // ===== DATABASE MANAGEMENT ENDPOINTS =====

  private async getDatabaseRegions(req: Request, res: Response): Promise<void> {
    try {
      const regions = await this.dbCore.getAvailableRegions();
      this.sendResponse(res, regions);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get database regions', error);
    }
  }

  private async getRegionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { region } = req.params;
      const status = await this.dbCore.getRegionStatus(region);
      this.sendResponse(res, status);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get region status', error);
    }
  }

  private async triggerFailover(req: Request, res: Response): Promise<void> {
    try {
      const { fromRegion, toRegion } = req.body;
      const result = await this.dbCore.triggerFailover(fromRegion, toRegion);
      this.sendResponse(res, result);
    } catch (error) {
      this.sendError(res, 400, 'Failed to trigger failover', error);
    }
  }

  private async getDatabaseAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.dbCore.getAnalytics();
      this.sendResponse(res, analytics);
    } catch (error) {
      this.sendError(res, 500, 'Failed to get database analytics', error);
    }
  }

  // ===== UTILITY METHODS =====

  private extractPaginationParams(req: Request): { limit: number; offset: number } {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    
    return { limit, offset };
  }

  private sendResponse<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    const response: APIResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: res.getHeader('x-request-id') as string || 'unknown',
      version: this.config.apiVersion
    };
    
    res.status(statusCode).json(response);
  }

  private sendError(res: Response, statusCode: number, message: string, error?: any): void {
    const response: APIResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      requestId: res.getHeader('x-request-id') as string || 'unknown',
      version: this.config.apiVersion
    };
    
    console.error(`API Error: ${message}`, error);
    res.status(statusCode).json(response);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      this.sendError(res, 404, 'Endpoint not found');
    });
    
    // Global error handler
    this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);
      this.sendError(res, 500, 'Internal server error');
    });
  }

  private setupSwagger(): void {
    // Mock Swagger setup - in real implementation, use swagger-jsdoc and swagger-ui-express
    this.app.get('/api/docs', (req: Request, res: Response) => {
      res.json({
        swagger: '2.0',
        info: {
          title: 'Ultimate Global Database API',
          version: this.config.apiVersion,
          description: 'Comprehensive API for global database operations'
        },
        basePath: `/api/${this.config.apiVersion}`,
        paths: {
          '/health': {
            get: {
              summary: 'Health check endpoint',
              responses: {
                200: { description: 'System is healthy' }
              }
            }
          }
          // Add more endpoint documentation here
        }
      });
    });
  }

  private setupMetrics(): void {
    // Mock metrics setup - in real implementation, use prometheus or similar
    this.app.get('/metrics', (req: Request, res: Response) => {
      res.set('Content-Type', 'text/plain');
      res.send(`
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total 1000

# HELP api_request_duration_seconds API request duration
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_bucket{le="0.1"} 100
api_request_duration_seconds_bucket{le="0.5"} 200
api_request_duration_seconds_bucket{le="1.0"} 300
api_request_duration_seconds_bucket{le="+Inf"} 400
api_request_duration_seconds_sum 150.5
api_request_duration_seconds_count 400
      `);
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`REST API server started on port ${this.config.port}`);
        console.log(`API Documentation: http://localhost:${this.config.port}/api/docs`);
        console.log(`Health Check: http://localhost:${this.config.port}/api/${this.config.apiVersion}/health`);
        resolve();
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default RestAPI;
