/**
 * Production-Grade Layout Component System
 * Flexible layout components for modern web applications
 */

import React from 'react';
import Navigation, { NavigationProps } from './Navigation';

// Main Layout Component
export interface LayoutProps {
  /** Navigation configuration */
  navigation?: NavigationProps;
  /** Main content */
  children: React.ReactNode;
  /** Sidebar content */
  sidebar?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Layout variant */
  variant?: 'default' | 'sidebar' | 'full-width' | 'centered';
  /** Maximum content width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Padding configuration */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Background variant */
  background?: 'default' | 'gray' | 'gradient';
}

const Layout: React.FC<LayoutProps> = ({
  navigation,
  children,
  sidebar,
  footer,
  variant = 'default',
  maxWidth = 'xl',
  padding = 'md',
  background = 'default'
}) => {
  // Background classes
  const backgroundClasses = {
    default: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
  };

  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-none'
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'px-4 py-6',
    md: 'px-4 sm:px-6 lg:px-8 py-8',
    lg: 'px-4 sm:px-6 lg:px-8 py-12'
  };

  const layoutClasses = `min-h-screen ${backgroundClasses[background]}`;

  return (
    <div className={layoutClasses}>
      {/* Navigation */}
      {navigation && <Navigation {...navigation} />}

      {/* Main Content Area */}
      <main className="flex-1">
        {variant === 'sidebar' && sidebar ? (
          <div className="flex">
            {/* Sidebar */}
            <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
              {sidebar}
            </aside>
            
            {/* Main Content with Sidebar */}
            <div className="flex-1">
              <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]}`}>
                {children}
              </div>
            </div>
          </div>
        ) : variant === 'full-width' ? (
          <div className={paddingClasses[padding]}>
            {children}
          </div>
        ) : variant === 'centered' ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className={`w-full ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]}`}>
              {children}
            </div>
          </div>
        ) : (
          <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]}`}>
            {children}
          </div>
        )}
      </main>

      {/* Footer */}
      {footer && (
        <footer className="bg-white border-t border-gray-200">
          {footer}
        </footer>
      )}
    </div>
  );
};

// Container Component
export interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'xl',
  padding = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-none'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-6',
    md: 'px-4 sm:px-6 lg:px-8 py-8',
    lg: 'px-4 sm:px-6 lg:px-8 py-12'
  };

  const containerClasses = `mx-auto ${sizeClasses[size]} ${paddingClasses[padding]} ${className}`.trim();

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

// Section Component
export interface SectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  background?: 'default' | 'gray' | 'white' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  children,
  title,
  subtitle,
  background = 'default',
  padding = 'lg',
  className = ''
}) => {
  const backgroundClasses = {
    default: '',
    gray: 'bg-gray-50',
    white: 'bg-white',
    gradient: 'bg-gradient-to-r from-purple-50 to-blue-50'
  };

  const paddingClasses = {
    none: '',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24'
  };

  const sectionClasses = `${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`.trim();

  return (
    <section className={sectionClasses}>
      <Container>
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
};

// Grid Component
export interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 6 | 12;
    md?: 1 | 2 | 3 | 4 | 6 | 12;
    lg?: 1 | 2 | 3 | 4 | 6 | 12;
    xl?: 1 | 2 | 3 | 4 | 6 | 12;
  };
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 1,
  gap = 'md',
  responsive,
  className = ''
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  let gridClasses = `grid ${colClasses[cols]} ${gapClasses[gap]}`;

  if (responsive) {
    if (responsive.sm) gridClasses += ` sm:${colClasses[responsive.sm]}`;
    if (responsive.md) gridClasses += ` md:${colClasses[responsive.md]}`;
    if (responsive.lg) gridClasses += ` lg:${colClasses[responsive.lg]}`;
    if (responsive.xl) gridClasses += ` xl:${colClasses[responsive.xl]}`;
  }

  const finalClasses = `${gridClasses} ${className}`.trim();

  return (
    <div className={finalClasses}>
      {children}
    </div>
  );
};

// Flex Component
export interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'md',
  className = ''
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const flexClasses = [
    'flex',
    directionClasses[direction],
    alignClasses[align],
    justifyClasses[justify],
    wrap ? 'flex-wrap' : '',
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={flexClasses}>
      {children}
    </div>
  );
};

// Sidebar Component
export interface SidebarProps {
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
  position?: 'left' | 'right';
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  width = 'md',
  position = 'left',
  collapsible = false,
  collapsed = false,
  onToggle,
  className = ''
}) => {
  const widthClasses = {
    sm: collapsed ? 'w-16' : 'w-48',
    md: collapsed ? 'w-16' : 'w-64',
    lg: collapsed ? 'w-16' : 'w-80'
  };

  const positionClasses = {
    left: 'left-0',
    right: 'right-0'
  };

  const sidebarClasses = [
    'fixed top-0 h-full bg-white border-gray-200 transition-all duration-300 z-40',
    position === 'left' ? 'border-r' : 'border-l',
    positionClasses[position],
    widthClasses[width],
    className
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClasses}>
      {collapsible && onToggle && (
        <button
          onClick={onToggle}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <div className="p-4">
        {children}
      </div>
    </aside>
  );
};

export default Layout;
