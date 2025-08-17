import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { errorService, Toast as ToastType } from '../services/ErrorService';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => onClose(toast.id), 300); // Match animation duration
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'error':
        return 'bg-red-900/80 border-red-500/50';
      case 'warning':
        return 'bg-yellow-900/80 border-yellow-500/50';
      case 'success':
        return 'bg-green-900/80 border-green-500/50';
      default:
        return 'bg-blue-900/80 border-blue-500/50';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out mb-2
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isRemoving ? 'scale-95' : 'scale-100'}
      `}
    >
      <div
        className={`
          ${getBackgroundColor()}
          backdrop-blur-sm rounded-lg border p-4 shadow-lg
          max-w-md w-full relative overflow-hidden
        `}
      >
        {/* Progress bar for non-persistent toasts */}
        {!toast.persistent && toast.duration > 0 && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-white/30 animate-toast-progress"
            style={{
              animationDuration: `${toast.duration}ms`,
              animationFillMode: 'forwards'
            }}
          />
        )}

        <div className="flex items-start space-x-3">
          {getIcon()}
          
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium leading-5">
              {toast.message}
            </p>
            
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm text-white/80 hover:text-white underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    const unsubscribe = errorService.subscribeToToasts((toast) => {
      if (toast.id.startsWith('remove-')) {
        // Handle removal
        const actualId = toast.id.replace('remove-', '');
        setToasts(prev => prev.filter(t => t.id !== actualId));
      } else {
        // Handle addition
        setToasts(prev => {
          // Prevent duplicates
          if (prev.some(t => t.id === toast.id)) {
            return prev;
          }
          return [...prev, toast];
        });
      }
    });

    return unsubscribe;
  }, []);

  const handleClose = (id: string) => {
    errorService.dismissToast(id);
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={handleClose}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
