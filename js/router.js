/**
 * StorePulse AI - Client-Side Tab Router
 */

export class TabRouter {
  constructor() {
    this.navLinks = document.querySelectorAll('[data-nav-tab]');
    this.tabViews = document.querySelectorAll('.tab-view');
    this.defaultTab = 'overview';

    this.init();
  }

  init() {
    // Listen for hash changes in URL
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });

    // Handle initial route on page load
    this.handleRoute();

    // Click handler for nav links
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = link.getAttribute('data-nav-tab');
        window.location.hash = targetTab;
      });
    });

    // Support in-page links that jump to tabs (e.g. data-jump-tab="live-cameras")
    document.addEventListener('click', (e) => {
      const jumpBtn = e.target.closest('[data-jump-tab]');
      if (jumpBtn) {
        e.preventDefault();
        const tab = jumpBtn.getAttribute('data-jump-tab');
        window.location.hash = tab;
      }
    });
  }

  handleRoute() {
    let hash = window.location.hash.replace('#', '').trim();
    if (!hash) {
      hash = this.defaultTab;
    }

    // Verify if tab exists
    const targetView = document.getElementById(`tab-${hash}`);
    const activeTab = targetView ? hash : this.defaultTab;

    // Switch view visibility
    this.tabViews.forEach(view => {
      if (view.id === `tab-${activeTab}`) {
        view.classList.remove('hidden');
        view.classList.add('block', 'animate-fadeIn');
      } else {
        view.classList.add('hidden');
        view.classList.remove('block', 'animate-fadeIn');
      }
    });

    // Update Sidebar Navigation Active Highlights
    this.navLinks.forEach(link => {
      const tabKey = link.getAttribute('data-nav-tab');
      const isFeatured = link.classList.contains('tab-featured');
      const featuredClass = isFeatured ? ' tab-featured' : '';

      if (tabKey === activeTab) {
        // Active state: navy blue fill + white text
        link.className = `glass-tab${featuredClass} active flex items-center px-gutter-md py-gutter-sm rounded-xl transition-all bg-primary text-white font-headline-sm font-semibold shadow-md`;
        // Handle special tabs that have inner divs (Live Cameras)
        const innerDiv = link.querySelector('div');
        if (innerDiv) {
          innerDiv.className = 'flex items-center gap-gutter-md';
        } else {
          link.className += ' gap-gutter-md';
        }
      } else {
        // Inactive state
        if (isFeatured) {
          link.className = `glass-tab${featuredClass} flex items-center px-gutter-md py-gutter-sm rounded-xl font-body-md text-body-md transition-all`;
        } else {
          link.className = `glass-tab flex items-center gap-gutter-md px-gutter-md py-gutter-sm rounded-xl font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-all`;
        }
        // Handle special tabs that have inner divs
        const innerDiv = link.querySelector('div');
        if (innerDiv) {
          innerDiv.className = 'flex items-center gap-gutter-md';
        } else {
          link.className += ' gap-gutter-md';
        }
      }
    });

    // Scroll to top of main area
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
