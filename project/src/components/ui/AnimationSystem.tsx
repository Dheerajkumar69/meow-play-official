/**
 * Advanced Animation & Micro-Interactions System
 * Production-grade animations with performance optimization
 */

import React, { useRef, useEffect, useState } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { useTheme } from '../../theme/ThemeContext';

export interface AnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
}

export interface FadeInProps extends AnimationProps {
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

export interface ScaleProps extends AnimationProps {
  from?: number;
  to?: number;
  trigger?: 'hover' | 'focus' | 'active' | 'visible';
}

export interface SlideProps extends AnimationProps {
  direction: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

// Animation variants
const easingMap = {
  linear: 'linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

// Intersection Observer Hook for scroll-triggered animations
const useIntersectionObserver = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Fade In Animation
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  direction = 'up',
  distance = 20,
  delay = 0,
  duration = 600,
  easing = 'ease-out'
}) => {
  const { reducedMotion } = useAccessibility();
  const { ref, isVisible } = useIntersectionObserver();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return `translateY(${distance}px)`;
        case 'down': return `translateY(-${distance}px)`;
        case 'left': return `translateX(${distance}px)`;
        case 'right': return `translateX(-${distance}px)`;
        default: return 'translateY(20px)';
      }
    }
    return 'translateY(0)';
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms ${easingMap[easing]} ${delay}ms, transform ${duration}ms ${easingMap[easing]} ${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

// Scale Animation
export const Scale: React.FC<ScaleProps> = ({
  children,
  className = '',
  from = 0.8,
  to = 1,
  trigger = 'visible',
  delay = 0,
  duration = 400,
  easing = 'ease-out'
}) => {
  const { reducedMotion } = useAccessibility();
  const { ref, isVisible } = useIntersectionObserver();
  const [isTriggered, setIsTriggered] = useState(false);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const shouldAnimate = trigger === 'visible' ? isVisible : isTriggered;
  const scale = shouldAnimate ? to : from;

  const triggerProps = trigger !== 'visible' ? {
    onMouseEnter: () => trigger === 'hover' && setIsTriggered(true),
    onMouseLeave: () => trigger === 'hover' && setIsTriggered(false),
    onFocus: () => trigger === 'focus' && setIsTriggered(true),
    onBlur: () => trigger === 'focus' && setIsTriggered(false),
    onMouseDown: () => trigger === 'active' && setIsTriggered(true),
    onMouseUp: () => trigger === 'active' && setIsTriggered(false),
  } : {};

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `scale(${scale})`,
        transition: `transform ${duration}ms ${easingMap[easing]} ${delay}ms`
      }}
      {...triggerProps}
    >
      {children}
    </div>
  );
};

// Slide Animation
export const Slide: React.FC<SlideProps> = ({
  children,
  className = '',
  direction,
  distance = 100,
  delay = 0,
  duration = 500,
  easing = 'ease-out'
}) => {
  const { reducedMotion } = useAccessibility();
  const { ref, isVisible } = useIntersectionObserver();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return `translateY(${distance}px)`;
        case 'down': return `translateY(-${distance}px)`;
        case 'left': return `translateX(${distance}px)`;
        case 'right': return `translateX(-${distance}px)`;
      }
    }
    return 'translate(0, 0)';
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: getTransform(),
        transition: `transform ${duration}ms ${easingMap[easing]} ${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

// Stagger Animation Container
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}> = ({ children, staggerDelay = 100, className = '' }) => {
  const { reducedMotion } = useAccessibility();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn delay={index * staggerDelay} key={index}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

// Parallax Effect
export const Parallax: React.FC<{
  children: React.ReactNode;
  speed?: number;
  className?: string;
}> = ({ children, speed = 0.5, className = '' }) => {
  const { reducedMotion } = useAccessibility();
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * -speed;
        setOffset(rate);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, reducedMotion]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: reducedMotion ? 'none' : `translateY(${offset}px)`
      }}
    >
      {children}
    </div>
  );
};

// Hover Lift Effect
export const HoverLift: React.FC<{
  children: React.ReactNode;
  lift?: number;
  className?: string;
}> = ({ children, lift = 8, className = '' }) => {
  const { reducedMotion } = useAccessibility();
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`transition-all duration-300 ease-out ${className}`}
      style={{
        transform: isHovered ? `translateY(-${lift}px)` : 'translateY(0)',
        boxShadow: isHovered 
          ? isDark 
            ? `0 ${lift * 2}px ${lift * 4}px rgba(0, 0, 0, 0.4)`
            : `0 ${lift * 2}px ${lift * 4}px rgba(0, 0, 0, 0.15)`
          : 'none'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

// Pulse Animation
export const Pulse: React.FC<{
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}> = ({ children, scale = 1.05, duration = 2000, className = '' }) => {
  const { reducedMotion } = useAccessibility();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      style={{
        animation: `pulse-scale ${duration}ms ease-in-out infinite`,
        '--pulse-scale': scale
      } as React.CSSProperties}
    >
      {children}
      <style jsx>{`
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(var(--pulse-scale)); }
        }
      `}</style>
    </div>
  );
};

// Bounce Animation
export const Bounce: React.FC<{
  children: React.ReactNode;
  height?: number;
  duration?: number;
  className?: string;
}> = ({ children, height = 10, duration = 1000, className = '' }) => {
  const { reducedMotion } = useAccessibility();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      style={{
        animation: `bounce-up ${duration}ms ease-in-out infinite`,
        '--bounce-height': `${height}px`
      } as React.CSSProperties}
    >
      {children}
      <style jsx>{`
        @keyframes bounce-up {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(calc(-1 * var(--bounce-height))); }
        }
      `}</style>
    </div>
  );
};

// Loading Skeleton Animation
export const Skeleton: React.FC<{
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}> = ({ width = '100%', height = '1rem', className = '', variant = 'rectangular' }) => {
  const { isDark } = useTheme();
  const { reducedMotion } = useAccessibility();

  const baseClasses = `animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`;
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ 
        width, 
        height,
        animationDuration: reducedMotion ? '0s' : '1.5s'
      }}
    />
  );
};

// Typewriter Effect
export const Typewriter: React.FC<{
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}> = ({ text, speed = 50, className = '', onComplete }) => {
  const { reducedMotion } = useAccessibility();
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayText(text);
      onComplete?.();
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      onComplete?.();
    }
  }, [currentIndex, text, speed, reducedMotion, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

// Global Animation Styles
export const AnimationStyles: React.FC = () => (
  <style jsx global>{`
    .reduced-motion * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

export default {
  FadeIn,
  Scale,
  Slide,
  StaggerContainer,
  Parallax,
  HoverLift,
  Pulse,
  Bounce,
  Skeleton,
  Typewriter,
  AnimationStyles
};
