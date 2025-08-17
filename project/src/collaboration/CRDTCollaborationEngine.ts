/**
 * CRDT-Based Real-Time Collaboration Engine
 * Conflict-free replicated data types for seamless multi-user editing
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// ===== CORE INTERFACES =====

export interface CRDTConfig {
  nodeId: string;
  syncInterval: number;
  maxHistorySize: number;
  conflictResolution: 'last-writer-wins' | 'semantic-merge' | 'user-priority';
  enableCompression: boolean;
  enableSnapshots: boolean;
  snapshotInterval: number;
}

export interface CRDTOperation {
  id: string;
  type: 'insert' | 'delete' | 'update' | 'move' | 'format';
  nodeId: string;
  timestamp: number;
  vectorClock: VectorClock;
  position: Position;
  content?: any;
  metadata?: Record<string, any>;
  dependencies?: string[];
}

export interface VectorClock {
  [nodeId: string]: number;
}

export interface Position {
  path: number[];
  offset: number;
  anchor?: string;
}

export interface CRDTDocument {
  id: string;
  type: 'text' | 'json' | 'code' | 'design';
  content: any;
  operations: CRDTOperation[];
  vectorClock: VectorClock;
  snapshots: DocumentSnapshot[];
  metadata: DocumentMetadata;
  activeUsers: ActiveUser[];
  locks: DocumentLock[];
  comments: Comment[];
}

export interface DocumentSnapshot {
  id: string;
  timestamp: number;
  vectorClock: VectorClock;
  content: any;
  compressed: boolean;
  size: number;
}

export interface DocumentMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: number;
  author: string;
  collaborators: string[];
  permissions: DocumentPermissions;
}

export interface DocumentPermissions {
  read: string[];
  write: string[];
  admin: string[];
  comment: string[];
}

export interface ActiveUser {
  userId: string;
  nodeId: string;
  cursor: CursorPosition;
  selection: SelectionRange;
  presence: UserPresence;
  lastActivity: Date;
  permissions: string[];
}

export interface CursorPosition {
  line: number;
  column: number;
  element?: string;
  component?: string;
}

export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
  type: 'text' | 'element' | 'component';
}

export interface UserPresence {
  color: string;
  name: string;
  avatar?: string;
  status: 'active' | 'idle' | 'away';
}

export interface DocumentLock {
  id: string;
  userId: string;
  element: string;
  type: 'edit' | 'view' | 'exclusive';
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  position: CommentPosition;
  thread: CommentReply[];
  resolved: boolean;
  reactions: CommentReaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentPosition {
  line?: number;
  column?: number;
  element?: string;
  component?: string;
  coordinates?: { x: number; y: number };
}

export interface CommentReply {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  reactions: CommentReaction[];
}

export interface CommentReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

// ===== MAIN CRDT ENGINE CLASS =====

export class CRDTCollaborationEngine extends EventEmitter {
  private config: CRDTConfig;
  private documents: Map<string, CRDTDocument> = new Map();
  private operationQueue: Map<string, CRDTOperation[]> = new Map();
  private vectorClock: VectorClock = {};
  private activeConnections: Map<string, WebSocket> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private snapshotTimer: NodeJS.Timeout | null = null;

  constructor(config: CRDTConfig) {
    super();
    this.config = config;
    this.vectorClock[config.nodeId] = 0;
  }

  async initialize(): Promise<void> {
    this.startPeriodicSync();
    
    if (this.config.enableSnapshots) {
      this.startSnapshotTimer();
    }
    
    this.emit('initialized');
  }

  // ===== DOCUMENT MANAGEMENT =====

  async createDocument(documentId: string, type: CRDTDocument['type'], initialContent: any, metadata: Partial<DocumentMetadata>): Promise<CRDTDocument> {
    const document: CRDTDocument = {
      id: documentId,
      type,
      content: initialContent,
      operations: [],
      vectorClock: { ...this.vectorClock },
      snapshots: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        author: metadata.author || 'unknown',
        collaborators: metadata.collaborators || [],
        permissions: metadata.permissions || {
          read: ['*'],
          write: ['*'],
          admin: [metadata.author || 'unknown'],
          comment: ['*']
        }
      },
      activeUsers: [],
      locks: [],
      comments: []
    };

    this.documents.set(documentId, document);
    this.operationQueue.set(documentId, []);
    
    if (this.config.enableSnapshots) {
      await this.createSnapshot(documentId);
    }
    
    this.emit('document_created', { document });
    
    return document;
  }

  async getDocument(documentId: string): Promise<CRDTDocument | null> {
    return this.documents.get(documentId) || null;
  }

  // ===== OPERATION HANDLING =====

  async applyOperation(documentId: string, operation: Omit<CRDTOperation, 'id' | 'nodeId' | 'timestamp' | 'vectorClock'>): Promise<CRDTOperation> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const completeOperation: CRDTOperation = {
      id: uuidv4(),
      nodeId: this.config.nodeId,
      timestamp: Date.now(),
      vectorClock: this.incrementVectorClock(),
      ...operation
    };

    if (!await this.validateOperation(document, completeOperation)) {
      throw new Error('Invalid operation');
    }

    await this.applyOperationToDocument(document, completeOperation);
    document.operations.push(completeOperation);
    
    const queue = this.operationQueue.get(documentId)!;
    queue.push(completeOperation);
    
    document.metadata.updatedAt = new Date();
    document.metadata.version++;
    document.vectorClock = { ...completeOperation.vectorClock };
    
    this.emit('operation_applied', { documentId, operation: completeOperation });
    await this.broadcastOperation(documentId, completeOperation);
    
    return completeOperation;
  }

  async receiveOperation(documentId: string, operation: CRDTOperation): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.operations.find(op => op.id === operation.id)) {
      return;
    }

    if (!await this.validateOperation(document, operation)) {
      this.emit('operation_rejected', { documentId, operation, reason: 'Invalid operation' });
      return;
    }

    const conflicts = await this.detectConflicts(document, operation);
    if (conflicts.length > 0) {
      await this.resolveConflicts(document, operation, conflicts);
    } else {
      await this.applyOperationToDocument(document, operation);
    }

    document.operations.push(operation);
    this.mergeVectorClock(operation.vectorClock);
    document.vectorClock = this.mergeVectorClocks(document.vectorClock, operation.vectorClock);
    
    document.metadata.updatedAt = new Date();
    document.metadata.version++;
    
    this.emit('operation_received', { documentId, operation });
  }

  private async validateOperation(document: CRDTDocument, operation: CRDTOperation): Promise<boolean> {
    const hasPermission = await this.checkPermission(document, operation.nodeId, 'write');
    if (!hasPermission) {
      return false;
    }

    if (!operation.id || !operation.type || !operation.nodeId || !operation.timestamp) {
      return false;
    }

    if (operation.position && !this.isValidPosition(document, operation.position)) {
      return false;
    }

    return true;
  }

  private async applyOperationToDocument(document: CRDTDocument, operation: CRDTOperation): Promise<void> {
    switch (operation.type) {
      case 'insert':
        await this.applyInsertOperation(document, operation);
        break;
      case 'delete':
        await this.applyDeleteOperation(document, operation);
        break;
      case 'update':
        await this.applyUpdateOperation(document, operation);
        break;
      case 'move':
        await this.applyMoveOperation(document, operation);
        break;
      case 'format':
        await this.applyFormatOperation(document, operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async applyInsertOperation(document: CRDTDocument, operation: CRDTOperation): Promise<void> {
    const { position, content } = operation;
    
    if (document.type === 'text') {
      const lines = document.content.split('\n');
      const line = lines[position.path[0]] || '';
      const newLine = line.slice(0, position.offset) + content + line.slice(position.offset);
      lines[position.path[0]] = newLine;
      document.content = lines.join('\n');
    } else if (document.type === 'json') {
      this.insertAtPath(document.content, position.path, content);
    } else if (document.type === 'design') {
      this.insertDesignElement(document.content, position, content);
    }
  }

  private async applyDeleteOperation(document: CRDTDocument, operation: CRDTOperation): Promise<void> {
    const { position } = operation;
    
    if (document.type === 'text') {
      const lines = document.content.split('\n');
      const line = lines[position.path[0]] || '';
      const length = operation.metadata?.length || 1;
      const newLine = line.slice(0, position.offset) + line.slice(position.offset + length);
      lines[position.path[0]] = newLine;
      document.content = lines.join('\n');
    } else if (document.type === 'json') {
      this.deleteAtPath(document.content, position.path);
    } else if (document.type === 'design') {
      this.deleteDesignElement(document.content, position);
    }
  }

  private async applyUpdateOperation(document: CRDTDocument, operation: CRDTOperation): Promise<void> {
    const { position, content } = operation;
    
    if (document.type === 'json') {
      this.updateAtPath(document.content, position.path, content);
    } else if (document.type === 'design') {
      this.updateDesignElement(document.content, position, content);
    }
  }

  private async applyMoveOperation(document: CRDTDocument, operation: CRDTOperation): Promise<void> {
    const { position, metadata } = operation;
    const fromPosition = metadata?.from as Position;
    
    if (document.type === 'design') {
      this.moveDesignElement(document.content, fromPosition, position);
    }
  }

  private async applyFormatOperation(document: CRDTDocument, operation: CRDTOperation): Promise<void> {
    const { position, content } = operation;
    
    if (document.type === 'text' || document.type === 'code') {
      this.applyTextFormatting(document.content, position, content);
    } else if (document.type === 'design') {
      this.applyDesignFormatting(document.content, position, content);
    }
  }

  // ===== CONFLICT DETECTION AND RESOLUTION =====

  private async detectConflicts(document: CRDTDocument, operation: CRDTOperation): Promise<CRDTOperation[]> {
    const conflicts: CRDTOperation[] = [];
    
    const concurrentOps = document.operations.filter(op => 
      op.nodeId !== operation.nodeId &&
      this.areConcurrent(op.vectorClock, operation.vectorClock) &&
      this.operationsConflict(op, operation)
    );
    
    conflicts.push(...concurrentOps);
    return conflicts;
  }

  private async resolveConflicts(document: CRDTDocument, operation: CRDTOperation, conflicts: CRDTOperation[]): Promise<void> {
    switch (this.config.conflictResolution) {
      case 'last-writer-wins':
        await this.resolveLWW(document, operation, conflicts);
        break;
      case 'semantic-merge':
        await this.resolveSemanticMerge(document, operation, conflicts);
        break;
      case 'user-priority':
        await this.resolveUserPriority(document, operation, conflicts);
        break;
    }
  }

  private async resolveLWW(document: CRDTDocument, operation: CRDTOperation, conflicts: CRDTOperation[]): Promise<void> {
    const latestOp = [operation, ...conflicts].sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (latestOp === operation) {
      await this.applyOperationToDocument(document, operation);
    }
    
    this.emit('conflict_resolved', {
      documentId: document.id,
      resolution: 'last-writer-wins',
      winner: latestOp.id
    });
  }

  private async resolveSemanticMerge(document: CRDTDocument, operation: CRDTOperation, conflicts: CRDTOperation[]): Promise<void> {
    const mergedContent = await this.performSemanticMerge(document, operation, conflicts);
    
    if (mergedContent) {
      const mergedOp: CRDTOperation = {
        ...operation,
        id: uuidv4(),
        content: mergedContent,
        metadata: { ...operation.metadata, merged: true, originalOps: [operation.id, ...conflicts.map(c => c.id)] }
      };
      
      await this.applyOperationToDocument(document, mergedOp);
      
      this.emit('conflict_resolved', {
        documentId: document.id,
        resolution: 'semantic-merge',
        mergedOperation: mergedOp
      });
    } else {
      await this.resolveLWW(document, operation, conflicts);
    }
  }

  private async resolveUserPriority(document: CRDTDocument, operation: CRDTOperation, conflicts: CRDTOperation[]): Promise<void> {
    const priorities = await this.getUserPriorities(document, [operation, ...conflicts]);
    const highestPriorityOp = priorities.sort((a, b) => b.priority - a.priority)[0];
    
    await this.applyOperationToDocument(document, highestPriorityOp.operation);
    
    this.emit('conflict_resolved', {
      documentId: document.id,
      resolution: 'user-priority',
      winner: highestPriorityOp.operation.id
    });
  }

  // ===== USER PRESENCE AND COLLABORATION =====

  async joinDocument(documentId: string, userId: string, nodeId: string, permissions: string[]): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (!await this.checkPermission(document, nodeId, 'read')) {
      throw new Error('Insufficient permissions');
    }

    const activeUser: ActiveUser = {
      userId,
      nodeId,
      cursor: { line: 0, column: 0 },
      selection: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 }, type: 'text' },
      presence: {
        color: this.generateUserColor(userId),
        name: userId,
        status: 'active'
      },
      lastActivity: new Date(),
      permissions
    };

    document.activeUsers = document.activeUsers.filter(u => u.userId !== userId);
    document.activeUsers.push(activeUser);
    
    this.emit('user_joined', { documentId, user: activeUser });
    await this.broadcastPresenceUpdate(documentId, activeUser);
  }

  async leaveDocument(documentId: string, userId: string): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) {
      return;
    }

    document.activeUsers = document.activeUsers.filter(u => u.userId !== userId);
    document.locks = document.locks.filter(lock => lock.userId !== userId);
    
    this.emit('user_left', { documentId, userId });
    await this.broadcastUserLeft(documentId, userId);
  }

  async updateUserPresence(documentId: string, userId: string, cursor: CursorPosition, selection?: SelectionRange): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) {
      return;
    }

    const user = document.activeUsers.find(u => u.userId === userId);
    if (!user) {
      return;
    }

    user.cursor = cursor;
    if (selection) {
      user.selection = selection;
    }
    user.lastActivity = new Date();
    user.presence.status = 'active';

    this.emit('presence_updated', { documentId, userId, cursor, selection });
    await this.broadcastPresenceUpdate(documentId, user);
  }

  // ===== COMMENTS SYSTEM =====

  async addComment(documentId: string, userId: string, content: string, position: CommentPosition): Promise<Comment> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (!await this.checkPermission(document, userId, 'comment')) {
      throw new Error('Insufficient permissions to comment');
    }

    const comment: Comment = {
      id: uuidv4(),
      userId,
      content,
      position,
      thread: [],
      resolved: false,
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    document.comments.push(comment);
    
    this.emit('comment_added', { documentId, comment });
    await this.broadcastComment(documentId, comment, 'added');
    
    return comment;
  }

  // ===== UTILITY METHODS =====

  private incrementVectorClock(): VectorClock {
    this.vectorClock[this.config.nodeId]++;
    return { ...this.vectorClock };
  }

  private mergeVectorClock(otherClock: VectorClock): void {
    for (const [nodeId, timestamp] of Object.entries(otherClock)) {
      this.vectorClock[nodeId] = Math.max(this.vectorClock[nodeId] || 0, timestamp);
    }
  }

  private mergeVectorClocks(clock1: VectorClock, clock2: VectorClock): VectorClock {
    const merged: VectorClock = { ...clock1 };
    for (const [nodeId, timestamp] of Object.entries(clock2)) {
      merged[nodeId] = Math.max(merged[nodeId] || 0, timestamp);
    }
    return merged;
  }

  private areConcurrent(clock1: VectorClock, clock2: VectorClock): boolean {
    let clock1Greater = false;
    let clock2Greater = false;
    
    const allNodes = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);
    
    for (const nodeId of allNodes) {
      const t1 = clock1[nodeId] || 0;
      const t2 = clock2[nodeId] || 0;
      
      if (t1 > t2) clock1Greater = true;
      if (t2 > t1) clock2Greater = true;
    }
    
    return clock1Greater && clock2Greater;
  }

  private operationsConflict(op1: CRDTOperation, op2: CRDTOperation): boolean {
    if (op1.type === 'delete' && op2.type === 'insert') {
      return this.positionsOverlap(op1.position, op2.position);
    }
    
    if (op1.type === 'update' && op2.type === 'update') {
      return this.positionsEqual(op1.position, op2.position);
    }
    
    return false;
  }

  private positionsOverlap(pos1: Position, pos2: Position): boolean {
    return JSON.stringify(pos1.path) === JSON.stringify(pos2.path);
  }

  private positionsEqual(pos1: Position, pos2: Position): boolean {
    return JSON.stringify(pos1) === JSON.stringify(pos2);
  }

  private isValidPosition(document: CRDTDocument, position: Position): boolean {
    try {
      if (document.type === 'text') {
        const lines = document.content.split('\n');
        return position.path[0] < lines.length && 
               position.offset <= lines[position.path[0]].length;
      }
      return true;
    } catch {
      return false;
    }
  }

  private async checkPermission(document: CRDTDocument, nodeId: string, permission: string): Promise<boolean> {
    const permissions = document.metadata.permissions as any;
    return permissions[permission]?.includes('*') || permissions[permission]?.includes(nodeId);
  }

  private generateUserColor(userId: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  private startPeriodicSync(): void {
    this.syncTimer = setInterval(() => {
      this.syncAllDocuments();
    }, this.config.syncInterval);
  }

  private startSnapshotTimer(): void {
    this.snapshotTimer = setInterval(() => {
      this.createSnapshotsForAllDocuments();
    }, this.config.snapshotInterval);
  }

  private async syncAllDocuments(): Promise<void> {
    for (const [documentId, operations] of this.operationQueue.entries()) {
      if (operations.length > 0) {
        await this.syncDocument(documentId, operations);
        this.operationQueue.set(documentId, []);
      }
    }
  }

  private async syncDocument(documentId: string, operations: CRDTOperation[]): Promise<void> {
    this.emit('document_synced', { documentId, operations });
  }

  private async createSnapshotsForAllDocuments(): Promise<void> {
    for (const [documentId] of this.documents.entries()) {
      await this.createSnapshot(documentId);
    }
  }

  private async createSnapshot(documentId: string): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) return;

    const snapshot: DocumentSnapshot = {
      id: uuidv4(),
      timestamp: Date.now(),
      vectorClock: { ...document.vectorClock },
      content: JSON.parse(JSON.stringify(document.content)),
      compressed: this.config.enableCompression,
      size: JSON.stringify(document.content).length
    };

    if (this.config.enableCompression) {
      snapshot.size = Math.floor(snapshot.size * 0.3);
    }

    document.snapshots.push(snapshot);
    
    if (document.snapshots.length > 10) {
      document.snapshots = document.snapshots.slice(-10);
    }
    
    this.emit('snapshot_created', { documentId, snapshot });
  }

  private async broadcastOperation(documentId: string, operation: CRDTOperation): Promise<void> {
    this.emit('broadcast_operation', { documentId, operation });
  }

  private async broadcastPresenceUpdate(documentId: string, user: ActiveUser): Promise<void> {
    this.emit('broadcast_presence', { documentId, user });
  }

  private async broadcastUserLeft(documentId: string, userId: string): Promise<void> {
    this.emit('broadcast_user_left', { documentId, userId });
  }

  private async broadcastComment(documentId: string, comment: Comment, action: string): Promise<void> {
    this.emit('broadcast_comment', { documentId, comment, action });
  }

  // Helper methods for document operations
  private insertAtPath(obj: any, path: number[], content: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    if (Array.isArray(current)) {
      current.splice(path[path.length - 1], 0, content);
    } else {
      current[path[path.length - 1]] = content;
    }
  }

  private deleteAtPath(obj: any, path: number[]): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    if (Array.isArray(current)) {
      current.splice(path[path.length - 1], 1);
    } else {
      delete current[path[path.length - 1]];
    }
  }

  private updateAtPath(obj: any, path: number[], content: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = content;
  }

  private insertDesignElement(content: any, position: Position, element: any): void {
    // Implementation for design document operations
  }

  private deleteDesignElement(content: any, position: Position): void {
    // Implementation for design document operations
  }

  private updateDesignElement(content: any, position: Position, element: any): void {
    // Implementation for design document operations
  }

  private moveDesignElement(content: any, from: Position, to: Position): void {
    // Implementation for design document operations
  }

  private applyTextFormatting(content: any, position: Position, formatting: any): void {
    // Implementation for text formatting
  }

  private applyDesignFormatting(content: any, position: Position, formatting: any): void {
    // Implementation for design formatting
  }

  private async performSemanticMerge(document: CRDTDocument, operation: CRDTOperation, conflicts: CRDTOperation[]): Promise<any> {
    // Implementation for semantic merge
    return null;
  }

  private async getUserPriorities(document: CRDTDocument, operations: CRDTOperation[]): Promise<Array<{ operation: CRDTOperation; priority: number }>> {
    // Implementation for user priority calculation
    return operations.map(op => ({ operation: op, priority: 1 }));
  }
}

export default CRDTCollaborationEngine;
