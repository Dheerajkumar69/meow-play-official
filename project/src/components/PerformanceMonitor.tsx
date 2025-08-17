import React, { useEffect, useState } from 'react';
import { Activity, Zap, Database, Wifi } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  renderTime: number;
  apiLatency: number;
  cacheHitRate: number;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    apiLatency: 0,
    cacheHitRate: 0
  });
  const [showMonitor, setShowMonitor] = useState(false);

  useEffect(() => {
    // Performance monitoring
    const updateMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;

      setMetrics({
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0,
        renderTime: performance.now(),
        apiLatency: Math.random() * 100 + 50, // Mock API latency
        cacheHitRate: Math.random() * 100
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    // Show monitor in development
    if (import.meta.env.DEV) {
      setShowMonitor(true);
    }

    return () => clearInterval(interval);
  }, []);

  if (!showMonitor) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-xs text-white z-50 min-w-48">
      <div className="flex items-center space-x-2 mb-3">
        <Activity className="w-4 h-4 text-green-400" />
        <span className="font-semibold">Performance</span>
        <button
          onClick={() => setShowMonitor(false)}
          className="ml-auto text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Load Time:</span>
          <span className="text-green-400">{metrics.loadTime.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Memory:</span>
          <span className="text-blue-400">{metrics.memoryUsage.toFixed(1)}MB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">API Latency:</span>
          <span className="text-yellow-400">{metrics.apiLatency.toFixed(0)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Cache Hit:</span>
          <span className="text-purple-400">{metrics.cacheHitRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;