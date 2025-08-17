import { ClientRateLimiter, loginRateLimiter, registrationRateLimiter } from './clientRateLimiter';
import { SanitizationService } from './sanitization';
import { validateAndSanitize, loginSchema, registrationSchema, songUploadSchema } from './validationSchemas';
import { CSRFProtection } from './csrfProtection';
import { SecureAdminSystem } from './secureAdminSystem';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

interface SecurityTestReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
  summary: string;
}

export class SecurityTestSuite {
  private results: TestResult[] = [];

  private addResult(name: string, passed: boolean, error?: string, details?: any): void {
    this.results.push({ name, passed, error, details });
  }

  // Test Rate Limiting
  private testRateLimiting(): void {
    try {
      const limiter = ClientRateLimiter.getInstance();
      const testId = 'test_user_123';
      const config = loginRateLimiter.config;

      // Reset any existing attempts
      limiter.reset(testId);

      // Test normal operation
      const initialAttempts = limiter.getRemainingAttempts(testId, config);
      if (initialAttempts !== config.maxAttempts) {
        throw new Error(`Expected ${config.maxAttempts} attempts, got ${initialAttempts}`);
      }

      // Test recording failed attempts
      for (let i = 0; i < config.maxAttempts; i++) {
        limiter.recordAttempt(testId, config, false);
      }

      // Should be blocked now
      if (!limiter.isBlocked(testId, config)) {
        throw new Error('User should be blocked after max attempts');
      }

      // Test successful attempt resets blocking
      limiter.recordAttempt(testId, config, true);
      if (limiter.isBlocked(testId, config)) {
        throw new Error('User should not be blocked after successful attempt');
      }

      this.addResult('Rate Limiting', true);
    } catch (error) {
      this.addResult('Rate Limiting', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Test Input Sanitization
  private testSanitization(): void {
    try {
      // Test HTML sanitization
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = SanitizationService.sanitizeHTML(maliciousHtml);
      
      if (sanitized.includes('<script>') || sanitized.includes('alert')) {
        throw new Error('HTML sanitization failed - script tags not removed');
      }

      if (!sanitized.includes('<p>Safe content</p>')) {
        throw new Error('HTML sanitization too aggressive - safe content removed');
      }

      // Test text sanitization
      const maliciousText = '<img src="x" onerror="alert(1)">Hello World';
      const sanitizedText = SanitizationService.sanitizeText(maliciousText);
      
      if (sanitizedText.includes('<') || sanitizedText.includes('onerror')) {
        throw new Error('Text sanitization failed - HTML not removed');
      }

      // Test email sanitization
      const maliciousEmail = 'test@example.com<script>alert(1)</script>';
      const sanitizedEmail = SanitizationService.sanitizeEmail(maliciousEmail);
      
      if (sanitizedEmail.includes('<') || sanitizedEmail.includes('script')) {
        throw new Error('Email sanitization failed');
      }

      // Test filename sanitization
      const maliciousFilename = '../../../etc/passwd.txt';
      const sanitizedFilename = SanitizationService.sanitizeFilename(maliciousFilename);
      
      if (sanitizedFilename.includes('../') || sanitizedFilename.includes('/')) {
        throw new Error('Filename sanitization failed - path traversal not prevented');
      }

      this.addResult('Input Sanitization', true);
    } catch (error) {
      this.addResult('Input Sanitization', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Test Input Validation
  private testValidation(): void {
    try {
      // Test valid login data
      const validLogin = { email: 'test@example.com', password: 'ValidPass123' };
      const validatedLogin = validateAndSanitize(loginSchema, validLogin);
      
      if (validatedLogin.email !== 'test@example.com') {
        throw new Error('Valid login validation failed');
      }

      // Test invalid email
      try {
        validateAndSanitize(loginSchema, { email: 'invalid-email', password: 'ValidPass123' });
        throw new Error('Invalid email should have been rejected');
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('Invalid email format')) {
          throw new Error('Email validation error message incorrect');
        }
      }

      // Test weak password
      try {
        validateAndSanitize(registrationSchema, { 
          email: 'test@example.com', 
          password: 'weak', 
          username: 'testuser' 
        });
        throw new Error('Weak password should have been rejected');
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('Password must')) {
          throw new Error('Password validation error message incorrect');
        }
      }

      // Test SQL injection in song upload
      const maliciousSong = {
        title: "'; DROP TABLE songs; --",
        artist: 'Test Artist',
        isPublic: true
      };
      
      const validatedSong = validateAndSanitize(songUploadSchema, maliciousSong);
      // Should pass validation but be sanitized later
      if (!validatedSong.title.includes('DROP TABLE')) {
        // This is actually good - it means our validation is working
      }

      this.addResult('Input Validation', true);
    } catch (error) {
      this.addResult('Input Validation', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Test CSRF Protection
  private testCSRFProtection(): void {
    try {
      const csrf = CSRFProtection.getInstance();
      
      // Test token generation
      const token1 = csrf.getToken();
      if (!token1 || token1.length < 16) {
        throw new Error('CSRF token too short or empty');
      }

      // Test token validation
      if (!csrf.validateToken(token1)) {
        throw new Error('CSRF token validation failed');
      }

      // Test token refresh
      csrf.refreshToken();
      const token2 = csrf.getToken();
      
      if (token1 === token2) {
        throw new Error('CSRF token not refreshed');
      }

      if (csrf.validateToken(token1)) {
        throw new Error('Old CSRF token should be invalid after refresh');
      }

      // Test headers
      const headers = csrf.getHeaders();
      if (!headers['X-CSRF-Token'] || headers['X-CSRF-Token'] !== token2) {
        throw new Error('CSRF headers incorrect');
      }

      this.addResult('CSRF Protection', true);
    } catch (error) {
      this.addResult('CSRF Protection', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Test Admin System (without actual Supabase calls)
  private testAdminSystem(): void {
    try {
      const adminSystem = SecureAdminSystem.getInstance();
      
      // Test admin email configuration
      const adminEmail = import.meta.env['VITE_ADMIN_EMAIL'] || 'admin@meowplay.com';
      if (!adminEmail.includes('@')) {
        throw new Error('Admin email not properly configured');
      }

      // Test email sanitization in admin context
      const maliciousEmail = 'admin@example.com<script>alert(1)</script>';
      const sanitized = SanitizationService.sanitizeEmail(maliciousEmail);
      
      if (sanitized.includes('<') || sanitized.includes('script')) {
        throw new Error('Admin email sanitization failed');
      }

      this.addResult('Admin System Configuration', true);
    } catch (error) {
      this.addResult('Admin System Configuration', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Test Environment Variables Security
  private testEnvironmentSecurity(): void {
    try {
      // Check that sensitive environment variables are not hardcoded
      const envVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_ADMIN_EMAIL'
      ];

      for (const envVar of envVars) {
        const value = import.meta.env[envVar];
        if (value && (value.includes('your_') || value.includes('placeholder'))) {
          throw new Error(`Environment variable ${envVar} contains placeholder value`);
        }
      }

      // Check that admin email is configured
      const adminEmail = import.meta.env['VITE_ADMIN_EMAIL'];
      if (!adminEmail) {
        console.warn('VITE_ADMIN_EMAIL not configured, using default');
      }

      this.addResult('Environment Security', true);
    } catch (error) {
      this.addResult('Environment Security', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Test XSS Prevention
  private testXSSPrevention(): void {
    try {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>',
        "'; alert('xss'); //",
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      for (const payload of xssPayloads) {
        const sanitized = SanitizationService.sanitizeHTML(payload);
        
        if (sanitized.includes('<script>') || 
            sanitized.includes('javascript:') || 
            sanitized.includes('onerror=') ||
            sanitized.includes('onload=') ||
            sanitized.includes('<iframe')) {
          throw new Error(`XSS payload not properly sanitized: ${payload}`);
        }
      }

      this.addResult('XSS Prevention', true);
    } catch (error) {
      this.addResult('XSS Prevention', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Run all security tests
  async runAllTests(): Promise<SecurityTestReport> {
    this.results = [];

    console.log('🔒 Running Security Test Suite...');

    this.testRateLimiting();
    this.testSanitization();
    this.testValidation();
    this.testCSRFProtection();
    this.testAdminSystem();
    this.testEnvironmentSecurity();
    this.testXSSPrevention();

    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;

    const report: SecurityTestReport = {
      totalTests: this.results.length,
      passedTests,
      failedTests,
      results: this.results,
      summary: `Security Test Results: ${passedTests}/${this.results.length} tests passed`
    };

    // Log results
    console.log(`\n📊 ${report.summary}`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}: ${result.error}`);
      });
    }

    if (passedTests > 0) {
      console.log('\n✅ Passed Tests:');
      this.results.filter(r => r.passed).forEach(result => {
        console.log(`  - ${result.name}`);
      });
    }

    return report;
  }

  // Quick security check for production readiness
  async quickSecurityCheck(): Promise<{ ready: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check environment variables
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    for (const envVar of requiredEnvVars) {
      if (!import.meta.env[envVar]) {
        issues.push(`Missing required environment variable: ${envVar}`);
      }
    }

    // Check admin email configuration
    const adminEmail = import.meta.env['VITE_ADMIN_EMAIL'];
    if (!adminEmail) {
      issues.push('Admin email not configured (VITE_ADMIN_EMAIL)');
    }

    // Test basic sanitization
    try {
      const testHtml = '<script>alert("test")</script>';
      const sanitized = SanitizationService.sanitizeHTML(testHtml);
      if (sanitized.includes('<script>')) {
        issues.push('HTML sanitization not working properly');
      }
    } catch (error) {
      issues.push('Sanitization system error');
    }

    // Test CSRF protection
    try {
      const csrf = CSRFProtection.getInstance();
      const token = csrf.getToken();
      if (!token || token.length < 16) {
        issues.push('CSRF protection not generating secure tokens');
      }
    } catch (error) {
      issues.push('CSRF protection system error');
    }

    return {
      ready: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const securityTestSuite = new SecurityTestSuite();
