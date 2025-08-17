/**
 * Responsive Layout System
 * Advanced responsive components with breakpoint-aware design
 */

import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { designTokens } from '../../theme/tokens';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export interface ResponsiveGridProps extends ResponsiveLayoutProps {
  /** Grid columns for different breakpoints */
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Gap between grid items */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Auto-fit columns with minimum width */
  autoFit?: string;
  /** Auto-fill columns with minimum width */
  autoFill?: string;
}

export interface ResponsiveStackProps extends ResponsiveLayoutProps {
  /** Direction for different breakpoints */
  direction?: {
    xs?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
    xl?: 'row' | 'col';
  };
  /** Spacing between items */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Alignment */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justification */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export interface ResponsiveContainerProps extends ResponsiveLayoutProps {
  /** Maximum width for different breakpoints */
  maxWidth?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  /** Padding for different breakpoints */
  padding?: {
    xs?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    sm?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    md?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    lg?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    xl?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  };
  /** Center the container */
  centered?: boolean;
}

// Utility functions
const getGridCols = (cols: ResponsiveGridProps['cols']) => {
  if (!cols) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  
  const classes = [];
  if (cols.xs) classes.push(`grid-cols-${cols.xs}`);
  if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
  
  return classes.join(' ') || 'grid-cols-1';
};

const getGapClass = (gap: ResponsiveGridProps['gap']) => {
  const gapMap = {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };
  return gapMap[gap || 'md'];
};

const getStackDirection = (direction: ResponsiveStackProps['direction']) => {
  if (!direction) return 'flex flex-col';
  
  const classes = ['flex'];
  if (direction.xs) classes.push(direction.xs === 'row' ? 'flex-row' : 'flex-col');
  if (direction.sm) classes.push(direction.sm === 'row' ? 'sm:flex-row' : 'sm:flex-col');
  if (direction.md) classes.push(direction.md === 'row' ? 'md:flex-row' : 'md:flex-col');
  if (direction.lg) classes.push(direction.lg === 'row' ? 'lg:flex-row' : 'lg:flex-col');
  if (direction.xl) classes.push(direction.xl === 'row' ? 'xl:flex-row' : 'xl:flex-col');
  
  return classes.join(' ');
};

const getSpacingClass = (spacing: ResponsiveStackProps['spacing']) => {
  const spacingMap = {
    xs: 'space-y-2 space-x-2',
    sm: 'space-y-4 space-x-4',
    md: 'space-y-6 space-x-6',
    lg: 'space-y-8 space-x-8',
    xl: 'space-y-12 space-x-12'
  };
  return spacingMap[spacing || 'md'];
};

const getAlignClass = (align: ResponsiveStackProps['align']) => {
  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };
  return alignMap[align || 'start'];
};

const getJustifyClass = (justify: ResponsiveStackProps['justify']) => {
  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };
  return justifyMap[justify || 'start'];
};

const getContainerClasses = (props: ResponsiveContainerProps) => {
  const classes = ['w-full'];
  
  if (props.centered) {
    classes.push('mx-auto');
  }
  
  // Max width
  if (props.maxWidth) {
    Object.entries(props.maxWidth).forEach(([breakpoint, width]) => {
      const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
      classes.push(`${prefix}max-w-[${width}]`);
    });
  } else {
    classes.push('max-w-7xl mx-auto');
  }
  
  // Padding
  if (props.padding) {
    Object.entries(props.padding).forEach(([breakpoint, padding]) => {
      const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
      const paddingMap = {
        xs: 'px-2 py-2',
        sm: 'px-4 py-4',
        md: 'px-6 py-6',
        lg: 'px-8 py-8',
        xl: 'px-12 py-12'
      };
      classes.push(`${prefix}${paddingMap[padding]}`);
    });
  } else {
    classes.push('px-4 sm:px-6 lg:px-8');
  }
  
  return classes.join(' ');
};

// Components
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols,
  gap = 'md',
  autoFit,
  autoFill,
  className = ''
}) => {
  const { isDark } = useTheme();
  
  let gridClasses = 'grid';
  
  if (autoFit) {
    gridClasses += ` grid-cols-[repeat(auto-fit,minmax(${autoFit},1fr))]`;
  } else if (autoFill) {
    gridClasses += ` grid-cols-[repeat(auto-fill,minmax(${autoFill},1fr))]`;
  } else {
    gridClasses += ` ${getGridCols(cols)}`;
  }
  
  gridClasses += ` ${getGapClass(gap)}`;
  
  return (
    <div className={`${gridClasses} ${className}`}>
      {children}
    </div>
  );
};

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction,
  spacing = 'md',
  align = 'start',
  justify = 'start',
  className = ''
}) => {
  const { isDark } = useTheme();
  
  const stackClasses = [
    getStackDirection(direction),
    getSpacingClass(spacing),
    getAlignClass(align),
    getJustifyClass(justify),
    className
  ].join(' ');
  
  return (
    <div className={stackClasses}>
      {children}
    </div>
  );
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth,
  padding,
  centered = true,
  className = ''
}) => {
  const { isDark } = useTheme();
  
  const containerClasses = [
    getContainerClasses({ maxWidth, padding, centered, children, className }),
    className
  ].join(' ');
  
  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

// Breakpoint utilities
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('xs');
  
  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else if (width >= 640) setBreakpoint('sm');
      else setBreakpoint('xs');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
};

// Show/Hide components based on breakpoints
export const ShowAt: React.FC<{
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}> = ({ breakpoint, children }) => {
  const breakpointMap = {
    xs: 'block sm:hidden',
    sm: 'hidden sm:block md:hidden',
    md: 'hidden md:block lg:hidden',
    lg: 'hidden lg:block xl:hidden',
    xl: 'hidden xl:block'
  };
  
  return (
    <div className={breakpointMap[breakpoint]}>
      {children}
    </div>
  );
};

export const HideAt: React.FC<{
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}> = ({ breakpoint, children }) => {
  const breakpointMap = {
    xs: 'hidden sm:block',
    sm: 'block sm:hidden md:block',
    md: 'block md:hidden lg:block',
    lg: 'block lg:hidden xl:block',
    xl: 'block xl:hidden'
  };
  
  return (
    <div className={breakpointMap[breakpoint]}>
      {children}
    </div>
  );
};

export default {
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveContainer,
  useBreakpoint,
  ShowAt,
  HideAt
};
