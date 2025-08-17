/**
 * Production-Grade Navigation Component
 * Modern navigation system with responsive design and accessibility
 */

import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, ChevronDown, Search, Bell, User, Settings, LogOut } from 'lucide-react';
import Input from './Input';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../theme/ThemeContext';
import { transitions } from '../../theme/utils';

export interface NavigationProps {
  /** Brand/Logo component */
  brand?: React.ReactNode;
  /** Navigation items */
  items?: NavItem[];
  /** User info for profile dropdown */
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  /** Search functionality */
  onSearch?: (query: string) => void;
  /** Notification count */
  notificationCount?: number;
  /** Mobile breakpoint */
  mobileBreakpoint?: number;
  /** Sticky navigation */
  sticky?: boolean;
  /** Transparent background */
  transparent?: boolean;
  /** Custom actions */
  actions?: React.ReactNode;
}

export interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  active?: boolean;
  badge?: string | number;
}

const Navigation: React.FC<NavigationProps> = ({
  brand,
  items = [],
  user,
  onSearch,
  notificationCount = 0,
  mobileBreakpoint = 768,
  sticky = true,
  transparent = false,
  actions
}) => {
  const { isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < mobileBreakpoint;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  // Navigation classes with theme support
  const navClasses = [
    'w-full z-50',
    transitions.default,
    sticky ? 'sticky top-0' : 'relative',
    transparent 
      ? isDark 
        ? 'bg-black/80 backdrop-blur-lg border-b border-white/10' 
        : 'bg-white/80 backdrop-blur-lg border-b border-white/20'
      : isDark
        ? 'bg-neutral-900 border-b border-neutral-800'
        : 'bg-white border-b border-gray-200',
    'shadow-sm'
  ].join(' ');

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand/Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {brand || (
                <div className="text-xl font-bold text-purple-600">
                  Brand
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {items.map((item, index) => (
                  <NavItemComponent key={index} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Search Bar (Desktop) */}
          {!isMobile && onSearch && (
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch}>
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={Search}
                  iconPosition="left"
                  size="sm"
                  className="w-full"
                />
              </form>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Custom Actions */}
            {actions}

            {/* Theme Toggle */}
            <ThemeToggle variant="icon" size="md" />

            {/* Notifications */}
            {notificationCount > 0 && (
              <button className={`relative p-2 transition-colors ${
                isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
              }`}>
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            )}

            {/* User Menu */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'hover:bg-neutral-800 text-gray-200' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-neutral-700' : 'bg-gray-300'
                  }`}>
                    <User className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                  </div>
                  <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border py-2 z-50 ${
                    isDark 
                      ? 'bg-neutral-800 border-neutral-700' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className={`px-4 py-3 border-b ${
                      isDark ? 'border-neutral-700' : 'border-gray-100'
                    }`}>
                      <p className={`text-sm font-medium ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>{user.name}</p>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>{user.email}</p>
                    </div>
                    <div className="py-1">
                      <button className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                        isDark 
                          ? 'text-gray-300 hover:bg-neutral-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                      <button className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                        isDark 
                          ? 'text-gray-300 hover:bg-neutral-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 transition-colors md:hidden ${
                  isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobile && isMobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Search */}
              {onSearch && (
                <div className="px-3 py-2">
                  <form onSubmit={handleSearch}>
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      icon={Search}
                      iconPosition="left"
                      size="sm"
                      className="w-full"
                    />
                  </form>
                </div>
              )}

              {/* Mobile Navigation Items */}
              {items.map((item, index) => (
                <MobileNavItem key={index} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Desktop Navigation Item Component
const NavItemComponent: React.FC<{ item: NavItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (item.onClick) {
      item.onClick();
    }
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const itemClasses = [
    'px-3 py-2 rounded-md text-sm font-medium transition-colors relative',
    item.active
      ? 'bg-purple-100 text-purple-700'
      : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
  ].join(' ');

  return (
    <div className="relative">
      <button className={itemClasses} onClick={handleClick}>
        <div className="flex items-center space-x-1">
          {item.icon && <item.icon className="w-4 h-4" />}
          <span>{item.label}</span>
          {item.badge && (
            <span className="ml-1 bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
          {hasChildren && <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Dropdown Menu */}
      {hasChildren && isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {item.children?.map((child, index) => (
            <button
              key={index}
              onClick={child.onClick}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
            >
              {child.icon && <child.icon className="w-4 h-4" />}
              <span>{child.label}</span>
              {child.badge && (
                <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {child.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Mobile Navigation Item Component
const MobileNavItem: React.FC<{ item: NavItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (item.onClick) {
      item.onClick();
    }
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const itemClasses = [
    'block px-3 py-2 rounded-md text-base font-medium transition-colors',
    item.active
      ? 'bg-purple-100 text-purple-700'
      : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
  ].join(' ');

  return (
    <div>
      <button className={itemClasses} onClick={handleClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {item.icon && <item.icon className="w-5 h-5" />}
            <span>{item.label}</span>
            {item.badge && (
              <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          {hasChildren && (
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </button>

      {/* Mobile Submenu */}
      {hasChildren && isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children?.map((child, index) => (
            <button
              key={index}
              onClick={child.onClick}
              className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
            >
              <div className="flex items-center space-x-2">
                {child.icon && <child.icon className="w-4 h-4" />}
                <span>{child.label}</span>
                {child.badge && (
                  <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {child.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navigation;
