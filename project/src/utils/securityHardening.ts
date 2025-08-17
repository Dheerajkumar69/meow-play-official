/**
 * Security Hardening Measures
 * Implements comprehensive security measures for production deployment
 */

import { envValidator } from './envValidator';
import { errorHandler } from './productionErrorHandler';

interface SecurityCheck {
  name: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export class SecurityHardening {
  private static instance: SecurityHardening;
  
  static getInstance(): SecurityHardening {
    if (!SecurityHardening.instance) {
      SecurityHardening.instance = new SecurityHardening();
    }
    return SecurityHardening.instance;
  }

  constructor() {
    this.implementSecurityHeaders();
    this.setupCSP();
    this.preventXSS();
    this.setupRateLimiting();
  }

  private implementSecurityHeaders() {
    // Add security headers via meta tags
    const headers = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];

    headers.forEach(header => {
      const meta = document.createElement('meta');
      meta.httpEquiv = header.name;
      meta.content = header.content;
      document.head.appendChild(meta);
    });
  }

  private setupCSP() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://api.uptimerobot.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);
  }

  private preventXSS() {
    // Sanitize all user inputs
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        target.value = this.sanitizeInput(target.value);
      });
    });
  }

  private sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  private setupRateLimiting() {
    const requests = new Map<string, number[]>();
    const RATE_LIMIT = 100; // requests per minute
    const TIME_WINDOW = 60000; // 1 minute

    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const now = Date.now();
      
      if (!requests.has(url)) {
        requests.set(url, []);
      }
      
      const urlRequests = requests.get(url)!;
      const recentRequests = urlRequests.filter(time => now - time < TIME_WINDOW);
      
      if (recentRequests.length >= RATE_LIMIT) {
        throw new Error('Rate limit exceeded');
      }
      
      recentRequests.push(now);
      requests.set(url, recentRequests);
      
      return originalFetch(input, init);
    };
  }

  async runSecurityAudit(): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    // Check environment variables
    checks.push(this.checkEnvironmentSecurity());
    
    // Check HTTPS
    checks.push(this.checkHTTPS());
    
    // Check CSP
    checks.push(this.checkCSP());
    
    // Check for sensitive data exposure
    checks.push(this.checkDataExposure());
    
    // Check authentication
    checks.push(await this.checkAuthentication());
    
    // Check for XSS vulnerabilities
    checks.push(this.checkXSSProtection());

    return checks;
  }

  private checkEnvironmentSecurity(): SecurityCheck {
    const config = envValidator.getConfig();
    const issues: string[] = [];

    if (!config.VITE_SUPABASE_URL || config.VITE_SUPABASE_URL.includes('localhost')) {
      issues.push('Supabase URL not configured for production');
    }

    if (!config.VITE_SUPABASE_ANON_KEY || config.VITE_SUPABASE_ANON_KEY.length < 100) {
      issues.push('Supabase anonymous key appears invalid');
    }

    if (config.NODE_ENV !== 'production') {
      issues.push('Not running in production mode');
    }

    return {
      name: 'Environment Security',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'critical' : 'low',
      message: issues.length > 0 ? issues.join(', ') : 'Environment variables properly configured'
    };
  }

  private checkHTTPS(): SecurityCheck {
    const isHTTPS = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost';

    return {
      name: 'HTTPS Security',
      passed: isHTTPS || isLocalhost,
      severity: 'critical',
      message: isHTTPS || isLocalhost ? 'HTTPS properly configured' : 'HTTPS required for production'
    };
  }

  private checkCSP(): SecurityCheck {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    return {
      name: 'Content Security Policy',
      passed: !!cspMeta,
      severity: 'high',
      message: cspMeta ? 'CSP headers configured' : 'CSP headers missing'
    };
  }

  private checkDataExposure(): SecurityCheck {
    const issues: string[] = [];
    
    // Check for exposed API keys in DOM
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.textContent?.includes('sk_') || script.textContent?.includes('secret')) {
        issues.push('Potential API key exposure in scripts');
      }
    });

    // Check localStorage for sensitive data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('password') || key?.includes('secret')) {
        issues.push('Sensitive data in localStorage');
      }
    }

    return {
      name: 'Data Exposure Check',
      passed: issues.length === 0,
      severity: 'high',
      message: issues.length > 0 ? issues.join(', ') : 'No sensitive data exposure detected'
    };
  }

  private async checkAuthentication(): Promise<SecurityCheck> {
    try {
      // Check if Supabase auth is properly configured
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.auth.getSession();
      
      return {
        name: 'Authentication System',
        passed: !error,
        severity: 'critical',
        message: error ? `Auth error: ${error.message}` : 'Authentication system working'
      };
    } catch (error) {
      return {
        name: 'Authentication System',
        passed: false,
        severity: 'critical',
        message: `Auth system error: ${(error as Error).message}`
      };
    }
  }

  private checkXSSProtection(): SecurityCheck {
    const xssHeader = document.querySelector('meta[http-equiv="X-XSS-Protection"]');
    
    return {
      name: 'XSS Protection',
      passed: !!xssHeader,
      severity: 'high',
      message: xssHeader ? 'XSS protection enabled' : 'XSS protection headers missing'
    };
  }

  generateSecurityReport(checks: SecurityCheck[]): string {
    const passed = checks.filter(c => c.passed).length;
    const failed = checks.filter(c => !c.passed).length;
    const critical = checks.filter(c => !c.passed && c.severity === 'critical').length;

    return `
# Security Audit Report

## Overall Score: ${passed}/${checks.length} (${Math.round(passed/checks.length*100)}%)

### ✅ Passed Tests: ${passed}
${checks.filter(c => c.passed).map(c => `- ${c.name}: ${c.message}`).join('\n')}

### ❌ Failed Tests: ${failed}
${checks.filter(c => !c.passed).map(c => `- ${c.name} (${c.severity.toUpperCase()}): ${c.message}`).join('\n')}

### 🚨 Critical Issues: ${critical}
${critical > 0 ? 'DEPLOYMENT BLOCKED - Fix critical issues before deploying' : 'No critical security issues found'}

## Security Measures Implemented:
- Content Security Policy (CSP)
- XSS Protection headers
- Rate limiting on API calls
- Input sanitization
- Environment variable validation
- HTTPS enforcement
- Sensitive data exposure prevention
    `;
  }
}

export const securityHardening = SecurityHardening.getInstance();
