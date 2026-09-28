/**
 * EyeQ Retail Intelligence - Queue & Predictive Surge Simulator
 * Counter 1-4 Indian staff members and automated express lane dispatching.
 */
import { store } from './state.js';

export class QueueManager {
  constructor(toastManager) {
    this.toastManager = toastManager;
    this.surgeCard = document.getElementById('aiSurgeCard');
    this.openCounter4Btn = document.getElementById('openCounter4Btn');
    this.activateLaneBtn = document.getElementById('activateLaneBtn');
    this.avgWaitDisplay = document.getElementById('avgWaitDisplay');
    this.avgWaitBadge = document.getElementById('avgWaitBadge');
    this.avgWaitSubtext = document.getElementById('avgWaitSubtext');

    this.init();
  }

  init() {
    this.setupListeners();
    this.renderQueues();

    store.subscribe((event) => {
      if (event === 'counter4_activated') {
        this.renderQueues();
        this.updateTopWaitKpi();
        if (this.toastManager) {
          this.toastManager.show('Counter 04 (Express) Activated by Pooja R. Queue rebalanced across 4 lanes.', 'success');
        }
      }
    });
  }

  setupListeners() {
    if (this.openCounter4Btn) {
      this.openCounter4Btn.addEventListener('click', () => {
        store.activateCounter4();
      });
    }

    if (this.activateLaneBtn) {
      this.activateLaneBtn.addEventListener('click', () => {
        store.activateCounter4();
      });
    }
  }

  renderQueues() {
    const state = store.getState();
    const c3 = state.counters.c3;
    const c4 = state.counters.c4;

    // Counter 3 Element
    const c3Card = document.getElementById('counter3Card');
    const c3Wait = document.getElementById('counter3Wait');
    const c3Count = document.getElementById('counter3Count');
    const c3Dot = document.getElementById('counter3Dot');

    if (c3Card && c3Wait && c3Count && c3Dot) {
      if (c3.status === 'active') {
        // Congestion cleared!
        c3Card.className = 'flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all';
        c3Dot.className = 'w-2 h-2 rounded-full bg-on-tertiary-container';
        c3Count.className = 'font-label-md text-label-md font-mono text-on-surface font-semibold';
        c3Count.textContent = `${c3.count} in line`;
        c3Wait.className = 'font-label-sm text-label-sm text-on-surface-variant block';
        c3Wait.textContent = `Wait: ${c3.wait}`;
      } else {
        c3Count.textContent = `${c3.count} in line`;
        c3Wait.textContent = `Wait: ${c3.wait} ⚠`;
      }
    }

    // Counter 4 Element
    const c4Card = document.getElementById('counter4Card');
    const c4Content = document.getElementById('counter4Content');
    const c4Dot = document.getElementById('counter4Dot');

    if (c4Card && c4Content && c4Dot) {
      if (c4.status === 'active') {
        c4Card.className = 'flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all border border-emerald-500/30';
        c4Dot.className = 'w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse';
        c4Content.innerHTML = `
          <div>
            <span class="font-label-md text-label-md font-semibold text-on-surface">Counter 04 (Express)</span>
            <span class="font-label-sm text-label-sm text-on-tertiary-container font-medium block">Staff: Pooja R. (Active)</span>
          </div>
        `;
        const c4Right = document.getElementById('counter4Right');
        if (c4Right) {
          c4Right.innerHTML = `
            <span class="font-label-md text-label-md font-mono text-on-surface font-semibold">${c4.count} in line</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant block">Wait: ${c4.wait}</span>
          `;
        }
      }
    }

    // AI Surge Card Update
    if (this.surgeCard && state.counter4Activated) {
      this.surgeCard.className = 'p-3 rounded-lg bg-[#ECFDF5] border border-emerald-300 flex items-start gap-3 transition-all';
      this.surgeCard.innerHTML = `
        <div class="w-7 h-7 rounded-md bg-[#A7F3D0] text-[#065F46] flex items-center justify-center shrink-0 mt-0.5">
          <span class="material-symbols-outlined text-[18px]">check_circle</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <span class="font-label-sm text-label-sm font-semibold text-[#065F46] uppercase tracking-wider">Surge Absorbed</span>
            <span class="font-label-sm text-label-sm text-[#065F46] font-mono font-medium">All 4 Billing Lanes Active</span>
          </div>
          <p class="font-body-sm text-body-sm text-[#065F46] mt-0.5">
            Counter 04 (Express) successfully absorbed customer rush. Average queue wait decreased by 50s.
          </p>
        </div>
      `;
    }
  }

  updateTopWaitKpi() {
    if (this.avgWaitDisplay) {
      this.avgWaitDisplay.textContent = '1m 55s';
    }
    if (this.avgWaitBadge) {
      this.avgWaitBadge.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#ECFDF5] text-[#065F46]';
      this.avgWaitBadge.textContent = '-5s vs SLA Target';
    }
    if (this.avgWaitSubtext) {
      this.avgWaitSubtext.textContent = 'SLA Compliant (Optimal)';
      this.avgWaitSubtext.className = 'font-label-sm text-label-sm text-on-tertiary-container font-medium';
    }
  }
}
