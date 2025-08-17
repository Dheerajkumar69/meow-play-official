import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorService } from '../../services/ErrorService';

describe('ErrorService', () => {
  let errorService: ErrorService;
  let mockConsoleError: any;
  let mockConsoleWarn: any;
  
  beforeEach(() => {
    // Create a new instance for each test
    errorService = new ErrorService();
    
    // Mock console methods
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should log errors with console.error', () => {
    const testError = new Error('Test error');
    errorService.logError(testError);
    
    expect(mockConsoleError).toHaveBeenCalledWith('[ErrorService]', testError);
  });
  
  it('should log warnings with console.warn', () => {
    const testWarning = 'Test warning';
    errorService.logWarning(testWarning);
    
    expect(mockConsoleWarn).toHaveBeenCalledWith('[ErrorService]', testWarning);
  });
  
  it('should track errors in the errors array', () => {
    const testError = new Error('Test error');
    errorService.logError(testError);
    
    expect(errorService.getErrors()).toContain(testError);
  });
  
  it('should track warnings in the warnings array', () => {
    const testWarning = 'Test warning';
    errorService.logWarning(testWarning);
    
    expect(errorService.getWarnings()).toContain(testWarning);
  });
  
  it('should clear errors when clearErrors is called', () => {
    const testError = new Error('Test error');
    errorService.logError(testError);
    errorService.clearErrors();
    
    expect(errorService.getErrors()).toHaveLength(0);
  });
  
  it('should clear warnings when clearWarnings is called', () => {
    const testWarning = 'Test warning';
    errorService.logWarning(testWarning);
    errorService.clearWarnings();
    
    expect(errorService.getWarnings()).toHaveLength(0);
  });
  
  it('should call the error callback when an error is logged', () => {
    const mockCallback = vi.fn();
    errorService.onError(mockCallback);
    
    const testError = new Error('Test error');
    errorService.logError(testError);
    
    expect(mockCallback).toHaveBeenCalledWith(testError);
  });
  
  it('should call the warning callback when a warning is logged', () => {
    const mockCallback = vi.fn();
    errorService.onWarning(mockCallback);
    
    const testWarning = 'Test warning';
    errorService.logWarning(testWarning);
    
    expect(mockCallback).toHaveBeenCalledWith(testWarning);
  });
  
  it('should remove error callback when removeErrorCallback is called', () => {
    const mockCallback = vi.fn();
    const callbackId = errorService.onError(mockCallback);
    
    errorService.removeErrorCallback(callbackId);
    
    const testError = new Error('Test error');
    errorService.logError(testError);
    
    expect(mockCallback).not.toHaveBeenCalled();
  });
  
  it('should remove warning callback when removeWarningCallback is called', () => {
    const mockCallback = vi.fn();
    const callbackId = errorService.onWarning(mockCallback);
    
    errorService.removeWarningCallback(callbackId);
    
    const testWarning = 'Test warning';
    errorService.logWarning(testWarning);
    
    expect(mockCallback).not.toHaveBeenCalled();
  });
});