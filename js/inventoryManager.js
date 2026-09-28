/**
 * EyeQ Retail Intelligence - Inventory & Shelf Replenishment Manager
 * Indian FMCG SKUs, INR pricing, and automatic restock dispatching.
 */
import { store } from './state.js';

export class InventoryManager {
  constructor(toastManager) {
    this.toastManager = toastManager;
    this.tableBody = document.getElementById('inventoryTableBody');
    this.searchInput = document.getElementById('inventorySearchInput');
    this.deptFilterBtns = document.querySelectorAll('[data-dept-filter]');
    this.criticalRestockBanner = document.getElementById('criticalRestockBanner');
    this.dispatchBannerBtn = document.getElementById('dispatchBannerBtn');

    this.currentDept = 'all';
    this.searchQuery = '';

    this.simVoidInvBtn = document.getElementById('simVoidInvBtn');
    this.visionThumbBtns = document.querySelectorAll('[data-select-vision-img]');
    this.activeVisionImg = document.getElementById('activeVisionImg');
    this.activeVisionTitle = document.getElementById('activeVisionTitle');
    this.visionMetricsList = document.getElementById('visionMetricsList');

    this.init();
  }

  init() {
    this.render();
    this.setupListeners();

    store.subscribe((event) => {
      if (event === 'inventory_updated') {
        this.render();
      }
    });
  }

  setupListeners() {
    if (this.simVoidInvBtn) {
      this.simVoidInvBtn.addEventListener('click', () => {
        const alert = store.triggerVoidDetection();
        this.toastManager.show(`YOLOv8 Model Alert Generated: Void Shelf Detected on ${alert.voidData.title}`, 'warning');
        this.updateVisionCard(alert.voidData);
      });
    }

    this.visionThumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-select-vision-img'), 10);
        const images = store.getState().voidDetection.images;
        if (images && images[idx]) {
          this.updateVisionCard(images[idx]);
          this.visionThumbBtns.forEach(b => b.classList.remove('border-2', 'border-blue-600'));
          btn.classList.add('border-2', 'border-blue-600');
        }
      });
    });

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    this.deptFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentDept = btn.getAttribute('data-dept-filter');
        this.deptFilterBtns.forEach(b => {
          b.classList.remove('bg-primary', 'text-surface');
          b.classList.add('bg-surface-container-low', 'text-on-surface-variant');
        });
        btn.classList.add('bg-primary', 'text-surface');
        btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
        this.render();
      });
    });

    if (this.dispatchBannerBtn) {
      this.dispatchBannerBtn.addEventListener('click', () => {
        this.restockItem('SKU-AML-01');
      });
    }
  }

  updateVisionCard(visionData) {
    if (this.activeVisionImg) this.activeVisionImg.src = visionData.src;
    if (this.activeVisionTitle) this.activeVisionTitle.textContent = visionData.title;
    if (this.visionMetricsList) {
      this.visionMetricsList.innerHTML = visionData.voids.map(v => `
        <div class="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-sm">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span class="font-mono text-xs font-bold text-blue-950">${v.label}</span>
            <span class="text-xs text-slate-600 font-semibold">${v.location} (${v.sku})</span>
          </div>
          <span class="text-xs font-bold font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Conf: ${(parseFloat(v.confidence) * 100).toFixed(0)}%</span>
        </div>
      `).join('');
    }
  }

  restockItem(skuId) {
    const state = store.getState();
    const item = state.inventory.find(i => i.sku === skuId);
    if (!item) return;

    item.stock = item.capacity;
    item.status = 'optimal';

    // Auto-dismiss the restock alert if it's the milk
    if (skuId === 'SKU-AML-01') {
      store.dismissAlert('alert-2');
    }

    store.notify('inventory_updated', item);
    this.toastManager.show(`Restock Batch Dispatched for ${item.name}. Shelf restored to ${item.capacity} units.`, 'success');
  }

  render() {
    const state = store.getState();
    let items = state.inventory || [];

    // Filter by Dept
    if (this.currentDept !== 'all') {
      items = items.filter(i => i.dept.toLowerCase() === this.currentDept.toLowerCase());
    }

    // Filter by Search Query
    if (this.searchQuery) {
      items = items.filter(i => 
        i.name.toLowerCase().includes(this.searchQuery) ||
        i.sku.toLowerCase().includes(this.searchQuery) ||
        i.dept.toLowerCase().includes(this.searchQuery)
      );
    }

    // Update Critical Banner Visibility (Amul Milk)
    const milkItem = (state.inventory || []).find(i => i.sku === 'SKU-AML-01');
    if (this.criticalRestockBanner) {
      if (milkItem && milkItem.status === 'critical') {
        this.criticalRestockBanner.classList.remove('hidden');
      } else {
        this.criticalRestockBanner.classList.add('hidden');
      }
    }

    if (!this.tableBody) return;

    if (items.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="p-6 text-center text-on-surface-variant font-label-md">
            No grocery items found matching your filter.
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = items.map(item => {
      const pct = Math.round((item.stock / item.capacity) * 100);
      let statusBadge = '';
      let barColor = 'bg-on-tertiary-container';

      if (item.status === 'critical') {
        statusBadge = '<span class="px-2 py-0.5 rounded font-label-sm text-[11px] bg-[#FEF2F2] text-[#991B1B] font-semibold">Critical Depletion</span>';
        barColor = 'bg-[#DC2626]';
      } else if (item.status === 'warning') {
        statusBadge = '<span class="px-2 py-0.5 rounded font-label-sm text-[11px] bg-[#FFFBEB] text-[#92400E] font-medium">Low Threshold</span>';
        barColor = 'bg-[#D97706]';
      } else {
        statusBadge = '<span class="px-2 py-0.5 rounded font-label-sm text-[11px] bg-[#ECFDF5] text-[#065F46] font-medium">Optimal Stock</span>';
        barColor = 'bg-on-tertiary-container';
      }

      return `
        <tr class="border-b border-slate-100 hover:bg-surface-container-low transition-colors text-sm">
          <td class="py-3 px-4 font-mono text-xs font-semibold text-on-surface">${item.sku}</td>
          <td class="py-3 px-4 font-medium text-on-surface">
            ${item.name}
            <span class="block text-xs text-on-surface-variant">${item.location}</span>
          </td>
          <td class="py-3 px-4 text-on-surface-variant">${item.dept}</td>
          <td class="py-3 px-4 font-mono text-xs font-semibold text-on-surface">${item.price || '₹--'}</td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-2">
              <span class="font-mono font-semibold text-on-surface">${item.stock}</span>
              <span class="text-xs text-on-surface-variant">/ ${item.capacity}</span>
            </div>
            <div class="w-24 bg-surface-container h-1.5 rounded-full mt-1 overflow-hidden">
              <div class="${barColor} h-full rounded-full transition-all duration-300" style="width: ${pct}%"></div>
            </div>
          </td>
          <td class="py-3 px-4 font-mono text-xs text-on-surface-variant">${item.velocity}</td>
          <td class="py-3 px-4">${statusBadge}</td>
          <td class="py-3 px-4 text-right">
            <button class="px-2.5 py-1 rounded bg-surface-container hover:bg-primary hover:text-surface font-label-sm text-xs font-medium transition-all active:scale-95"
                    data-restock-sku="${item.sku}">
              ${item.status === 'critical' ? 'Dispatch Now' : 'Restock'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row button clicks
    this.tableBody.querySelectorAll('[data-restock-sku]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.getAttribute('data-restock-sku');
        this.restockItem(sku);
      });
    });
  }
}
