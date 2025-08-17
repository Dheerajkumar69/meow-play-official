import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkService } from '../../services/NetworkService';

describe('NetworkService', () => {
  let networkService: NetworkService;
  let originalAddEventListener: typeof window.addEventListener;
  let originalRemoveEventListener: typeof window.removeEventListener;
  let onlineCallbacks: Array<(ev: Event) => any> = [];
  let offlineCallbacks: Array<(ev: Event) => any> = [];
  
  beforeEach(() => {
    // Save original methods
    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;
    
    // Clear callbacks
    onlineCallbacks = [];
    offlineCallbacks = [];
    
    // Mock window event listeners
    window.addEventListener = vi.fn((event, callback) => {
      if (event === 'online') {
        onlineCallbacks.push(callback as (ev: Event) => any);
      } else if (event === 'offline') {
        offlineCallbacks.push(callback as (ev: Event) => any);
      }
    });
    
    window.removeEventListener = vi.fn((event, callback) => {
      if (event === 'online') {
        onlineCallbacks = onlineCallbacks.filter(cb => cb !== callback);
      } else if (event === 'offline') {
        offlineCallbacks = offlineCallbacks.filter(cb => cb !== callback);
      }
    });
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });
    
    // Create a new instance for each test to avoid singleton issues
    vi.resetModules();
    networkService = NetworkService.getInstance();
  });
  
  afterEach(() => {
    // Restore original methods
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    
    // Clear callbacks
    onlineCallbacks = [];
    offlineCallbacks = [];
    
    // Reset mocks
    vi.clearAllMocks();
  });
  
  it('should initialize with the correct online status', () => {
    expect(networkService.isOnline()).toBe(true);
    
    // Change navigator.onLine to false
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false
    });
    
    // Create a new instance
    const offlineService = new NetworkService();
    expect(offlineService.isOnline()).toBe(false);
  });
  
  it('should register online and offline event listeners', () => {
    expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
  
  it('should update online status when online event is triggered', () => {
    // Set initial state to offline
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false
    });
    networkService = NetworkService.getInstance();
    expect(networkService.isOnline()).toBe(false);
    
    // Trigger online event
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });
    onlineCallbacks.forEach(callback => callback(new Event('online')));
    
    expect(networkService.isOnline()).toBe(true);
  });
  
  it('should update online status when offline event is triggered', () => {
    // Set initial state to online
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });
    networkService = new NetworkService();
    expect(networkService.isOnline()).toBe(true);
    
    // Trigger offline event
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false
    });
    offlineCallbacks.forEach(callback => callback(new Event('offline')));
    
    expect(networkService.isOnline()).toBe(false);
  });
  
  it('should call registered callbacks when online status changes', () => {
    // Create a new instance to ensure we have fresh event handlers
    networkService = new NetworkService();
    
    // Register the callback after creating the instance
    const mockCallback = vi.fn();
    networkService.onStatusChange(mockCallback);
    
    // Manually call the offline handler to simulate an offline event
    // @ts-ignore - accessing private method for testing
    networkService['handleOffline'](new Event('offline'));
    
    expect(mockCallback).toHaveBeenCalledWith(false);
    
    // Manually call the online handler to simulate an online event
    // @ts-ignore - accessing private method for testing
    networkService['handleOnline'](new Event('online'));
    
    expect(mockCallback).toHaveBeenCalledWith(true);
  });
  
  it('should remove callback when unsubscribe is called', () => {
    const mockCallback = vi.fn();
    const unsubscribe = networkService.onStatusChange(mockCallback);
    
    unsubscribe();
    
    // Trigger events
    onlineCallbacks.forEach(callback => callback(new Event('online')));
    offlineCallbacks.forEach(callback => callback(new Event('offline')));
    
    expect(mockCallback).not.toHaveBeenCalled();
  });
  
  it('should clean up event listeners when destroy is called', () => {
    networkService.destroy();
    
    expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});