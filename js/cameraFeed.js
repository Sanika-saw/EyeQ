/**
 * EyeQ Retail Intelligence - Camera Feed & Neural Overlay Engine (Focused & Quad Grid)
 * Video playback with AI bounding boxes and synchronized live camera feeds.
 */
import { store } from './state.js';

export class CameraFeedManager {
  constructor(toastManager) {
    this.toastManager = toastManager;
    this.viewportEl = document.getElementById('cameraViewport');
    this.feedVideo = document.getElementById('cameraVideo');
    this.osdCamTitle = document.getElementById('osdCamTitle');
    this.camHeaderTitle = document.getElementById('camHeaderTitle');
    this.camSelector = document.getElementById('camSelector');
    this.ptzLabel = document.getElementById('ptzLabel');
    this.boundingContainer = document.getElementById('boundingContainer');
    this.neuralToggleBtn = document.getElementById('neuralToggleBtn');
    this.fullscreenBtn = document.getElementById('fullscreenBtn');
    this.syncBtn = document.getElementById('syncBtn');
    this.stepBackBtn = document.getElementById('stepBackBtn');
    this.audioBtn = document.getElementById('audioBtn');
    this.activeTargetsBadge = document.getElementById('activeTargetsBadge');
    this.snapshotBtn = document.getElementById('snapshotBtn');

    // Quad Grid Elements
    this.singleViewContainer = document.getElementById('singleCameraContainer');
    this.quadViewContainer = document.getElementById('quadCameraContainer');
    this.viewModeSingleBtn = document.getElementById('viewModeSingle');
    this.viewModeQuadBtn = document.getElementById('viewModeQuad');

    this.animationFrameId = null;
    
    this.init();
  }

  init() {
    this.renderActiveCamera();
    this.setupListeners();
    this.startBoundingBoxAnimation();
    
    // Subscribe to state changes
    store.subscribe((event) => {
      if (event === 'camera_changed' || event === 'neural_toggle' || event === 'audio_toggle') {
        this.renderActiveCamera();
      } else if (event === 'camera_view_mode_changed') {
        this.renderViewMode();
      }
    });
  }

  setupListeners() {
    // Dropdown selector
    if (this.camSelector) {
      this.camSelector.addEventListener('change', (e) => {
        store.setActiveCamera(e.target.value);
      });
    }

    // Thumbnail cards
    const thumbCards = document.querySelectorAll('[data-cam-card]');
    thumbCards.forEach(card => {
      card.addEventListener('click', () => {
        const camId = card.getAttribute('data-cam-card');
        store.setActiveCamera(camId);
      });
    });

    // Neural Overlay toggle button
    if (this.neuralToggleBtn) {
      this.neuralToggleBtn.addEventListener('click', () => {
        store.toggleNeuralOverlay();
        const enabled = store.getState().neuralOverlayEnabled;
        if (this.toastManager) {
          this.toastManager.show(enabled ? 'AI Neural Vision Overlay Enabled' : 'Neural Overlay Hidden', 'info');
        }
      });
    }

    // Fullscreen button
    if (this.fullscreenBtn && this.viewportEl) {
      this.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          this.viewportEl.requestFullscreen().catch(err => console.log(err));
        } else {
          document.exitFullscreen();
        }
      });
    }

    // Snapshot button
    if (this.snapshotBtn) {
      this.snapshotBtn.addEventListener('click', () => {
        const state = store.getState();
        const cam = state.cameras[state.activeCameraId];
        if (this.toastManager) {
          this.toastManager.show(`High-res surveillance snapshot captured for ${cam.id.toUpperCase()} [${cam.shortName}] with OSD telemetry.`, 'success');
        }
      });
    }

    // View Mode buttons (Single vs Quad)
    if (this.viewModeSingleBtn) {
      this.viewModeSingleBtn.addEventListener('click', () => {
        store.setCameraViewMode('single');
      });
    }

    if (this.viewModeQuadBtn) {
      this.viewModeQuadBtn.addEventListener('click', () => {
        store.setCameraViewMode('quad');
      });
    }

    // Quad tile click to focus
    document.querySelectorAll('[data-quad-cam]').forEach(tile => {
      tile.addEventListener('click', () => {
        const camId = tile.getAttribute('data-quad-cam');
        store.setActiveCamera(camId);
        store.setCameraViewMode('single');
        if (this.toastManager) {
          this.toastManager.show(`Focused on ${camId.toUpperCase()}`, 'info');
        }
      });
    });

    // Live Sync
    if (this.syncBtn) {
      this.syncBtn.addEventListener('click', () => {
        this.flashSync();
      });
    }

    // Step Back 10s
    if (this.stepBackBtn) {
      this.stepBackBtn.addEventListener('click', () => {
        this.simulatePlaybackStepBack();
      });
    }

    // Audio toggle
    if (this.audioBtn) {
      this.audioBtn.addEventListener('click', () => {
        store.toggleAudio();
        const audio = store.getState().audioEnabled;
        if (this.feedVideo) {
          this.feedVideo.muted = !audio;
        }
        if (this.toastManager) {
          this.toastManager.show(audio ? 'Surveillance Audio Channel Unmuted' : 'Audio Feed Muted', 'info');
        }
      });
    }
  }

  renderViewMode() {
    const state = store.getState();
    const isQuad = state.cameraViewMode === 'quad';

    if (this.singleViewContainer && this.quadViewContainer) {
      if (isQuad) {
        this.singleViewContainer.classList.add('hidden');
        this.quadViewContainer.classList.remove('hidden');
        if (this.viewModeQuadBtn && this.viewModeSingleBtn) {
          this.viewModeQuadBtn.className = 'btn-glass-primary px-3 py-1.5 rounded-lg font-label-md font-bold text-xs shadow-md';
          this.viewModeSingleBtn.className = 'btn-glass-secondary px-3 py-1.5 rounded-lg font-label-md font-semibold text-xs';
        }
        // Ensure quad videos are playing
        this.quadViewContainer.querySelectorAll('video').forEach(v => {
          v.play().catch(e => console.log('Quad autoplay handled:', e));
        });
      } else {
        this.singleViewContainer.classList.remove('hidden');
        this.quadViewContainer.classList.add('hidden');
        if (this.viewModeQuadBtn && this.viewModeSingleBtn) {
          this.viewModeSingleBtn.className = 'btn-glass-primary px-3 py-1.5 rounded-lg font-label-md font-bold text-xs shadow-md';
          this.viewModeQuadBtn.className = 'btn-glass-secondary px-3 py-1.5 rounded-lg font-label-md font-semibold text-xs';
        }
        // Ensure single video is playing
        if (this.feedVideo) {
          this.feedVideo.play().catch(e => console.log('Single autoplay handled:', e));
        }
      }
    }
  }

  renderActiveCamera() {
    const state = store.getState();
    const cam = state.cameras[state.activeCameraId];
    if (!cam) return;

    // Update Video Feed Source
    const feedVideo = document.getElementById('cameraVideo');
    const feedImage = document.getElementById('cameraImage');
    
    if (feedVideo && feedImage) {
      const ext = cam.video.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
      const activeSrc = feedVideo.getAttribute('data-active-src') || feedImage.getAttribute('data-active-src') || '';

      if (isImage) {
        // Show image feed
        feedVideo.classList.add('hidden');
        feedImage.classList.remove('hidden');
        if (activeSrc !== cam.video) {
          feedImage.setAttribute('data-active-src', cam.video);
          feedVideo.setAttribute('data-active-src', ''); // reset video tracker
          feedImage.style.opacity = '0.5';
          feedImage.src = cam.video;
          feedImage.onload = () => { feedImage.style.opacity = '1'; };
          feedVideo.pause();
        }
      } else {
        // Show video feed
        feedImage.classList.add('hidden');
        feedVideo.classList.remove('hidden');
        if (activeSrc !== cam.video) {
          feedVideo.setAttribute('data-active-src', cam.video);
          feedImage.setAttribute('data-active-src', ''); // reset image tracker
          feedVideo.style.opacity = '0.4';
          feedVideo.src = cam.video;
          feedVideo.loop = true;
          feedVideo.muted = !state.audioEnabled;
          feedVideo.load();
          feedVideo.play().then(() => {
            feedVideo.style.opacity = '1';
          }).catch(() => {
            feedVideo.style.opacity = '1';
          });
        } else {
          // Same src but ensure it's playing (e.g. after switching back)
          if (feedVideo.paused) {
            feedVideo.play().catch(() => {});
          }
        }
      }
    }

    // Update Headers & OSD
    if (this.osdCamTitle) {
      this.osdCamTitle.textContent = `${cam.id.toUpperCase()} [FOV: ${cam.fov}]`;
    }

    if (this.camHeaderTitle) {
      this.camHeaderTitle.textContent = `Live Screening — ${cam.shortName} (${cam.id.toUpperCase()})`;
    }

    if (this.camSelector) {
      this.camSelector.value = cam.id;
    }

    if (this.ptzLabel) {
      this.ptzLabel.textContent = `PTZ: ${cam.ptz}`;
    }

    if (this.activeTargetsBadge) {
      const isVoidCam = cam.id === 'cam-02';
      const labelText = isVoidCam ? 'Void Spaces' : 'Targets';
      const dotColor = isVoidCam ? 'bg-red-400' : 'bg-on-tertiary-container';
      this.activeTargetsBadge.innerHTML = state.neuralOverlayEnabled 
        ? `<span class="w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse"></span> AI Vision Overlay: Active (${cam.targetsCount} ${labelText})` 
        : `AI Vision Overlay: Paused`;
    }

    // Update thumbnail highlights
    document.querySelectorAll('[data-cam-card]').forEach(card => {
      const isSelected = card.getAttribute('data-cam-card') === cam.id;
      if (isSelected) {
        card.className = 'cursor-pointer p-1.5 rounded-lg bg-surface-container-high ring-1 ring-primary transition-all shadow-sm';
      } else {
        card.className = 'cursor-pointer p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all';
      }
    });

    // Update Neural Overlay Toggle Button Style
    if (this.neuralToggleBtn) {
      if (state.neuralOverlayEnabled) {
        this.neuralToggleBtn.className = 'p-1.5 rounded-lg bg-primary text-surface hover:opacity-90 transition-colors';
      } else {
        this.neuralToggleBtn.className = 'p-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors';
      }
    }

    // Update Audio Toggle Button Style
    if (this.audioBtn) {
      const icon = this.audioBtn.querySelector('span');
      if (icon) {
        icon.textContent = state.audioEnabled ? 'volume_up' : 'volume_off';
      }
    }

    // Render Bounding Boxes
    this.renderBoundingBoxes(cam, state.neuralOverlayEnabled);
  }

  renderBoundingBoxes(cam, enabled) {
    if (!this.boundingContainer) return;

    if (!enabled) {
      this.boundingContainer.innerHTML = '';
      return;
    }

    // Store base positions for animation
    this._boxBases = cam.targets.map(t => ({ top: t.top, left: t.left, width: t.width, height: t.height }));

    this.boundingContainer.innerHTML = cam.targets.map((t, i) => {
      const isVoid = t.isVoid || t.color === 'red';
      const isWarning = t.color === 'amber';
      
      let borderStyle = isVoid
        ? 'border-2 border-red-500 ring-2 ring-red-500/40 bg-red-500/5 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
        : isWarning
          ? 'border-2 border-amber-400 ring-1 ring-amber-400/40'
          : 'border-2 border-emerald-400 ring-1 ring-emerald-400/30';

      const dotColor = isVoid ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400';

      return `
        <div class="absolute rounded-sm pointer-events-none ${borderStyle}"
             data-target-id="${t.id}"
             data-box-index="${i}"
             style="top:${t.top}%;left:${t.left}%;width:${t.width}%;height:${t.height}%;will-change:transform;">
          <div class="absolute bottom-0 right-0 w-2 h-2 ${dotColor} opacity-80"></div>
        </div>
      `;
    }).join('');
  }

  startBoundingBoxAnimation() {
    let tick = 0;
    const animate = () => {
      tick += 0.018;
      const elements = this.boundingContainer ? this.boundingContainer.querySelectorAll('[data-target-id]') : [];
      elements.forEach((el, index) => {
        const dx = Math.sin(tick * 0.7 + index * 1.3) * 0.8;
        const dy = Math.cos(tick * 0.5 + index * 2.1) * 0.6;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  flashSync() {
    if (this.feedVideo) {
      if (this.feedVideo.duration) {
        this.feedVideo.currentTime = Math.max(0, this.feedVideo.duration - 0.5);
      }
      this.feedVideo.play().catch(e => console.log(e));
    }
    const syncPill = document.getElementById('syncPill');
    if (syncPill) {
      syncPill.classList.add('bg-on-tertiary-container', 'text-surface');
      setTimeout(() => {
        syncPill.classList.remove('bg-on-tertiary-container', 'text-surface');
      }, 500);
      if (this.toastManager) {
        this.toastManager.show('Feed synchronized to live edge broadcast.', 'info');
      }
    }
  }

  simulatePlaybackStepBack() {
    if (this.feedVideo) {
      this.feedVideo.currentTime = Math.max(0, this.feedVideo.currentTime - 10);
      this.feedVideo.style.filter = 'sepia(0.3) contrast(1.1)';
      setTimeout(() => {
        this.feedVideo.style.filter = 'none';
      }, 400);
    }
    if (this.toastManager) {
      this.toastManager.show('Rewound buffer by 10 seconds.', 'info');
    }
  }
}
