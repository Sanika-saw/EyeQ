/**
 * EyeQ Retail Intelligence - Reactive State Store
 * Store: EyeQMart — Pune Flagship #104, Pune
 */

class StoreState {
  constructor() {
    this.state = {
      storeName: 'EyeQMart',
      storeLocation: 'Pune Flagship #104, Pune',
      storeDirector: 'Atharva',
      occupancy: 26,
      safeCapacity: 210,
      footfall: 68,
      avgWaitSeconds: 165, // 2m 45s
      fleetOnline: 12,
      fleetTotal: 12,
      latency: 24,
      
      aiServerUrl: 'http://127.0.0.1:5000',
      aiConnected: false,
      aiLiveFootfall: null,
      
      activeCameraId: 'cam-01',
      cameraViewMode: 'single', // 'single' or 'quad'
      neuralOverlayEnabled: true,
      audioEnabled: false,
      isFullscreen: false,

      telegramBot: {
        enabled: true,
        botToken: '',
        chatId: '',
        autoSendOnVoid: true,
        autoSendOnRestock: true
      },

      cameras: {
        'cam-01': {
          id: 'cam-01',
          name: 'CAM-01: Main Sales Floor & Entry',
          shortName: 'Main Sales Floor',
          fov: '98° S-E',
          flowText: '82 Active',
          ptz: 'X:114 Y:042 Z:1.0X',
          targetsCount: 8,
          video: 'assets/cctv/realcctv.mp4',
          targets: [
            { id: 'TRK-001', top: 28, left: 34, width: 9, height: 32, label: 'Aisle 3 Bay', dwell: '1.8m', color: 'emerald' },
            { id: 'TRK-002', top: 38, left: 58, width: 10, height: 34, label: 'Aisle 2 Bay', dwell: '2.4m', color: 'emerald' },
            { id: 'TRK-003', top: 22, left: 76, width: 8, height: 30, label: 'Endcap Zone', dwell: '8.4m', color: 'amber' }
          ]
        },
        'cam-02': {
          id: 'cam-02',
          name: 'CAM-02: Fresh Produce & Grocery Aisles',
          shortName: 'Fresh Produce & Grocery',
          fov: '105° E-W',
          flowText: '3 Voids Detected',
          ptz: 'X:180 Y:065 Z:1.4X',
          targetsCount: 3,
          video: 'assets/cctv/voidvdo.mp4',
          targets: [
            { id: 'VOID #1', top: 25, left: 18, width: 22, height: 26, label: 'Aisle 3 · Upper Rack', dwell: '94% Conf', isVoid: true, color: 'red' },
            { id: 'VOID #2', top: 48, left: 52, width: 26, height: 28, label: 'Aisle 2 · Middle Shelf', dwell: '88% Conf', isVoid: true, color: 'red' },
            { id: 'VOID #3', top: 62, left: 24, width: 20, height: 24, label: 'Aisle 1 · Beverage Bay', dwell: '91% Conf', isVoid: true, color: 'red' }
          ]
        },
      },

      counters: {
        c1: { id: 'c1', name: 'Counter 01 (Cash/Card/UPI)', staff: 'Rohan M.', count: 3, wait: '1m 50s', waitSec: 110, status: 'active' },
        c2: { id: 'c2', name: 'Counter 02 (Card & UPI Only)', staff: 'Neha K.', count: 2, wait: '1m 20s', waitSec: 80, status: 'active' },
        c3: { id: 'c3', name: 'Counter 03 (Speed Lane)', staff: 'Amit P. (Price Check)', count: 6, wait: '4m 10s', waitSec: 250, status: 'congested' },
        c4: { id: 'c4', name: 'Counter 04 (Express Counter)', staff: 'Status: Standby (Auto-Dispatch)', count: 0, wait: '--', waitSec: 0, status: 'standby' },
        self: { id: 'self', name: 'Self-Checkout (8 Kiosks)', staff: '7/8 In Use · Host: Priya S. (UPI Soundbox Active)', count: 8, wait: '1m 05s', waitSec: 65, status: 'active' }
      },

      alerts: [
        {
          id: 'alert-1',
          type: 'critical',
          title: 'Congestion Spike: Billing Counter 3',
          time: '2m ago',
          desc: 'Queue exceeded SLA limit (4m 10s vs 2m target). Shoppers waiting for barcode check on Aashirvaad Atta.',
          icon: 'warning',
          canResolveByCounter4: true
        },
        {
          id: 'alert-2',
          type: 'warning',
          title: 'Shelf Restock Required: Aisle 3',
          time: '14m ago',
          desc: 'Aisle 3 Coolers: Amul Taaza Toned Milk (1L) depleted below 10% (8 units remaining).',
          icon: 'inventory',
          hasAction: true,
          actionText: 'Acknowledge & Dispatch'
        },
        {
          id: 'alert-3',
          type: 'info',
          title: 'High Dwell Warning: Aisle 3',
          time: '28m ago',
          desc: 'Customer cluster stationary for >8m around Haldiram & Confectionery endcap.',
          icon: 'person_pin_circle',
          canInspect: true
        }
      ],

      zones: {
        zoneA: { id: 'zoneA', name: 'Zone A: Entrance Turnstiles', dwell: '1.8 min', metric: 'Pass-through: 88%', status: 'Fluid', percent: 25, cam: 'cam-01' },
        zoneB: { id: 'zoneB', name: 'Zone B: Produce & Staples', dwell: '3.2 min', metric: 'Active Shoppers: 34', status: 'Normal', percent: 45, cam: 'cam-02' },
        zoneC: { id: 'zoneC', name: 'Zone C: Dairy & Confectionery', dwell: '8.4 min', metric: 'Restock: Amul Taaza Display', status: 'High Dwell', percent: 84, cam: 'cam-01' },
        zoneD: { id: 'zoneD', name: 'Zone D: Billing Counters', dwell: '4.8 min', metric: 'Shoppers Queued: 19', status: 'Moderate', percent: 62, cam: 'cam-02' }
      },

      inventory: [
        { sku: 'SKU-AML-01', name: 'Amul Taaza Toned Milk (1L)', location: 'Aisle 3 · Endcap Coolers', dept: 'Dairy', price: '₹54', stock: 8, capacity: 80, reorder: 15, velocity: '14 units/hr', status: 'critical' },
        { sku: 'SKU-ASH-02', name: 'Aashirvaad Shudh Chakki Atta (10kg)', location: 'Aisle 2 · Grain Stacks', dept: 'Staples', price: '₹445', stock: 14, capacity: 60, reorder: 15, velocity: '8 units/hr', status: 'warning' },
        { sku: 'SKU-TAT-03', name: 'Tata Sampann Toor Dal (1kg)', location: 'Aisle 2 · Pulses Rack', dept: 'Staples', price: '₹175', stock: 28, capacity: 50, reorder: 10, velocity: '6 units/hr', status: 'optimal' },
        { sku: 'SKU-FRT-04', name: 'Fortune Sunlite Sunflower Oil (1L)', location: 'Aisle 1 · Edible Oils', dept: 'Staples', price: '₹138', stock: 18, capacity: 70, reorder: 20, velocity: '10 units/hr', status: 'warning' },
        { sku: 'SKU-CAD-05', name: 'Cadbury Dairy Milk Silk (150g)', location: 'Aisle 3 · Confectionery Endcap', dept: 'Snacks', price: '₹175', stock: 12, capacity: 60, reorder: 20, velocity: '11 units/hr', status: 'warning' },
        { sku: 'SKU-PAR-06', name: 'Parle-G Gold Biscuits (1kg Family Pack)', location: 'Aisle 3 · Biscuits Rack', dept: 'Snacks', price: '₹120', stock: 45, capacity: 80, reorder: 20, velocity: '16 units/hr', status: 'optimal' },
        { sku: 'SKU-ING-07', name: 'India Gate Feast Basmati Rice (5kg)', location: 'Aisle 2 · Rice Island', dept: 'Staples', price: '₹480', stock: 32, capacity: 50, reorder: 15, velocity: '7 units/hr', status: 'optimal' },
        { sku: 'SKU-EVR-08', name: 'Everest Super Garam Masala (100g)', location: 'Aisle 2 · Spices Section', dept: 'Masalas', price: '₹92', stock: 64, capacity: 100, reorder: 25, velocity: '12 units/hr', status: 'optimal' },
        { sku: 'SKU-TTS-09', name: 'Tata Salt Vacuum Iodized (1kg)', location: 'Aisle 2 · Salt & Condiments', dept: 'Staples', price: '₹28', stock: 55, capacity: 90, reorder: 20, velocity: '18 units/hr', status: 'optimal' },
        { sku: 'SKU-HLD-10', name: 'Haldiram Nagpur Bhujia Sev (400g)', location: 'Aisle 3 · Savouries Endcap', dept: 'Snacks', price: '₹115', stock: 22, capacity: 50, reorder: 15, velocity: '9 units/hr', status: 'optimal' },
        { sku: 'SKU-SRF-11', name: 'Surf Excel Matic Liquid Detergent (2L)', location: 'Aisle 4 · Home Care', dept: 'Home Care', price: '₹410', stock: 16, capacity: 40, reorder: 12, velocity: '5 units/hr', status: 'warning' },
        { sku: 'SKU-WAG-12', name: 'Wagh Bakri Premium CTC Tea (1kg)', location: 'Aisle 1 · Hot Beverages', dept: 'Beverages', price: '₹460', stock: 26, capacity: 45, reorder: 12, velocity: '8 units/hr', status: 'optimal' }
      ],

      fleetNodes: [
        { id: 'NODE-01', location: 'Foyer Turnstiles & Gate', ip: '192.168.4.101', latency: '18ms', fps: '30.0', status: 'healthy' },
        { id: 'NODE-02', location: 'Produce & Fruits Section', ip: '192.168.4.102', latency: '22ms', fps: '29.9', status: 'healthy' },
        { id: 'NODE-03', location: 'POS Billing Counters 1-4', ip: '192.168.4.103', latency: '25ms', fps: '30.0', status: 'healthy' },
        { id: 'NODE-04', location: 'Main Sales Floor West', ip: '192.168.4.104', latency: '24ms', fps: '30.0', status: 'healthy' },
        { id: 'NODE-05', location: 'Dairy Coolers & Staples', ip: '192.168.4.105', latency: '21ms', fps: '30.0', status: 'healthy' },
        { id: 'NODE-06', location: 'Confectionery & Spices', ip: '192.168.4.106', latency: '26ms', fps: '29.8', status: 'healthy' }
      ],

      voidDetection: {
        active: false,
        lastDetected: null,
        simulatedIndex: 0,
        images: [
          {
            id: 'void-full',
            src: 'assets/void full.png',
            title: 'juices/coolers',
            voids: [
              { label: 'Void 0.44', confidence: '0.44', location: 'Top Right Rack', sku: 'Dove Hair Care' },
              { label: 'Void 0.56', confidence: '0.56', location: 'Bottom Left Rack', sku: 'Dove Bar Soap' },
              { label: 'Void 0.69', confidence: '0.69', location: 'Bottom Center Rack', sku: 'Olay Moisturizer' }
            ]
          },
          {
            id: 'void-1',
            src: 'assets/void 1.jpeg',
            title: 'detergents/cleaners',
            voids: [
              { label: 'Void 0.78', confidence: '0.78', location: 'Middle Shelf Void', sku: 'Nivea Body Lotion' }
            ]
          },
          {
            id: 'void-2',
            src: 'assets/void 2.png',
            title: 'shampoo/personal care',
            voids: [
              { label: 'Void 0.85', confidence: '0.85', location: 'Lower Rack Void', sku: 'Tetley Green Tea' }
            ]
          },
          {
            id: 'void-3',
            src: 'assets/void 3.jpeg',
            title: 'Packaged Snacks & Biscuits Shelf (Aisle 3)',
            voids: [
              { label: 'Void 0.82', confidence: '0.82', location: 'Upper Display Rack', sku: 'Parle-G Gold Biscuits' }
            ]
          },
          {
            id: 'void-4',
            src: 'assets/void 4.jpeg',
            title: 'Dairy & Milk Coolers (Aisle 3 Bay)',
            voids: [
              { label: 'Void 0.94', confidence: '0.94', location: 'Endcap Cooler Bay', sku: 'Amul Taaza Toned Milk' }
            ]
          },
          {
            id: 'void-5',
            src: 'assets/void 5.jpeg',
            title: 'Personal Care & Hygiene Rack (Aisle 2)',
            voids: [
              { label: 'Void 0.88', confidence: '0.88', location: 'Middle Shelf Rack', sku: 'Nivea Body Lotion' }
            ]
          }
        ]
      },

      selectedZone: null,
      counter4Activated: false
    };

    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify(event, data) {
    this.listeners.forEach(fn => fn(event, data, this.state));
  }

  getState() {
    return this.state;
  }

  // --- Actions ---

  triggerVoidDetection() {
    const vd = this.state.voidDetection;
    const currentImg = vd.images[vd.simulatedIndex];
    vd.simulatedIndex = (vd.simulatedIndex + 1) % vd.images.length;
    vd.active = true;
    vd.lastDetected = currentImg;

    const newAlert = {
      id: `alert-void-${Date.now()}`,
      type: 'critical',
      title: `Void Shelf Out-of-Stock Detected: ${currentImg.title}`,
      time: 'Just now',
      desc: `YOLOv8 Shelf Vision detected ${currentImg.voids.length} empty product voids (${currentImg.voids.map(v => `${v.sku} - ${v.label}`).join(', ')}). Immediate shelf restocking dispatch recommended.`,
      icon: 'grid_view',
      isVoidAlert: true,
      voidData: currentImg
    };

    // Prepend to active alerts
    this.state.alerts.unshift(newAlert);
    this.notify('void_detected', newAlert);
    return newAlert;
  }

  async triggerRealAiVoidDetection(imageKey = 'void-1') {
    try {
      const resp = await fetch(`${this.state.aiServerUrl}/api/shelf/analyze?image_key=${imageKey}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      this.state.aiConnected = true;
      const vd = this.state.voidDetection;
      vd.active = true;

      const titleMap = {
        'void-full': 'juices/coolers',
        'void-1': 'detergents/cleaners',
        'void-2': 'shampoo/personal care',
        'void-3': 'Packaged Snacks & Biscuits Shelf (Aisle 3)',
        'void-4': 'Dairy & Milk Coolers (Aisle 3 Bay)',
        'void-5': 'Personal Care & Hygiene Rack (Aisle 2)'
      };
      const displayTitle = titleMap[imageKey] || `Store Shelf Scan (${data.filename})`;

      const realVoidData = {
        id: imageKey,
        src: data.annotated_image, // Base64 image with bounding boxes drawn by best.pt
        title: displayTitle,
        voids: data.voids,
        isRealAi: true,
        modelVersion: data.model_version
      };

      const newAlert = {
        id: `alert-void-real-${Date.now()}`,
        type: 'critical',
        title: `PyTorch YOLO best.pt Detection: ${displayTitle}`,
        time: 'Just now',
        desc: `AI Model (best.pt) processed live frame and identified ${data.void_count} empty product voids. Annotated bounding boxes generated in real-time.`,
        icon: 'center_focus_strong',
        isVoidAlert: true,
        voidData: realVoidData
      };

      this.state.alerts.unshift(newAlert);
      this.notify('void_detected', newAlert);
      return newAlert;
    } catch (err) {
      console.warn('[EyeQ AI] Microservice offline or fallback triggered:', err.message);
      this.state.aiConnected = false;
      return this.triggerVoidDetection();
    }
  }

  async fetchAiFootfall() {
    try {
      const resp = await fetch(`${this.state.aiServerUrl}/api/footfall/status`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      this.state.aiConnected = true;
      this.state.aiLiveFootfall = data;

      if (typeof data.in_premise === 'number') {
        this.state.occupancy = Math.max(20, Math.min(30, data.in_premise));
      }
      if (typeof data.cumulative_footfall === 'number') {
        // Clamp footfall to realistic 50-80 max range
        let f = data.cumulative_footfall;
        if (f > 80) f = 50 + (f % 30);
        this.state.footfall = Math.max(50, Math.min(80, f));
      }

      this.notify('telemetry_tick', {
        occupancy: this.state.occupancy,
        footfall: this.state.footfall,
        latency: this.state.latency,
        aiFootfall: data
      });
      return data;
    } catch (err) {
      this.state.aiConnected = false;
      return null;
    }
  }

  resolveVoidAlert(alertId) {
    this.state.alerts = this.state.alerts.filter(a => a.id !== alertId);
    if (!this.state.alerts.some(a => a.isVoidAlert)) {
      this.state.voidDetection.active = false;
    }
    this.notify('void_resolved', alertId);
  }

  setActiveCamera(camId) {
    if (this.state.cameras[camId]) {
      this.state.activeCameraId = camId;
      this.notify('camera_changed', camId);
    }
  }

  setCameraViewMode(mode) {
    this.state.cameraViewMode = mode;
    this.notify('camera_view_mode_changed', mode);
  }

  toggleNeuralOverlay() {
    this.state.neuralOverlayEnabled = !this.state.neuralOverlayEnabled;
    this.notify('neural_toggle', this.state.neuralOverlayEnabled);
  }

  toggleAudio() {
    this.state.audioEnabled = !this.state.audioEnabled;
    this.notify('audio_toggle', this.state.audioEnabled);
  }

  activateCounter4() {
    if (this.state.counter4Activated) return;

    this.state.counter4Activated = true;
    
    // Rebalance queues: move 3 shoppers from counter 3 to counter 4
    this.state.counters.c4.status = 'active';
    this.state.counters.c4.staff = 'Staff: Pooja R. (Express Counter Active)';
    this.state.counters.c4.count = 3;
    this.state.counters.c4.wait = '1m 15s';
    this.state.counters.c4.waitSec = 75;

    this.state.counters.c3.status = 'active'; // no longer congested!
    this.state.counters.c3.count = 3;
    this.state.counters.c3.wait = '2m 05s';
    this.state.counters.c3.waitSec = 125;

    // Recalculate average wait time
    this.state.avgWaitSeconds = 115; // 1m 55s -> under 2m target!

    // Auto-resolve Counter 3 alert
    this.state.alerts = this.state.alerts.filter(a => a.id !== 'alert-1');

    this.notify('counter4_activated', null);
  }

  dismissAlert(alertId) {
    const alert = this.state.alerts.find(a => a.id === alertId);
    this.state.alerts = this.state.alerts.filter(a => a.id !== alertId);
    this.notify('alert_dismissed', alert);
  }

  selectZone(zoneKey) {
    if (this.state.selectedZone === zoneKey) {
      this.state.selectedZone = null;
    } else {
      this.state.selectedZone = zoneKey;
      const zone = this.state.zones[zoneKey];
      if (zone && zone.cam) {
        this.setActiveCamera(zone.cam);
      }
    }
    this.notify('zone_selected', this.state.selectedZone);
  }

  tickTelemetry() {
    // Slow realistic drift: ±1 per tick (~3.5s), clamped 20-30
    const delta = (Math.random() > 0.50 ? 1 : -1) * (Math.random() > 0.4 ? 1 : 0);
    this.state.occupancy = Math.max(20, Math.min(30, this.state.occupancy + delta));
    
    // Footfall grows slowly; max ~80 per day (one tick every 3.5s ≈ ~1 per 14s realistic)
    if (Math.random() > 0.78 && this.state.footfall < 80) {
      this.state.footfall += 1;
    }

    this.state.latency = Math.floor(23 + Math.random() * 3);

    this.notify('telemetry_tick', {
      occupancy: this.state.occupancy,
      footfall: this.state.footfall,
      latency: this.state.latency
    });
  }
}

export const store = new StoreState();
