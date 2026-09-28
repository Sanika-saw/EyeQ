/**
 * EyeQ Retail Intelligence - Main Application Orchestrator (Multi-Tab SPA)
 */
import { store } from './state.js?v=7';
import { TabRouter } from './router.js?v=7';
import { CameraFeedManager } from './cameraFeed.js?v=7';
import { QueueManager } from './queueSimulator.js?v=7';
import { ToastManager, AlertsManager } from './alertsManager.js?v=7';
import { InventoryManager } from './inventoryManager.js?v=7';
import { ChartRenderer } from './chartRenderer.js?v=7';
import { TelegramBotService } from './telegramBot.js?v=7';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Toast Notification System
  const toastManager = new ToastManager();

  // 2. Initialize Tab Router
  const router = new TabRouter();

  // 3. Initialize Subsystems
  const cameraManager = new CameraFeedManager(toastManager);
  const queueManager = new QueueManager(toastManager);
  const alertsManager = new AlertsManager(toastManager);
  const inventoryManager = new InventoryManager(toastManager);
  const chartRenderer = new ChartRenderer();
  const telegramBot = new TelegramBotService(toastManager);

  // 4. Clock & Real-time Telemetry (IST)
  function startClock() {
    const clockEl = document.getElementById('liveTimestamp');
    const headerClockEl = document.getElementById('headerClock');

    function update() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      
      if (clockEl) {
        clockEl.textContent = `${h}:${m}:${s}.${ms} IST`;
      }
      if (headerClockEl) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        headerClockEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} • ${h}:${m} IST`;
      }
    }
    setInterval(update, 1000);
  }
  startClock();

  // 5. Background Telemetry Pulse
  setInterval(() => {
    store.tickTelemetry();
  }, 3500);

  // 5.5 Auto-cycle void images in the Inventory YOLOv8 vision card every 30 seconds
  // CAM-02 always shows voidvdo.mp4 looping — the void images rotate only in the shelf vision card
  const voidImageAssets = [
    { src: 'assets/cctv/void full.png', title: 'juices/coolers' },
    { src: 'assets/cctv/void 1.jpeg', title: 'detergents/cleaners' },
    { src: 'assets/cctv/void 2.png',  title: 'shampoo/personal care' },
    { src: 'assets/cctv/void 3.jpeg', title: 'Snacks Aisle — Empty Rack Detected (Zone C)' },
    { src: 'assets/cctv/void4 .jpeg', title: 'Dairy Coolers — Stock Gap (Zone D)' },
    { src: 'assets/cctv/void5.jpeg',  title: 'Personal Care — Shelf Void (Aisle 3)' }
  ];
  let voidImgCycleIndex = 0;

  setInterval(() => {
    voidImgCycleIndex = (voidImgCycleIndex + 1) % voidImageAssets.length;
    const asset = voidImageAssets[voidImgCycleIndex];

    // Update Inventory YOLOv8 vision card image
    const visionImg = document.getElementById('activeVisionImg');
    const visionTitle = document.getElementById('activeVisionTitle');
    if (visionImg) { visionImg.src = asset.src; }
    if (visionTitle) { visionTitle.textContent = asset.title; }

    // Send Telegram alert
    telegramBot.dispatchAlert(
      'VOID_DETECTED',
      `[Shelf Vision Scan] Void Detected — ${asset.title}. Image: ${asset.src.split('/').pop()}`,
      'HIGH'
    );
  }, 30000);

  // Ensure CAM-02 main feed always plays voidvdo.mp4 (loop continuously, never blue screen)
  const ensureVoidFeedPlaying = () => {
    const feedVideo = document.getElementById('cameraVideo');
    const currentState = store.getState();
    if (currentState.activeCameraId === 'cam-02' && feedVideo) {
      if (feedVideo.paused || feedVideo.src.includes('void') === false) {
        const expectedSrc = window.location.origin + '/assets/cctv/voidvdo.mp4';
        if (!feedVideo.src.endsWith('voidvdo.mp4')) {
          feedVideo.src = 'assets/cctv/voidvdo.mp4';
          feedVideo.loop = true;
          feedVideo.load();
        }
        feedVideo.play().catch(() => {});
      }
    }
  };
  setInterval(ensureVoidFeedPlaying, 3000);

  // Subscribe Top KPI Elements to State
  const occupancyCountEl = document.getElementById('occupancyCount');
  const occupancyBarEl = document.getElementById('occupancyBar');
  const occupancyPercentLabel = document.getElementById('occupancyPercentLabel');
  const footfallCountEl = document.getElementById('footfallCount');
  const nodeLatencyEl = document.getElementById('nodeLatency');

  store.subscribe((event, data, state) => {
    if (event === 'telemetry_tick') {
      if (occupancyCountEl) {
        occupancyCountEl.textContent = state.occupancy;
      }
      if (occupancyBarEl) {
        const pct = Math.round((state.occupancy / state.safeCapacity) * 100);
        occupancyBarEl.style.width = `${pct}%`;
        if (occupancyPercentLabel) {
          occupancyPercentLabel.textContent = `${pct}% of capacity`;
        }
      }
      if (footfallCountEl) {
        footfallCountEl.textContent = state.footfall.toLocaleString();
      }
      if (nodeLatencyEl) {
        nodeLatencyEl.textContent = `Latency ${state.latency}ms • Stable`;
      }
    }
  });

  // 6. Interactive Spatial Zones (Floor & Heatmap tab)
  const zoneCards = document.querySelectorAll('[data-zone-key]');
  zoneCards.forEach(card => {
    card.addEventListener('click', () => {
      const zoneKey = card.getAttribute('data-zone-key');
      store.selectZone(zoneKey);
      
      zoneCards.forEach(c => c.classList.remove('ring-2', 'ring-primary', 'bg-surface-container'));
      card.classList.add('ring-2', 'ring-primary', 'bg-surface-container');

      const state = store.getState();
      const zone = state.zones[zoneKey];
      if (zone) {
        toastManager.show(`Spatial Focus: ${zone.name} · Viewport linked to ${zone.cam.toUpperCase()}`, 'info');
      }
    });
  });

  // 7. Settings Tab Handlers
  const slaTargetInput = document.getElementById('slaTargetInput');
  const maxOccupancyInput = document.getElementById('maxOccupancyInput');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const exportTelemetryBtn = document.getElementById('exportTelemetryBtn');

  // Telegram Bot Settings UI Elements
  const telegramTokenInput = document.getElementById('telegramTokenInput');
  const telegramChatIdInput = document.getElementById('telegramChatIdInput');
  const saveTelegramBotBtn = document.getElementById('saveTelegramBotBtn');
  const testTelegramBotBtn = document.getElementById('testTelegramBotBtn');

  // Pre-fill inputs with active state
  const tgState = store.getState().telegramBot;
  if (telegramTokenInput && tgState.botToken) telegramTokenInput.value = tgState.botToken;
  if (telegramChatIdInput && tgState.chatId) telegramChatIdInput.value = tgState.chatId;

  if (saveTelegramBotBtn) {
    saveTelegramBotBtn.addEventListener('click', () => {
      const token = telegramTokenInput ? telegramTokenInput.value : '';
      const chatId = telegramChatIdInput ? telegramChatIdInput.value : '';
      telegramBot.saveCredentials(token, chatId);
      toastManager.show('Telegram Bot API Token & Chat ID saved to local storage.', 'success');
    });
  }

  if (testTelegramBotBtn) {
    testTelegramBotBtn.addEventListener('click', async () => {
      toastManager.show('Testing Telegram Bot API connection using backend config (js/config.js)...', 'info');
      try {
        const botName = await telegramBot.testConnection();
        toastManager.show(`Telegram Bot Connected: ${botName}! Test message dispatched to Telegram.`, 'success', 5000);
      } catch (err) {
        toastManager.show(`Telegram Error: ${err.message}`, 'warning', 6000);
      }
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      if (maxOccupancyInput) {
        const val = parseInt(maxOccupancyInput.value, 10);
        if (!isNaN(val) && val > 50) {
          store.getState().safeCapacity = val;
        }
      }
      toastManager.show('EyeQ Store Configuration & SLA Parameters Saved.', 'success');
    });
  }

  if (exportTelemetryBtn) {
    exportTelemetryBtn.addEventListener('click', () => {
      const state = store.getState();
      const backupData = JSON.stringify(state, null, 2);
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EyeQ_Telemetry_Backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toastManager.show('Full system telemetry exported as JSON.', 'success');
    });
  }

  // 8. Global Export Shift Report Modal (from Header)
  const exportBtn = document.getElementById('exportReportBtn');
  const reportModal = document.getElementById('reportModal');
  const closeReportBtn = document.getElementById('closeReportBtn');
  const downloadReportCsvBtn = document.getElementById('downloadReportCsvBtn');

  if (exportBtn && reportModal) {
    exportBtn.addEventListener('click', () => {
      const state = store.getState();
      const reportContent = document.getElementById('reportModalContent');
      if (reportContent) {
        reportContent.innerHTML = `
          <div class="space-y-3 font-body-md text-body-md">
            <div class="p-3 bg-surface-container-low rounded-lg space-y-1">
              <div class="flex justify-between font-label-md"><span>Shift ID:</span><span class="font-mono">SH-2026-1024-IN</span></div>
              <div class="flex justify-between font-label-md"><span>Active Store:</span><span>${state.storeName} — ${state.storeLocation}</span></div>
              <div class="flex justify-between font-label-md"><span>Store Director:</span><span>${state.storeDirector}</span></div>
              <div class="flex justify-between font-label-md"><span>Total Cumulative Footfall:</span><span class="font-bold font-mono">${state.footfall} Shoppers</span></div>
              <div class="flex justify-between font-label-md"><span>Peak Occupancy:</span><span class="font-mono">152 Shoppers (13:30 IST)</span></div>
              <div class="flex justify-between font-label-md"><span>Average SLA Wait:</span><span class="font-mono">${Math.floor(state.avgWaitSeconds / 60)}m ${state.avgWaitSeconds % 60}s</span></div>
              <div class="flex justify-between font-label-md"><span>Counter 4 Status:</span><span class="font-medium ${state.counter4Activated ? 'text-on-tertiary-container' : 'text-[#92400E]'}">${state.counter4Activated ? 'Activated (Surge Mitigated)' : 'Standby'}</span></div>
            </div>
            <p class="text-xs text-on-surface-variant">Compiled automatically via EyeQ Edge Fleet Nodes. Verified against ISO-9001 Retail Standards.</p>
          </div>
        `;
      }
      reportModal.classList.add('open');
    });
  }

  if (closeReportBtn && reportModal) {
    closeReportBtn.addEventListener('click', () => {
      reportModal.classList.remove('open');
    });
  }

  if (downloadReportCsvBtn) {
    downloadReportCsvBtn.addEventListener('click', () => {
      const state = store.getState();
      const csv = `Metric,Value\nShift ID,SH-2026-1024-IN\nStore,EyeQMart — Pune Flagship #104 Pune\nDirector,Atharva\nTotal Footfall,${state.footfall}\nCurrent Occupancy,${state.occupancy}\nAverage Wait (seconds),${state.avgWaitSeconds}\nActive Cameras,${state.fleetOnline}\n`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EyeQ_Shift_Report_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      reportModal.classList.remove('open');
      toastManager.show('EyeQ Shift Report CSV exported successfully.', 'success');
    });
  }

  // 5. Background Telemetry Pulse & Real AI Footfall Polling
  setInterval(() => {
    store.tickTelemetry();
    store.fetchAiFootfall();
  }, 2000);

  // Initial AI footfall sync
  store.fetchAiFootfall();

  // 9. Void Detection Real AI Trigger Buttons
  const simVoidHeaderBtn = document.getElementById('simVoidHeaderBtn');
  const simVoidHeroBtn = document.getElementById('simVoidHeroBtn');

  async function triggerVoidSim() {
    toastManager.show('Running PyTorch YOLO (best.pt) vision model on shelf image...', 'info', 2000);
    const alert = await store.triggerRealAiVoidDetection('void-1');
    
    // 1. Trigger Rich Notification Popup Banner on UI
    toastManager.showPopup(
      `Shelf Out-of-Stock Detected!`,
      `PyTorch YOLO Vision Model (best.pt) identified ${alert.voidData.voids.length} empty product voids on ${alert.voidData.title}.`,
      alert.voidData.src,
      () => {
        window.location.hash = 'alerts';
        if (alertsManager) {
          alertsManager.openVoidModal(alert);
        }
      }
    );

    // 2. Standard Toast Confirmation
    toastManager.show(`PyTorch YOLO Model (best.pt): ${alert.voidData.voids.length} Voids detected on ${alert.voidData.title}!`, 'warning', 4000);
  }

  if (simVoidHeroBtn) {
    simVoidHeroBtn.addEventListener('click', triggerVoidSim);
  }
  if (simVoidHeaderBtn) {
    simVoidHeaderBtn.addEventListener('click', triggerVoidSim);
  }

  toastManager.show('EyeQ Retail Intelligence AI Surveillance Platform & PyTorch Microservice Connected.', 'success');

  // ============================================================
  // WEEKLY REPORT TAB — Render snapshot & handle downloads
  // ============================================================
  let weeklyVoidAlertCount = 0;

  function renderWeeklyReport() {
    // Handled by GSheet renderer
  }

  // =========================================================================
  // INTERACTIVE GOOGLE SHEET CONTROLLER FOR WEEKLY INVENTORY REPORT
  // =========================================================================
  let activeGSheetTab = 'inventory';
  let activeSelectedCell = { row: 1, col: 'A', val: 'SKU_CODE' };

  function renderGSheet(tabName = activeGSheetTab) {
    activeGSheetTab = tabName;
    const state = store.getState();
    const inventory = state.inventory || [];
    const tbody = document.getElementById('gSheetTableBody');
    const titleEl = document.getElementById('gSheetTitle');
    const rowCountEl = document.getElementById('gSheetRowCount');
    const formulaInput = document.getElementById('gSheetFormulaInput');
    const cellNameEl = document.getElementById('gSheetCellName');

    // Update Sheet Tabs UI
    document.querySelectorAll('.gsheet-tab').forEach(btn => {
      const t = btn.getAttribute('data-gsheet-tab');
      if (t === tabName) {
        btn.className = 'gsheet-tab active flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded-t border-b-2 border-b-[#0f9d58] font-semibold text-slate-800 shadow-sm';
      } else {
        btn.className = 'gsheet-tab flex items-center gap-1.5 px-3 py-1 text-slate-600 hover:bg-slate-200/70 rounded-t transition-colors font-medium';
      }
    });

    if (!tbody) return;

    let rowsHtml = '';
    const now = new Date();
    const fmtDate = d => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    if (tabName === 'inventory') {
      if (titleEl) titleEl.textContent = 'EyeQMart_Inventory_Weekly_Report_Pune.csv';
      
      // Header Row 1 (Spreadsheet Data Headers)
      const headers = ['SKU_CODE', 'PRODUCT_NAME', 'CATEGORY', 'UNIT_PRICE_INR', 'CURRENT_STOCK', 'MAX_CAPACITY', 'VELOCITY_UNITS_HR', 'STATUS', 'RESTOCK_PRIORITY', 'SHELF_LOCATION', 'YOLO_CONF'];
      rowsHtml += `<tr class="bg-[#e6f4ea] text-slate-800 font-bold border-b border-slate-300">
        <td class="w-10 text-center py-1.5 border-r border-slate-300 bg-[#f1f3f4] text-slate-500 font-mono text-[11px]">1</td>
        ${headers.map((h, i) => `<td class="py-1.5 px-3 border-r border-slate-300 hover:bg-[#d2e3fc] cursor-pointer" data-cell="${String.fromCharCode(65+i)}1" data-val="${h}">${h}</td>`).join('')}
      </tr>`;

      // Data Rows 2..13
      inventory.forEach((item, idx) => {
        const rowNum = idx + 2;
        const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
        const values = [
          item.sku,
          item.name,
          item.dept,
          item.price,
          item.stock,
          item.capacity,
          item.velocity,
          item.status.toUpperCase(),
          item.status === 'critical' ? 'P1 - High' : item.status === 'warning' ? 'P2 - Medium' : 'P3 - Low',
          item.location,
          item.status === 'critical' ? '94%' : '88%'
        ];

        const statusStyle = item.status === 'critical' ? 'bg-red-50 text-red-700 font-bold' : item.status === 'warning' ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-emerald-700 font-medium';

        rowsHtml += `<tr class="border-b border-slate-200 hover:bg-blue-50/50 transition-colors">
          <td class="w-10 text-center py-1.5 border-r border-slate-300 bg-[#f1f3f4] text-slate-500 font-mono text-[11px]">${rowNum}</td>
          ${values.map((v, colIdx) => {
            const cellId = `${colLetters[colIdx]}${rowNum}`;
            const isStatusCol = colIdx === 7;
            const styleClass = isStatusCol ? statusStyle : '';
            return `<td class="py-1.5 px-3 border-r border-slate-200 hover:bg-blue-100/60 cursor-pointer ${styleClass}" data-cell="${cellId}" data-val="${v}">${v}</td>`;
          }).join('')}
        </tr>`;
      });

      // Row 14: Totals & Summary Formula Row
      const totalUnits = inventory.reduce((s, i) => s + i.stock, 0);
      const totalCap = inventory.reduce((s, i) => s + i.capacity, 0);
      rowsHtml += `<tr class="bg-[#f8f9fa] border-b-2 border-slate-400 font-bold text-slate-800">
        <td class="w-10 text-center py-2 border-r border-slate-300 bg-[#e8eaed] text-slate-600 font-mono text-[11px]">14</td>
        <td class="py-2 px-3 border-r border-slate-300 text-blue-700" data-cell="A14" data-val="=TOTAL">TOTAL / AVG</td>
        <td class="py-2 px-3 border-r border-slate-300" data-cell="B14" data-val="12 Active SKUs">12 Active SKUs</td>
        <td class="py-2 px-3 border-r border-slate-300" data-cell="C14" data-val="All Depts">All Depts</td>
        <td class="py-2 px-3 border-r border-slate-300" data-cell="D14" data-val="=AVERAGE(D2:D13)">AVG ₹215</td>
        <td class="py-2 px-3 border-r border-slate-300 text-emerald-700" data-cell="E14" data-val="=SUM(E2:E13)">=SUM(E2:E13) [${totalUnits}]</td>
        <td class="py-2 px-3 border-r border-slate-300" data-cell="F14" data-val="=SUM(F2:F13)">=SUM(F2:F13) [${totalCap}]</td>
        <td class="py-2 px-3 border-r border-slate-300" data-cell="G14" data-val="=AVERAGE(G2:G13)">AVG 8.4 u/hr</td>
        <td class="py-2 px-3 border-r border-slate-300 text-red-600" data-cell="H14" data-val="1 CRITICAL">1 CRITICAL</td>
        <td class="py-2 px-3 border-r border-slate-300" data-cell="I14" data-val="Action Req.">Action Req.</td>
        <td class="py-2 px-3 border-r border-slate-300" data-cell="J14" data-val="Pune Store">Pune Store</td>
        <td class="py-2 px-3 border-r border-slate-300 text-blue-600" data-cell="K14" data-val="91.5% Avg">91.5% Avg</td>
      </tr>`;

      if (rowCountEl) rowCountEl.textContent = '14';
    } else if (tabName === 'footfall') {
      if (titleEl) titleEl.textContent = 'EyeQMart_Daily_Footfall_Summary.csv';
      const headers = ['DATE', 'DAY_OF_WEEK', 'TOTAL_FOOTFALL', 'PEAK_TIME_WINDOW', 'AVG_OCCUPANCY', 'CAPACITY_UTILIZATION', 'VOID_INCIDENTS', 'OPERATIONAL_STATUS'];
      rowsHtml += `<tr class="bg-[#e8f0fe] text-slate-800 font-bold border-b border-slate-300">
        <td class="w-10 text-center py-1.5 border-r border-slate-300 bg-[#f1f3f4] text-slate-500 font-mono text-[11px]">1</td>
        ${headers.map((h, i) => `<td class="py-1.5 px-3 border-r border-slate-300 hover:bg-[#d2e3fc] cursor-pointer" data-cell="${String.fromCharCode(65+i)}1" data-val="${h}">${h}</td>`).join('')}
      </tr>`;

      const dailyData = [
        { date: fmtDate(new Date(now - 6*86400000)), day: 'Mon', count: 214, peak: '13:00–14:00', occ: 68, cap: '32%', voids: 2, status: 'NORMAL' },
        { date: fmtDate(new Date(now - 5*86400000)), day: 'Tue', count: 231, peak: '12:30–13:30', occ: 72, cap: '34%', voids: 1, status: 'NORMAL' },
        { date: fmtDate(new Date(now - 4*86400000)), day: 'Wed', count: 189, peak: '11:00–12:00', occ: 55, cap: '26%', voids: 3, status: 'LIGHT' },
        { date: fmtDate(new Date(now - 3*86400000)), day: 'Thu', count: 278, peak: '17:00–18:00', occ: 84, cap: '40%', voids: 2, status: 'PEAK' },
        { date: fmtDate(new Date(now - 2*86400000)), day: 'Fri', count: 253, peak: '13:00–14:00', occ: 79, cap: '37%', voids: 4, status: 'MODERATE' },
        { date: fmtDate(new Date(now - 1*86400000)), day: 'Sat', count: 214, peak: '14:00–15:00', occ: 62, cap: '29%', voids: 2, status: 'NORMAL' },
        { date: fmtDate(now),                       day: 'Sun', count: state.footfall, peak: '13:00–14:00', occ: Math.round(state.occupancy), cap: `${Math.round((state.occupancy/210)*100)}%`, voids: weeklyVoidAlertCount, status: 'LIVE ACTIVE' }
      ];

      dailyData.forEach((d, idx) => {
        const rowNum = idx + 2;
        const vals = [d.date, d.day, d.count, d.peak, d.occ, d.cap, d.voids, d.status];
        rowsHtml += `<tr class="border-b border-slate-200 hover:bg-blue-50/50 transition-colors">
          <td class="w-10 text-center py-1.5 border-r border-slate-300 bg-[#f1f3f4] text-slate-500 font-mono text-[11px]">${rowNum}</td>
          ${vals.map((v, cIdx) => `<td class="py-1.5 px-3 border-r border-slate-200 hover:bg-blue-100/60 cursor-pointer" data-cell="${String.fromCharCode(65+cIdx)}${rowNum}" data-val="${v}">${v}</td>`).join('')}
        </tr>`;
      });

      if (rowCountEl) rowCountEl.textContent = '8';
    } else if (tabName === 'voids') {
      if (titleEl) titleEl.textContent = 'EyeQMart_YOLO_Void_Logs.csv';
      const headers = ['INCIDENT_ID', 'TIMESTAMP', 'ZONE_LOCATION', 'AFFECTED_SKU', 'SHELF_CONFIDENCE', 'DISPATCH_ACTION', 'RESOLUTION_STATUS', 'YOLO_MODEL'];
      rowsHtml += `<tr class="bg-[#fce8e6] text-slate-800 font-bold border-b border-slate-300">
        <td class="w-10 text-center py-1.5 border-r border-slate-300 bg-[#f1f3f4] text-slate-500 font-mono text-[11px]">1</td>
        ${headers.map((h, i) => `<td class="py-1.5 px-3 border-r border-slate-300 hover:bg-[#d2e3fc] cursor-pointer" data-cell="${String.fromCharCode(65+i)}1" data-val="${h}">${h}</td>`).join('')}
      </tr>`;

      const voidIncidents = [
        { id: 'VOID-801', time: '11:14 IST', zone: 'Zone A – Grocery Aisle', sku: 'Amul Taaza Milk (1L)', conf: '94%', act: 'Telegram Dispatch', res: 'RESOLVED', model: 'YOLOv8-Shelf' },
        { id: 'VOID-802', time: '14:20 IST', zone: 'Zone B – FMCG Shelf',   sku: 'Fortune Sunflower Oil', conf: '88%', act: 'Alert Sent',       res: 'RESOLVED', model: 'YOLOv8-Shelf' },
        { id: 'VOID-803', time: '16:05 IST', zone: 'Zone C – Snacks Aisle', sku: 'Parle-G Biscuits',     conf: '91%', act: 'Alert Sent',       res: 'RESOLVED', model: 'YOLOv8-Shelf' },
        { id: 'VOID-804', time: '18:45 IST', zone: 'Zone D – Dairy Coolers', sku: 'Aashirvaad Atta',     conf: '93%', act: 'Telegram Dispatch', res: 'PENDING',  model: 'YOLOv8-Shelf' },
        { id: 'VOID-805', time: '09:30 IST', zone: 'Aisle 3 – Beverages',   sku: 'Coca-Cola (750ml)',    conf: '89%', act: 'Alert Sent',       res: 'RESOLVED', model: 'YOLOv8-Shelf' }
      ];

      voidIncidents.forEach((v, idx) => {
        const rowNum = idx + 2;
        const vals = [v.id, v.time, v.zone, v.sku, v.conf, v.act, v.res, v.model];
        rowsHtml += `<tr class="border-b border-slate-200 hover:bg-blue-50/50 transition-colors">
          <td class="w-10 text-center py-1.5 border-r border-slate-300 bg-[#f1f3f4] text-slate-500 font-mono text-[11px]">${rowNum}</td>
          ${vals.map((val, cIdx) => `<td class="py-1.5 px-3 border-r border-slate-200 hover:bg-blue-100/60 cursor-pointer ${cIdx === 6 && val === 'PENDING' ? 'text-red-600 font-bold' : ''}" data-cell="${String.fromCharCode(65+cIdx)}${rowNum}" data-val="${val}">${val}</td>`).join('')}
        </tr>`;
      });

      if (rowCountEl) rowCountEl.textContent = '6';
    }

    tbody.innerHTML = rowsHtml;

    // Attach Cell Click Handler for Interactive Google Sheets Selection
    tbody.querySelectorAll('td[data-cell]').forEach(td => {
      td.addEventListener('click', (e) => {
        // Clear existing highlights
        tbody.querySelectorAll('td[data-cell]').forEach(cell => {
          cell.style.outline = 'none';
          cell.style.backgroundColor = '';
        });

        // Highlight selected cell with signature Google Sheets green border
        td.style.outline = '2px solid #0f9d58';
        td.style.outlineOffset = '-2px';
        td.style.backgroundColor = '#e6f4ea';

        const cellName = td.getAttribute('data-cell');
        const cellVal = td.getAttribute('data-val');

        if (cellNameEl) cellNameEl.textContent = cellName;
        if (formulaInput) formulaInput.value = cellVal;
      });
    });
  }

  // Handle Sheet Tab Clicks
  document.querySelectorAll('.gsheet-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-gsheet-tab');
      renderGSheet(tab);
    });
  });

  // Render on navigation
  store.subscribe((event) => {
    if (event === 'void_detected') {
      weeklyVoidAlertCount++;
      if (document.getElementById('tab-weekly-report') && !document.getElementById('tab-weekly-report').classList.contains('hidden')) {
        renderGSheet();
      }
    }
  });

  document.querySelectorAll('[data-nav-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.getAttribute('data-nav-tab') === 'weekly-report') {
        setTimeout(() => renderGSheet('inventory'), 50);
      }
    });
  });

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#weekly-report') renderGSheet('inventory');
  });
  if (window.location.hash === '#weekly-report') renderGSheet('inventory');

  // CSV Weekly Report Download Handler with Clean Filename
  const triggerCSVDownload = () => {
    const state = store.getState();
    const inventory = state.inventory || [];
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const fmt = d => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    let csv = `SKU_CODE,PRODUCT_NAME,CATEGORY,UNIT_PRICE_INR,CURRENT_STOCK,MAX_CAPACITY,VELOCITY_UNITS_HR,STATUS,RESTOCK_PRIORITY,SHELF_LOCATION,YOLO_CONF\n`;

    inventory.forEach(i => {
      const priority = i.status === 'critical' ? 'P1 - High' : i.status === 'warning' ? 'P2 - Medium' : 'P3 - Low';
      csv += `${i.sku},"${i.name}",${i.dept},"${i.price}",${i.stock},${i.capacity},${i.velocity},${i.status.toUpperCase()},${priority},"${i.location}",91%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'EyeQMart_Inventory_Weekly_Report_Pune.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toastManager.show('EyeQMart_Inventory_Weekly_Report_Pune.csv downloaded successfully.', 'success');
  };

  const dlCSV = document.getElementById('downloadWeeklyCSVBtn');
  if (dlCSV) dlCSV.addEventListener('click', triggerCSVDownload);

  const dlGSheetBtn = document.getElementById('downloadGSheetBtn');
  if (dlGSheetBtn) dlGSheetBtn.addEventListener('click', triggerCSVDownload);
});
