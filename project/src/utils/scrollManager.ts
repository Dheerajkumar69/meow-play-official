/**
 * Scroll management utility for mobile overlays and modals
 */
export class ScrollManager {
  private static scrollPosition = 0;
  private static isLocked = false;

  /**
   * Lock body scroll (for modals, overlays, mobile menus)
   */
  static lockScroll(): void {
    if (this.isLocked) return;

    // Store current scroll position
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    // Apply styles to prevent scrolling
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Prevent scrolling on mobile devices
    document.addEventListener('touchmove', this.preventScroll, { passive: false });
    document.addEventListener('wheel', this.preventScroll, { passive: false });

    this.isLocked = true;
  }

  /**
   * Unlock body scroll
   */
  static unlockScroll(): void {
    if (!this.isLocked) return;

    // Remove event listeners
    document.removeEventListener('touchmove', this.preventScroll);
    document.removeEventListener('wheel', this.preventScroll);

    // Restore body styles
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';

    // Restore scroll position
    window.scrollTo(0, this.scrollPosition);

    this.isLocked = false;
  }

  /**
   * Prevent scroll event handler
   */
  private static preventScroll = (e: Event): void => {
    e.preventDefault();
  };

  /**
   * Check if scroll is currently locked
   */
  static isScrollLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Toggle scroll lock
   */
  static toggleScrollLock(): void {
    if (this.isLocked) {
      this.unlockScroll();
    } else {
      this.lockScroll();
    }
  }

  /**
   * Smooth scroll to element
   */
  static scrollToElement(elementId: string, offset = 0): void {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }

  /**
   * Smooth scroll to top
   */
  static scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Check if element is in viewport
   */
  static isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Get scroll position
   */
  static getScrollPosition(): { x: number; y: number } {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
  }
}
