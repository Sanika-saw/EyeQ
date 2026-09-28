/**
 * EyeQ Retail Intelligence - Alerts & Toast Notification Manager
 */
import { store } from './state.js';

export class ToastManager {
  constructor() {
    this.container = document.getElementById('toastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'warning') icon = 'warning';

    toast.innerHTML = `
      <span class="material-symbols-outlined text-[18px]">${icon}</span>
      <span>${message}</span>
    `;

    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  showPopup(title, message, imageSrc, actionCallback) {
    const popup = document.createElement('div');
    popup.className = 'fixed top-20 right-6 z-[9999] w-96 glass-panel rounded-2xl p-4 border border-blue-400/80 shadow-2xl transition-all duration-300 transform translate-y-4 opacity-0';
    popup.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
          <span class="material-symbols-outlined text-[22px]">center_focus_strong</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="font-label-sm font-bold text-blue-900 uppercase tracking-wider text-[11px]">AI Vision Alert</span>
            <span class="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
          </div>
          <h4 class="font-headline-sm text-sm font-bold text-slate-900 mt-0.5 leading-snug">${title}</h4>
          <p class="text-xs text-slate-600 mt-1 font-medium leading-relaxed">${message}</p>
          
          ${imageSrc ? `
            <div class="relative w-full h-28 rounded-lg overflow-hidden my-2 border border-blue-300 shadow-sm">
              <img src="${imageSrc}" class="w-full h-full object-cover"/>
              <span class="absolute bottom-1 right-1 bg-slate-900/90 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">YOLOv8 Output</span>
            </div>
          ` : ''}

          <div class="mt-2 flex items-center justify-end gap-2">
            <button class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/50" id="closePopupBtn">
              Dismiss
            </button>
            <button class="btn-glass-primary px-3 py-1 rounded-xl text-xs font-bold shadow-md" id="actionPopupBtn">
              Inspect Image & Voids
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    requestAnimationFrame(() => {
      popup.classList.remove('translate-y-4', 'opacity-0');
      popup.classList.add('translate-y-0', 'opacity-100');
    });

    const closePopup = () => {
      popup.classList.remove('translate-y-0', 'opacity-100');
      popup.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
      }, 300);
    };

    const closeBtn = popup.querySelector('#closePopupBtn');
    const actionBtn = popup.querySelector('#actionPopupBtn');

    if (closeBtn) closeBtn.onclick = closePopup;
    if (actionBtn) {
      actionBtn.onclick = () => {
        closePopup();
        if (actionCallback) actionCallback();
      };
    }

    setTimeout(closePopup, 8000);
  }
}

export class AlertsManager {
  constructor(toastManager) {
    this.toastManager = toastManager;
    this.alertsContainer = document.getElementById('alertsListContainer');
    this.alertsCountBadge = document.getElementById('alertsCountBadge');
    this.navAlertsBadge = document.getElementById('navAlertsBadge');
    this.filterStreamBtn = document.getElementById('filterStreamBtn');
    this.filterModal = document.getElementById('filterModal');
    this.closeFilterBtn = document.getElementById('closeFilterBtn');
    this.filterButtons = document.querySelectorAll('[data-filter-severity]');

    this.currentFilter = 'all';

    this.init();
  }

  init() {
    this.renderAlerts();
    this.setupListeners();

    store.subscribe((event) => {
      if (event === 'counter4_activated' || event === 'alert_dismissed') {
        this.renderAlerts();
      }
    });
  }

  setupListeners() {
    // Open Filter Modal
    if (this.filterStreamBtn && this.filterModal) {
      this.filterStreamBtn.addEventListener('click', () => {
        this.filterModal.classList.add('open');
      });
    }

    // Close Filter Modal
    if (this.closeFilterBtn && this.filterModal) {
      this.closeFilterBtn.addEventListener('click', () => {
        this.filterModal.classList.remove('open');
      });
    }

    // Severity Filter Buttons
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentFilter = btn.getAttribute('data-filter-severity');
        this.filterButtons.forEach(b => b.classList.remove('ring-2', 'ring-primary'));
        btn.classList.add('ring-2', 'ring-primary');
        this.renderAlerts();
        if (this.filterModal) {
          this.filterModal.classList.remove('open');
        }
        this.toastManager.show(`Filter applied: ${this.currentFilter.toUpperCase()}`, 'info');
      });
    });
  }

  renderAlerts() {
    const state = store.getState();
    let alerts = state.alerts;

    if (this.currentFilter !== 'all') {
      alerts = alerts.filter(a => a.type === this.currentFilter);
    }

    // Update Badges
    const totalCount = state.alerts.length;
    if (this.alertsCountBadge) {
      this.alertsCountBadge.textContent = `${totalCount} Active`;
      if (totalCount === 0) {
        this.alertsCountBadge.className = 'bg-on-tertiary-container text-surface font-label-sm text-label-sm px-1.5 py-0.5 rounded-full font-medium';
        this.alertsCountBadge.textContent = 'All Clear';
      }
    }
    if (this.navAlertsBadge) {
      this.navAlertsBadge.textContent = totalCount;
      if (totalCount === 0) {
        this.navAlertsBadge.classList.add('hidden');
      } else {
        this.navAlertsBadge.classList.remove('hidden');
      }
    }

    if (!this.alertsContainer) return;

    if (alerts.length === 0) {
      this.alertsContainer.innerHTML = `
        <div class="p-6 text-center text-on-surface-variant bg-surface-container-low rounded-lg">
          <span class="material-symbols-outlined text-[28px] text-on-tertiary-container">verified</span>
          <p class="font-label-md text-label-md font-medium text-on-surface mt-1">No Active Incidents</p>
          <p class="text-[12px] text-on-surface-variant">All store sections and billing counters operating within SLA targets.</p>
        </div>
      `;
      return;
    }

    this.alertsContainer.innerHTML = alerts.map(alert => {
      // Dynamic Void Shelf Alert Card with Model Image Output
      if (alert.isVoidAlert) {
        const voidImg = alert.voidData;
        return `
          <div class="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-400/60 flex flex-col md:flex-row items-start gap-4 transition-all shadow-sm" id="alertCard-${alert.id}">
            <div class="relative w-full md:w-36 h-28 shrink-0 rounded-xl overflow-hidden border border-blue-300 shadow-md group cursor-pointer" data-inspect-void-id="${alert.id}">
              <img src="${voidImg.src}" alt="${voidImg.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
              <div class="absolute inset-0 bg-blue-950/20 group-hover:bg-blue-950/0 transition-colors"></div>
              <span class="absolute bottom-1.5 left-1.5 bg-blue-900/90 text-white font-mono text-[10px] px-1.5 py-0.5 rounded font-bold backdrop-blur-sm">YOLOv8 Output</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  <span class="font-label-md text-label-md font-bold text-blue-950">${alert.title}</span>
                </div>
                <span class="font-label-sm text-label-sm text-blue-800 font-mono font-medium">${alert.time}</span>
              </div>
              <p class="font-body-sm text-body-sm text-slate-700 mt-1 font-medium leading-relaxed">${alert.desc}</p>
              
              <div class="mt-2.5 flex flex-wrap items-center gap-2">
                <button class="btn-glass-primary px-3 py-1 rounded-xl text-xs font-bold shadow-md flex items-center gap-1" data-inspect-void-id="${alert.id}">
                  <span class="material-symbols-outlined text-[16px] text-blue-300">visibility</span>
                  <span>Inspect Bounding Boxes</span>
                </button>
                <button class="btn-glass-secondary px-3 py-1 rounded-xl text-xs font-semibold text-slate-800" data-dispatch-void-id="${alert.id}">
                  Acknowledge & Dispatch Restock
                </button>
              </div>
            </div>
          </div>
        `;
      }

      if (alert.id === 'alert-2') {
        // Shelf Restock Alert with action buttons
        return `
          <div class="p-2.5 rounded-lg bg-[#FFFBEB] border border-amber-200/60 flex items-start gap-2.5 transition-all" id="alertCard-${alert.id}">
            <div class="w-6 h-6 rounded bg-[#FDE68A] text-[#92400E] flex items-center justify-center shrink-0 mt-0.5">
              <span class="material-symbols-outlined text-[16px]">${alert.icon}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="font-label-sm text-label-sm font-semibold text-[#92400E]">${alert.title}</span>
                <span class="font-label-sm text-label-sm text-[#92400E]/80 font-mono">${alert.time}</span>
              </div>
              <p class="font-body-sm text-body-sm text-[#92400E] mt-0.5">${alert.desc}</p>
              <div class="mt-2 flex items-center gap-2">
                <button class="px-2 py-0.5 rounded text-[11px] font-medium bg-[#92400E] text-surface hover:bg-[#78350F] transition-colors"
                        id="dispatchRestockBtn">
                  Acknowledge & Dispatch
                </button>
                <button class="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FDE68A] text-[#92400E] hover:bg-[#FCD34D] transition-colors"
                        id="ignoreRestockBtn">
                  Ignore
                </button>
              </div>
            </div>
          </div>
        `;
      }

      if (alert.id === 'alert-1') {
        // Congestion Spike Counter 3
        return `
          <div class="p-2.5 rounded-lg bg-[#FEF2F2] border border-red-200/60 flex items-start gap-2.5 transition-all" id="alertCard-${alert.id}">
            <div class="w-6 h-6 rounded bg-[#FEE2E2] text-[#991B1B] flex items-center justify-center shrink-0 mt-0.5">
              <span class="material-symbols-outlined text-[16px]">${alert.icon}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="font-label-sm text-label-sm font-semibold text-on-surface">${alert.title}</span>
                <span class="font-label-sm text-label-sm text-on-surface-variant font-mono">${alert.time}</span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">${alert.desc}</p>
            </div>
          </div>
        `;
      }

      // Default Alert (Alert 3)
      return `
        <div class="p-2.5 rounded-lg bg-surface-container-low flex items-start gap-2.5 transition-all" id="alertCard-${alert.id}">
          <div class="w-6 h-6 rounded bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-[16px]">${alert.icon}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm font-semibold text-on-surface">${alert.title}</span>
              <span class="font-label-sm text-label-sm text-on-surface-variant font-mono">${alert.time}</span>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">${alert.desc}</p>
            <div class="mt-2 flex items-center gap-2">
              <button class="text-[11px] font-medium text-primary hover:underline" id="inspectAisle3Btn">
                Inspect Feed (CAM-04) →
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach Dynamic Handlers for Void Detection Cards
    this.alertsContainer.querySelectorAll('[data-inspect-void-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const alertId = btn.getAttribute('data-inspect-void-id');
        const alertObj = state.alerts.find(a => a.id === alertId);
        if (alertObj && alertObj.voidData) {
          this.openVoidModal(alertObj);
        }
      });
    });

    this.alertsContainer.querySelectorAll('[data-dispatch-void-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const alertId = btn.getAttribute('data-dispatch-void-id');
        store.resolveVoidAlert(alertId);
        this.toastManager.show('Shelf Restock Dispatch Order generated and assigned to floor associate.', 'success');
      });
    });

    const dispatchBtn = document.getElementById('dispatchRestockBtn');
    if (dispatchBtn) {
      dispatchBtn.addEventListener('click', () => {
        store.dismissAlert('alert-2');
        this.toastManager.show('Restock Order Dispatched for Aisle 3 (Amul Taaza Milk 1L). Associate on route.', 'success');
      });
    }

    const ignoreBtn = document.getElementById('ignoreRestockBtn');
    if (ignoreBtn) {
      ignoreBtn.addEventListener('click', () => {
        store.dismissAlert('alert-2');
        this.toastManager.show('Restock alert dismissed.', 'info');
      });
    }

    const inspectBtn = document.getElementById('inspectAisle3Btn');
    if (inspectBtn) {
      inspectBtn.addEventListener('click', () => {
        store.setActiveCamera('cam-01');
        this.toastManager.show('Switched viewport to CAM-01 (Main Sales Floor).', 'info');
      });
    }
  }

  openVoidModal(alertObj) {
    const voidModal = document.getElementById('voidModal');
    const modalTitle = document.getElementById('voidModalTitle');
    const modalSubtitle = document.getElementById('voidModalSubtitle');
    const modalBody = document.getElementById('voidModalBody');
    const closeBtn = document.getElementById('closeVoidModalBtn');
    const dismissBtn = document.getElementById('dismissVoidModalBtn');
    const dispatchBtn = document.getElementById('dispatchVoidModalBtn');

    if (!voidModal || !modalBody) return;

    const voidData = alertObj.voidData;
    if (modalTitle) modalTitle.textContent = alertObj.title;
    if (modalSubtitle) modalSubtitle.textContent = `YOLOv8 Inference Output · ${voidData.voids.length} Void Regions Identified`;

    modalBody.innerHTML = `
      <div class="relative w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-blue-400/60 shadow-lg">
        <img src="${voidData.src}" alt="${voidData.title}" class="w-full h-full object-contain bg-slate-950"/>
        <div class="absolute top-3 left-3 bg-blue-900/90 backdrop-blur-md text-white font-mono text-xs px-2.5 py-1 rounded-md border border-white/20">
          CAM-VISION: ${voidData.title}
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        ${voidData.voids.map(v => `
          <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 flex flex-col justify-between">
            <div>
              <span class="text-xs font-bold text-blue-900 font-mono block">${v.label}</span>
              <span class="text-xs text-slate-700 font-semibold mt-0.5 block">${v.sku}</span>
              <span class="text-[11px] text-slate-500 font-medium">${v.location}</span>
            </div>
            <span class="mt-2 text-[10px] font-bold text-blue-800 bg-blue-200/80 px-1.5 py-0.5 rounded self-start">Confidence: ${(parseFloat(v.confidence) * 100).toFixed(0)}%</span>
          </div>
        `).join('')}
      </div>
    `;

    voidModal.classList.add('open');

    const closeModal = () => voidModal.classList.remove('open');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (dismissBtn) dismissBtn.onclick = closeModal;
    if (dispatchBtn) {
      dispatchBtn.onclick = () => {
        closeModal();
        store.resolveVoidAlert(alertObj.id);
        this.toastManager.show(`Restock Order Dispatched for ${voidData.title}`, 'success');
      };
    }
  }
}
