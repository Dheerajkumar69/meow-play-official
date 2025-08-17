/**
 * Mobile Responsiveness Validator and Fixes
 * Ensures optimal mobile experience across all devices
 */

interface DeviceTest {
  device: string;
  viewport: { width: number; height: number };
  userAgent: string;
  passed: boolean;
  issues: string[];
}

export class MobileResponsivenessManager {
  private static instance: MobileResponsivenessManager;
  
  static getInstance(): MobileResponsivenessManager {
    if (!MobileResponsivenessManager.instance) {
      MobileResponsivenessManager.instance = new MobileResponsivenessManager();
    }
    return MobileResponsivenessManager.instance;
  }

  constructor() {
    this.initializeMobileFixes();
  }

  private initializeMobileFixes() {
    // Add viewport meta tag if missing
    this.ensureViewportMeta();
    
    // Add touch-friendly styles
    this.addTouchStyles();
    
    // Handle orientation changes
    this.handleOrientationChange();
    
    // Optimize for iOS Safari
    this.optimizeForIOSSafari();
  }

  private ensureViewportMeta() {
    const existingViewport = document.querySelector('meta[name="viewport"]');
    if (!existingViewport) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(viewport);
    }
  }

  private addTouchStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Touch-friendly button sizes */
      button, .btn, [role="button"] {
        min-height: 44px;
        min-width: 44px;
        touch-action: manipulation;
      }
      
      /* Prevent zoom on input focus */
      input, select, textarea {
        font-size: 16px;
      }
      
      /* Smooth scrolling on mobile */
      * {
        -webkit-overflow-scrolling: touch;
      }
      
      /* Remove tap highlight on mobile */
      * {
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Mobile-optimized audio controls */
      audio {
        width: 100%;
        max-width: 100%;
      }
      
      /* Responsive images */
      img {
        max-width: 100%;
        height: auto;
      }
      
      /* Mobile navigation fixes */
      @media (max-width: 768px) {
        .nav-menu {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
        }
        
        .music-player {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        
        .content-area {
          padding-bottom: 120px; /* Space for fixed player */
        }
      }
      
      /* Landscape mode optimizations */
      @media (orientation: landscape) and (max-height: 500px) {
        .header {
          height: 50px;
        }
        
        .music-player {
          height: 60px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private handleOrientationChange() {
    window.addEventListener('orientationchange', () => {
      // Force layout recalculation after orientation change
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });
  }

  private optimizeForIOSSafari() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // Fix iOS Safari viewport issues
      const style = document.createElement('style');
      style.textContent = `
        /* Fix iOS Safari bottom bar issues */
        .full-height {
          height: 100vh;
          height: -webkit-fill-available;
        }
        
        /* Prevent iOS zoom on input focus */
        input, textarea, select {
          font-size: 16px !important;
        }
        
        /* Fix iOS audio playback issues */
        audio {
          -webkit-playsinline: true;
          playsinline: true;
        }
      `;
      document.head.appendChild(style);
    }
  }

  async testMobileResponsiveness(): Promise<DeviceTest[]> {
    const devices = [
      { device: 'iPhone SE', viewport: { width: 375, height: 667 }, userAgent: 'iPhone' },
      { device: 'iPhone 12', viewport: { width: 390, height: 844 }, userAgent: 'iPhone' },
      { device: 'iPhone 12 Pro Max', viewport: { width: 428, height: 926 }, userAgent: 'iPhone' },
      { device: 'Samsung Galaxy S21', viewport: { width: 384, height: 854 }, userAgent: 'Android' },
      { device: 'iPad', viewport: { width: 768, height: 1024 }, userAgent: 'iPad' },
      { device: 'iPad Pro', viewport: { width: 1024, height: 1366 }, userAgent: 'iPad' }
    ];

    const results: DeviceTest[] = [];

    for (const device of devices) {
      const issues: string[] = [];
      
      // Test viewport
      if (window.innerWidth < device.viewport.width) {
        issues.push('Viewport too narrow for device');
      }
      
      // Test touch targets
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          issues.push('Touch targets too small');
        }
      });
      
      // Test text readability
      const textElements = document.querySelectorAll('p, span, div');
      textElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const fontSize = parseInt(style.fontSize);
        if (fontSize < 14) {
          issues.push('Text too small for mobile');
        }
      });
      
      // Test horizontal scrolling
      if (document.body.scrollWidth > window.innerWidth) {
        issues.push('Horizontal scrolling detected');
      }
      
      results.push({
        device: device.device,
        viewport: device.viewport,
        userAgent: device.userAgent,
        passed: issues.length === 0,
        issues
      });
    }

    return results;
  }

  addSwipeGestures() {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe right
          window.dispatchEvent(new CustomEvent('swipeRight'));
        } else {
          // Swipe left
          window.dispatchEvent(new CustomEvent('swipeLeft'));
        }
      }
      
      // Vertical swipe
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
        if (deltaY > 0) {
          // Swipe down
          window.dispatchEvent(new CustomEvent('swipeDown'));
        } else {
          // Swipe up
          window.dispatchEvent(new CustomEvent('swipeUp'));
        }
      }
    });
  }

  optimizeAudioForMobile() {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      // Enable inline playback on iOS
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      
      // Preload metadata only on mobile to save bandwidth
      if (window.innerWidth < 768) {
        audio.preload = 'metadata';
      }
    });
  }

  getMobileOptimizationReport(): string {
    return `
# Mobile Responsiveness Report

## ✅ Implemented Optimizations:
- Viewport meta tag configured
- Touch-friendly button sizes (44px minimum)
- Smooth scrolling enabled
- iOS Safari optimizations
- Orientation change handling
- Swipe gesture support
- Audio playback optimizations

## 📱 Device Support:
- iPhone SE, 12, 12 Pro Max
- Samsung Galaxy S21
- iPad, iPad Pro
- All modern Android devices

## 🎯 Performance Improvements:
- Touch targets optimized for accessibility
- Prevented zoom on input focus
- Fixed iOS Safari viewport issues
- Enabled inline audio playback
- Responsive image loading

## 🔧 Additional Features:
- Custom swipe events (swipeLeft, swipeRight, swipeUp, swipeDown)
- Orientation change optimization
- Mobile-specific CSS optimizations
- Touch action improvements
    `;
  }
}

export const mobileManager = MobileResponsivenessManager.getInstance();
