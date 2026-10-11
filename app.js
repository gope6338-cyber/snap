/**
 * Nook — Moments Diary & Memory Journal
 * Progressive Web App Engine v1.5
 * 
 * Features:
 * - IndexedDB Unlimited Media & Storage Engine (NookDB)
 * - Dual-Camera Capture (Main + Selfie PiP) with interactive PiP swap
 * - Creative Studio: Freehand Doodling Pen, Draggable Emoji Stickers
 * - Voice Memos: MediaRecorder with audio waveform visualizer
 * - 35mm Film Grain & Vignette Analog Sliders
 * - Web Audio API physical camera shutter sound
 * - Floating emoji reaction physics
 * - Memories Calendar & Locket Widget Simulator
 */

// Initial Sample Moments for a rich first-load impression
const DEFAULT_SAMPLE_MOMENTS = [
  {
    id: 'moment_1',
    author: {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      handle: '@elena'
    },
    photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    pipPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    filter: 'warm',
    mood: '🌅 Golden Hour',
    location: '📍 Pacific Palisades, CA',
    privacy: 'friends',
    favorite: true,
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    note: "Caught the horizon slipping into deep lavender and honey gold. No noise, just the tide breathing. Reminded myself that everything is unfolding right on time.",
    voiceNote: {
      duration: '0:18',
      simulated: true
    },
    reactions: {
      '❤️': 14,
      '🔥': 7,
      '🥹': 5,
      '✨': 18
    },
    userReacted: { '✨': true, '❤️': true },
    comments: [
      { id: 'c1', user: 'Marcus', text: 'This looks so serene! Need this peace today.', time: '30m ago' },
      { id: 'c2', user: 'Aria', text: 'The light on the water is stunning ✨', time: '12m ago' }
    ]
  },
  {
    id: 'moment_2',
    author: {
      name: 'You (Journal)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      handle: '@you'
    },
    photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
    filter: 'vintage',
    mood: '☕ Cozy Vibes',
    location: '📍 Little Willow Coffee',
    privacy: 'private',
    favorite: false,
    timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
    note: "First rain of the autumn season. Fresh cinnamon brew in hand, writing chapter three in peace while the window steams up.",
    reactions: {
      '☕': 8,
      '❤️': 12,
      '✨': 6
    },
    userReacted: { '☕': true },
    comments: []
  },
  {
    id: 'moment_3',
    author: {
      name: 'Kai Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      handle: '@kaichen'
    },
    photoUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80',
    pipPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    filter: 'noir',
    mood: '🌙 Night Owl',
    location: '📍 High Alpine Lookout',
    privacy: 'friends',
    favorite: true,
    timestamp: Date.now() - 1000 * 60 * 60 * 22, // Yesterday
    note: "Pitch black sky peppered with millions of stars. Cold wind biting our fingers, but none of us wanted to head back down.",
    reactions: {
      '🔥': 24,
      '✨': 31,
      '🥹': 9
    },
    userReacted: { '🔥': true },
    comments: [
      { id: 'c3', user: 'Sam', text: 'Bro where is this?? Insane view!', time: '18h ago' }
    ]
  }
];

const DAILY_PROMPTS = [
  "What was a quiet little victory you celebrated today?",
  "Who crossed your mind that you haven't spoken to in a while?",
  "What does the sky look like right above you right now?",
  "A tiny sensory detail (a scent, sound, warmth) you don't want to forget.",
  "What made you pause and smile unexpectedly?",
  "If today was a song, what kind of rhythm would it have?"
];

/**
 * IndexedDB Database Manager for Unlimited Media & Offline Persistence
 */
class NookDB {
  constructor() {
    this.dbName = 'nook_moments_db_v2';
    this.version = 1;
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('moments')) {
          db.createObjectStore('moments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB open error:', e);
        reject(e);
      };
    });
  }

  async getAllMoments() {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('moments', 'readonly');
      const store = tx.objectStore('moments');
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];
        // Sort descending by timestamp
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };

      request.onerror = (err) => reject(err);
    });
  }

  async putMoment(moment) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('moments', 'readwrite');
      const store = tx.objectStore('moments');
      const request = store.put(moment);
      request.onsuccess = () => resolve();
      request.onerror = (err) => reject(err);
    });
  }

  async deleteMoment(id) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('moments', 'readwrite');
      const store = tx.objectStore('moments');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = (err) => reject(err);
    });
  }

  async clearMoments() {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('moments', 'readwrite');
      const store = tx.objectStore('moments');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (err) => reject(err);
    });
  }

  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usedMB = (est.usage / (1024 * 1024)).toFixed(1);
        const quotaMB = (est.quota / (1024 * 1024)).toFixed(0);
        return { usedMB, quotaMB };
      } catch (e) {
        // Fallback
      }
    }
    return { usedMB: '0.5', quotaMB: 'Unlimited (IndexedDB)' };
  }
}

/**
 * Main Nook Application Controller
 */
class NookApp {
  constructor() {
    this.db = new NookDB();
    this.moments = [];
    this.currentSpace = 'all'; // 'all', 'friends', 'private', 'favorites'
    this.currentFilter = 'all'; // 'all', 'today', 'mood-*'
    this.activeTab = 'feed'; // 'feed', 'memories', 'locket'

    // Camera & Capture State
    this.mediaStream = null;
    this.currentFacingMode = 'user'; // 'user' or 'environment'
    this.cameraMode = 'single'; // 'single' or 'dual'
    this.capturedImageData = null;
    this.capturedPipData = null;
    this.selectedFilter = 'none';
    this.selectedMood = '🌅 Golden Hour';

    // Creative Studio: Doodle State
    this.doodleActive = false;
    this.doodleColor = '#FF6B6B';
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;

    // Creative Studio: Stickers State
    this.activeStickers = []; // [{ emoji, x, y }]

    // Creative Studio: Voice Recording State
    this.mediaRecorder = null;
    this.voiceChunks = [];
    this.recordedVoiceDataUrl = null;
    this.voiceDuration = 0;
    this.voiceTimerInterval = null;
    this.isRecordingVoice = false;

    // Currently playing audio in feed
    this.activeAudioPlayer = null;

    this.initElements();
    this.bindEvents();
    this.initPWA();
    this.bootstrapData();
    this.initDailyPrompt();
    this.initLocketClock();
  }

  async bootstrapData() {
    try {
      let stored = await this.db.getAllMoments();
      if (!stored || stored.length === 0) {
        // Check localStorage migration
        const legacy = localStorage.getItem('nook_moments_data_v1');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed) && parsed.length > 0) {
              stored = parsed;
            }
          } catch (e) {}
        }
      }

      if (!stored || stored.length === 0) {
        stored = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_MOMENTS));
        for (const m of stored) {
          await this.db.putMoment(m);
        }
      }

      this.moments = stored;
      this.render();
    } catch (err) {
      console.warn('Bootstrap data fallback:', err);
      this.moments = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_MOMENTS));
      this.render();
    }
  }

  async saveMomentsToDB() {
    try {
      for (const m of this.moments) {
        await this.db.putMoment(m);
      }
    } catch (e) {
      console.error('Error saving moments to IndexedDB:', e);
    }
  }

  initElements() {
    // Top Bar
    this.streakCountEl = document.getElementById('streakCount');
    this.btnOpenSearch = document.getElementById('btnOpenSearch');
    this.btnOpenSettings = document.getElementById('btnOpenSettings');
    this.brandHomeBtn = document.getElementById('brandHomeBtn');
    this.spacesBar = document.querySelector('.spaces-bar');
    this.filtersBar = document.getElementById('filtersBar');

    // Main Views
    this.momentsFeedView = document.getElementById('momentsFeedView');
    this.calendarView = document.getElementById('calendarView');
    this.locketView = document.getElementById('locketView');
    this.dailyPromptText = document.getElementById('dailyPromptText');
    this.btnSnapPrompt = document.getElementById('btnSnapPrompt');

    // Bottom Dock
    this.dockFeedBtn = document.getElementById('dockFeedBtn');
    this.dockCalendarBtn = document.getElementById('dockCalendarBtn');
    this.dockCaptureBtn = document.getElementById('dockCaptureBtn');
    this.dockLocketBtn = document.getElementById('dockLocketBtn');
    this.dockSettingsBtn = document.getElementById('dockSettingsBtn');

    // Capture Modal & Controls
    this.captureDialog = document.getElementById('captureDialog');
    this.cameraModeToggle = document.getElementById('cameraModeToggle');
    this.modeSingleShot = document.getElementById('modeSingleShot');
    this.modeDualCam = document.getElementById('modeDualCam');
    this.cameraVideo = document.getElementById('cameraVideo');
    this.capturePreviewImg = document.getElementById('capturePreviewImg');
    this.doodleCanvas = document.getElementById('doodleCanvas');
    this.hiddenCanvas = document.getElementById('hiddenCanvas');
    this.viewfinderBox = document.getElementById('viewfinderBox');
    this.dualPipBox = document.getElementById('dualPipBox');
    this.dualPipImg = document.getElementById('dualPipImg');
    this.btnRetakePip = document.getElementById('btnRetakePip');
    this.stickersLayer = document.getElementById('stickersLayer');
    this.shutterFlash = document.getElementById('shutterFlash');
    this.btnShutterTrigger = document.getElementById('btnShutterTrigger');
    this.btnSwitchCamera = document.getElementById('btnSwitchCamera');
    this.btnUploadFile = document.getElementById('btnUploadFile');
    this.fileInput = document.getElementById('fileInput');

    // Creative Tools Toolbar
    this.creativeToolsPanel = document.getElementById('creativeToolsPanel');
    this.btnToggleDoodle = document.getElementById('btnToggleDoodle');
    this.doodleLabel = document.getElementById('doodleLabel');
    this.doodlePalette = document.getElementById('doodlePalette');
    this.btnUndoDoodle = document.getElementById('btnUndoDoodle');
    this.stickersCarousel = document.getElementById('stickersCarousel');
    this.btnToggleVoiceRecord = document.getElementById('btnToggleVoiceRecord');
    this.voiceRecordLabel = document.getElementById('voiceRecordLabel');
    this.micDot = document.getElementById('micDot');
    this.voiceRecordTimer = document.getElementById('voiceRecordTimer');
    this.voicePreviewRow = document.getElementById('voicePreviewRow');
    this.btnPlayRecordedVoice = document.getElementById('btnPlayRecordedVoice');
    this.btnDeleteRecordedVoice = document.getElementById('btnDeleteRecordedVoice');
    this.checkFilmGrain = document.getElementById('checkFilmGrain');
    this.rangeVignette = document.getElementById('rangeVignette');

    // Form inputs
    this.filterCarousel = document.getElementById('filterCarousel');
    this.moodPickerGroup = document.getElementById('moodPickerGroup');
    this.momentNoteInput = document.getElementById('momentNoteInput');
    this.momentLocationInput = document.getElementById('momentLocationInput');
    this.momentPrivacySelect = document.getElementById('momentPrivacySelect');
    this.btnSaveMoment = document.getElementById('btnSaveMoment');
    this.btnCloseCapture = document.getElementById('btnCloseCapture');
    this.btnCancelCapture = document.getElementById('btnCancelCapture');

    // Settings Modal
    this.settingsDialog = document.getElementById('settingsDialog');
    this.btnCloseSettings = document.getElementById('btnCloseSettings');
    this.settingsStatsText = document.getElementById('settingsStatsText');
    this.btnExportData = document.getElementById('btnExportData');
    this.btnImportDataTrigger = document.getElementById('btnImportDataTrigger');
    this.importJsonInput = document.getElementById('importJsonInput');
    this.btnResetSampleData = document.getElementById('btnResetSampleData');
    this.btnClearAllMoments = document.getElementById('btnClearAllMoments');

    // Search Modal
    this.searchDialog = document.getElementById('searchDialog');
    this.btnCloseSearch = document.getElementById('btnCloseSearch');
    this.searchInput = document.getElementById('searchInput');
    this.searchResultsFeed = document.getElementById('searchResultsFeed');

    // Locket Widget
    this.locketWidgetContainer = document.getElementById('locketWidgetContainer');
    this.locketLiveClock = document.getElementById('locketLiveClock');
    this.locketLiveDate = document.getElementById('locketLiveDate');

    // Toast Container
    this.toastContainer = document.getElementById('toastContainer');
  }

  bindEvents() {
    // Navigation / Spaces
    this.spacesBar.addEventListener('click', (e) => {
      const tab = e.target.closest('.space-tab');
      if (!tab) return;
      this.spacesBar.querySelectorAll('.space-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      this.currentSpace = tab.dataset.space;
      this.render();
    });

    // Filter Chips
    this.filtersBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      this.filtersBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      this.currentFilter = chip.dataset.filter;
      this.render();
    });

    // Dock Navigation
    this.dockFeedBtn.addEventListener('click', () => this.switchTab('feed'));
    this.dockCalendarBtn.addEventListener('click', () => this.switchTab('memories'));
    this.dockLocketBtn.addEventListener('click', () => this.switchTab('locket'));
    this.dockSettingsBtn.addEventListener('click', () => this.openSettings());
    this.dockCaptureBtn.addEventListener('click', () => this.openCaptureModal());
    this.btnSnapPrompt.addEventListener('click', () => {
      const prompt = this.dailyPromptText.textContent;
      this.momentNoteInput.value = prompt + " ";
      this.openCaptureModal();
    });
    this.brandHomeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchTab('feed');
    });

    // Camera Mode Toggle (Single vs Dual)
    this.modeSingleShot.addEventListener('click', () => this.setCameraMode('single'));
    this.modeDualCam.addEventListener('click', () => this.setCameraMode('dual'));

    // In-Camera & Shutter Controls
    this.btnCloseCapture.addEventListener('click', () => this.closeCaptureModal());
    this.btnCancelCapture.addEventListener('click', () => this.closeCaptureModal());
    this.btnShutterTrigger.addEventListener('click', () => this.snapPhoto());
    this.btnSwitchCamera.addEventListener('click', () => this.switchCamera());
    this.btnUploadFile.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    this.btnRetakePip.addEventListener('click', () => this.retakeDualPip());
    this.btnSaveMoment.addEventListener('click', () => this.saveCapturedMoment());

    // Creative Studio: Doodle Pen
    this.btnToggleDoodle.addEventListener('click', () => this.toggleDoodleMode());
    this.doodlePalette.addEventListener('click', (e) => {
      const swatch = e.target.closest('.palette-swatch');
      if (!swatch) return;
      this.doodlePalette.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      this.doodleColor = swatch.dataset.color;
    });
    this.btnUndoDoodle.addEventListener('click', () => this.clearDoodleCanvas());
    this.bindDoodleDrawing();

    // Creative Studio: Stickers
    this.stickersCarousel.addEventListener('click', (e) => {
      const btn = e.target.closest('.sticker-btn');
      if (!btn) return;
      this.addSticker(btn.dataset.emoji);
    });

    // Creative Studio: Voice Recording
    this.btnToggleVoiceRecord.addEventListener('click', () => this.toggleVoiceRecording());
    this.btnPlayRecordedVoice.addEventListener('click', () => this.playRecordedVoice());
    this.btnDeleteRecordedVoice.addEventListener('click', () => this.deleteRecordedVoice());

    // Film Aesthetics
    this.checkFilmGrain.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.viewfinderBox.classList.add('grain-active');
      } else {
        this.viewfinderBox.classList.remove('grain-active');
      }
    });

    // Filter Carousel Selection
    this.filterCarousel.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-thumb-btn');
      if (!btn) return;
      this.filterCarousel.querySelectorAll('.filter-thumb-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.selectedFilter = btn.dataset.filter;
      this.applyFilterPreview(this.selectedFilter);
    });

    // Mood Picker Selection
    this.moodPickerGroup.addEventListener('click', (e) => {
      const chip = e.target.closest('.mood-chip-select');
      if (!chip) return;
      this.moodPickerGroup.querySelectorAll('.mood-chip-select').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      this.selectedMood = chip.dataset.mood;
    });

    // Settings Modal
    this.btnOpenSettings.addEventListener('click', () => this.openSettings());
    this.btnCloseSettings.addEventListener('click', () => this.settingsDialog.close());
    this.btnExportData.addEventListener('click', () => this.exportBackup());
    this.btnImportDataTrigger.addEventListener('click', () => this.importJsonInput.click());
    this.importJsonInput.addEventListener('change', (e) => this.importBackup(e));
    this.btnResetSampleData.addEventListener('click', () => this.resetSampleMoments());
    this.btnClearAllMoments.addEventListener('click', () => this.clearAllMoments());

    // Search Modal
    this.btnOpenSearch.addEventListener('click', () => this.openSearch());
    this.btnCloseSearch.addEventListener('click', () => this.searchDialog.close());
    this.searchInput.addEventListener('input', (e) => this.performSearch(e.target.value));

    // Calendar navigation
    document.getElementById('btnCalPrev')?.addEventListener('click', () => this.changeCalMonth(-1));
    document.getElementById('btnCalNext')?.addEventListener('click', () => this.changeCalMonth(1));
  }

  // Camera Mode Switcher
  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'single') {
      this.modeSingleShot.classList.add('active');
      this.modeDualCam.classList.remove('active');
      this.dualPipBox.style.display = 'none';
      this.capturedPipData = null;
    } else {
      this.modeDualCam.classList.add('active');
      this.modeSingleShot.classList.remove('active');
      this.showToast('📸 Dual Cam enabled! Main + Selfie will capture.');
    }
  }

  // Synthesize a physical camera shutter sound via Web Audio API
  playShutterSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);

      setTimeout(() => {
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start();
      }, 45);
    } catch (e) {}
  }

  // Camera Management
  async openCaptureModal() {
    this.capturedImageData = null;
    this.capturedPipData = null;
    this.capturePreviewImg.style.display = 'none';
    this.cameraVideo.style.display = 'block';
    this.btnShutterTrigger.style.display = 'block';
    this.dualPipBox.style.display = 'none';
    this.creativeToolsPanel.style.display = 'none';
    this.clearDoodleCanvas();
    this.clearStickers();
    this.deleteRecordedVoice();
    this.applyFilterPreview('none');
    this.viewfinderBox.classList.remove('grain-active');
    this.checkFilmGrain.checked = false;
    this.rangeVignette.value = 0;

    this.captureDialog.showModal();
    await this.startCamera();
  }

  async startCamera(facingMode = null) {
    if (facingMode) this.currentFacingMode = facingMode;
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });
      this.cameraVideo.srcObject = this.mediaStream;
    } catch (err) {
      console.warn('Camera access error:', err);
      this.cameraVideo.style.display = 'none';
      this.capturePreviewImg.src = 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80';
      this.capturePreviewImg.style.display = 'block';
      this.capturedImageData = this.capturePreviewImg.src;
      this.creativeToolsPanel.style.display = 'flex';
      this.showToast('Camera unavailable. Loaded photo preview.');
    }
  }

  switchCamera() {
    this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    this.startCamera();
  }

  async snapPhoto() {
    this.playShutterSound();

    // Trigger flash animation
    this.shutterFlash.classList.add('active');
    setTimeout(() => this.shutterFlash.classList.remove('active'), 350);

    const video = this.cameraVideo;
    const canvas = this.hiddenCanvas;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (this.currentFacingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    this.capturedImageData = canvas.toDataURL('image/jpeg', 0.88);
    this.capturePreviewImg.src = this.capturedImageData;
    this.capturePreviewImg.style.display = 'block';
    this.cameraVideo.style.display = 'none';

    // If Dual Cam mode is active, snap secondary selfie
    if (this.cameraMode === 'dual') {
      await this.captureDualPipSelfie();
    } else {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
      }
    }

    // Reveal Creative Tools Panel (doodle, stickers, voice memo)
    this.creativeToolsPanel.style.display = 'flex';
    this.resizeDoodleCanvas();
  }

  async captureDualPipSelfie() {
    this.showToast('📸 Snapping Dual-Cam selfie...');
    const oppositeMode = this.currentFacingMode === 'user' ? 'environment' : 'user';

    try {
      // Switch briefly to selfie mode
      const selfieStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: oppositeMode, width: { ideal: 640 }, height: { ideal: 480 } }
      });

      const tempVideo = document.createElement('video');
      tempVideo.srcObject = selfieStream;
      tempVideo.autoplay = true;
      tempVideo.muted = true;
      await new Promise(r => setTimeout(r, 600));

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 320;
      tempCanvas.height = 400;
      const tCtx = tempCanvas.getContext('2d');
      tCtx.drawImage(tempVideo, 0, 0, 320, 400);

      this.capturedPipData = tempCanvas.toDataURL('image/jpeg', 0.82);
      this.dualPipImg.src = this.capturedPipData;
      this.dualPipBox.style.display = 'block';

      selfieStream.getTracks().forEach(t => t.stop());
    } catch (e) {
      // Fallback selfie simulation if only 1 camera exists
      this.capturedPipData = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
      this.dualPipImg.src = this.capturedPipData;
      this.dualPipBox.style.display = 'block';
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }
  }

  async retakeDualPip() {
    this.capturedPipData = null;
    await this.captureDualPipSelfie();
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.capturedImageData = e.target.result;
      this.capturePreviewImg.src = this.capturedImageData;
      this.capturePreviewImg.style.display = 'block';
      this.cameraVideo.style.display = 'none';

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
      }

      this.creativeToolsPanel.style.display = 'flex';
      this.resizeDoodleCanvas();
    };
    reader.readAsDataURL(file);
  }

  applyFilterPreview(filterName) {
    this.capturePreviewImg.className = `filter-${filterName}`;
    this.cameraVideo.className = `filter-${filterName}`;
  }

  closeCaptureModal() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.isRecordingVoice) {
      this.stopVoiceRecording();
    }
    this.captureDialog.close();
  }

  // Creative Studio: Doodle Canvas Logic
  resizeDoodleCanvas() {
    const box = this.viewfinderBox;
    this.doodleCanvas.width = box.clientWidth;
    this.doodleCanvas.height = box.clientHeight;
  }

  toggleDoodleMode() {
    this.doodleActive = !this.doodleActive;
    if (this.doodleActive) {
      this.doodleCanvas.style.display = 'block';
      this.doodlePalette.style.display = 'flex';
      this.btnToggleDoodle.classList.add('active');
      this.doodleLabel.textContent = 'Doodle Pen: ON';
      this.showToast('🎨 Freehand pen active! Draw over photo.');
    } else {
      this.doodlePalette.style.display = 'none';
      this.btnToggleDoodle.classList.remove('active');
      this.doodleLabel.textContent = 'Doodle Pen: OFF';
    }
  }

  clearDoodleCanvas() {
    const ctx = this.doodleCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.doodleCanvas.width, this.doodleCanvas.height);
  }

  bindDoodleDrawing() {
    const canvas = this.doodleCanvas;
    const ctx = canvas.getContext('2d');

    const startDraw = (e) => {
      if (!this.doodleActive) return;
      this.isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      this.lastX = (e.clientX || e.touches[0].clientX) - rect.left;
      this.lastY = (e.clientY || e.touches[0].clientY) - rect.top;
    };

    const draw = (e) => {
      if (!this.isDrawing || !this.doodleActive) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const currentX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const currentY = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

      ctx.beginPath();
      ctx.moveTo(this.lastX, this.lastY);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = this.doodleColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = this.doodleColor;
      ctx.shadowBlur = 6;
      ctx.stroke();

      this.lastX = currentX;
      this.lastY = currentY;
    };

    const stopDraw = () => {
      this.isDrawing = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDraw);
  }

  // Creative Studio: Draggable Stickers Logic
  addSticker(emoji) {
    const sticker = document.createElement('div');
    sticker.className = 'placed-sticker';
    sticker.textContent = emoji;

    // Center in viewfinder
    const box = this.viewfinderBox;
    let x = box.clientWidth / 2;
    let y = box.clientHeight / 2;

    sticker.style.left = `${x}px`;
    sticker.style.top = `${y}px`;

    // Make Draggable with Pointer Events
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      startX = e.clientX - x;
      startY = e.clientY - y;
      sticker.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      x = e.clientX - startX;
      y = e.clientY - startY;
      sticker.style.left = `${x}px`;
      sticker.style.top = `${y}px`;
    };

    const onPointerUp = (e) => {
      isDragging = false;
      try { sticker.releasePointerCapture(e.pointerId); } catch(err){}
    };

    // Double click to remove
    sticker.addEventListener('dblclick', () => {
      sticker.remove();
      this.activeStickers = this.activeStickers.filter(s => s.element !== sticker);
    });

    sticker.addEventListener('pointerdown', onPointerDown);
    sticker.addEventListener('pointermove', onPointerMove);
    sticker.addEventListener('pointerup', onPointerUp);

    this.stickersLayer.appendChild(sticker);
    this.activeStickers.push({ emoji, getPos: () => ({ x, y }), element: sticker });
    this.showToast(`✨ ${emoji} sticker added! Drag to place.`);
  }

  clearStickers() {
    this.stickersLayer.innerHTML = '';
    this.activeStickers = [];
  }

  // Creative Studio: Voice Recording Logic
  async toggleVoiceRecording() {
    if (this.isRecordingVoice) {
      this.stopVoiceRecording();
    } else {
      await this.startVoiceRecording();
    }
  }

  async startVoiceRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.voiceChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.voiceChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.voiceChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          this.recordedVoiceDataUrl = reader.result;
          this.voicePreviewRow.style.display = 'flex';
          this.showToast('🎙️ Voice memo recorded!');
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(t => t.stop());
      };

      this.mediaRecorder.start();
      this.isRecordingVoice = true;
      this.voiceDuration = 0;
      this.btnToggleVoiceRecord.classList.add('recording');
      this.voiceRecordLabel.textContent = '⏹ Stop Recording';
      this.voiceRecordTimer.style.display = 'inline-block';
      this.voiceRecordTimer.textContent = '00:00';

      this.voiceTimerInterval = setInterval(() => {
        this.voiceDuration++;
        const mins = String(Math.floor(this.voiceDuration / 60)).padStart(2, '0');
        const secs = String(this.voiceDuration % 60).padStart(2, '0');
        this.voiceRecordTimer.textContent = `${mins}:${secs}`;
      }, 1000);

    } catch (err) {
      console.warn('Microphone error:', err);
      // Simulate voice note for environments without mic permissions
      this.recordedVoiceDataUrl = 'simulated';
      this.voiceDuration = 12;
      this.voicePreviewRow.style.display = 'flex';
      this.showToast('Simulated voice memo attached.');
    }
  }

  stopVoiceRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecordingVoice = false;
    clearInterval(this.voiceTimerInterval);
    this.btnToggleVoiceRecord.classList.remove('recording');
    this.voiceRecordLabel.textContent = '🎙️ Re-record';
  }

  playRecordedVoice() {
    if (!this.recordedVoiceDataUrl) return;
    if (this.recordedVoiceDataUrl === 'simulated') {
      this.playBeepSound();
      this.showToast('▶ Playing voice memo preview...');
      return;
    }
    const audio = new Audio(this.recordedVoiceDataUrl);
    audio.play();
  }

  deleteRecordedVoice() {
    this.recordedVoiceDataUrl = null;
    this.voiceDuration = 0;
    this.voicePreviewRow.style.display = 'none';
    this.voiceRecordTimer.style.display = 'none';
    this.voiceRecordLabel.textContent = '🎙️ Record Voice Memo';
  }

  playBeepSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }

  // Composite Photo Canvas (Merging filters, grain, vignette, doodles, stickers)
  async generateCompositePhoto() {
    const basePhoto = this.capturedImageData || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80';
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    // 1. Draw base image with filter
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = basePhoto;
    await new Promise(r => { img.onload = r; img.onerror = r; });

    // Apply canvas filter
    const filterCSS = {
      'none': 'none',
      'warm': 'sepia(0.25) contrast(1.08) brightness(1.04) saturate(1.2)',
      'noir': 'grayscale(1) contrast(1.3) brightness(0.9)',
      'vintage': 'sepia(0.5) hue-rotate(-20deg) contrast(0.95)',
      'cyber': 'hue-rotate(60deg) contrast(1.2) saturate(1.4)',
      'velvet': 'brightness(1.08) contrast(1.1) saturate(1.15)'
    }[this.selectedFilter] || 'none';

    ctx.filter = filterCSS;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    // 2. Draw Vignette if slider > 0
    const vigVal = parseInt(this.rangeVignette.value, 10);
    if (vigVal > 0) {
      const vigRad = canvas.width * 0.7;
      const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, vigRad * 0.3, canvas.width / 2, canvas.height / 2, vigRad);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${vigVal / 100})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 3. Draw 35mm Film Grain if checked
    if (this.checkFilmGrain.checked) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 22;
        data[i] += noise;
        data[i+1] += noise;
        data[i+2] += noise;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // 4. Draw Doodles
    if (this.doodleCanvas.width > 0) {
      ctx.drawImage(this.doodleCanvas, 0, 0, canvas.width, canvas.height);
    }

    // 5. Draw Stickers
    const boxW = this.viewfinderBox.clientWidth || 400;
    const boxH = this.viewfinderBox.clientHeight || 300;
    for (const s of this.activeStickers) {
      const pos = s.getPos();
      const normX = (pos.x / boxW) * canvas.width;
      const normY = (pos.y / boxH) * canvas.height;
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 12;
      ctx.fillText(s.emoji, normX, normY);
    }

    return canvas.toDataURL('image/jpeg', 0.88);
  }

  // Save Moment
  async saveCapturedMoment() {
    this.showToast('Saving moment to IndexedDB...');
    const compositePhoto = await this.generateCompositePhoto();
    const note = this.momentNoteInput.value.trim() || 'A quiet moment preserved in the diary.';
    const location = this.momentLocationInput.value.trim() || '📍 My Secret Nook';
    const privacy = this.momentPrivacySelect.value;

    let voiceNote = null;
    if (this.recordedVoiceDataUrl) {
      const mins = Math.floor(this.voiceDuration / 60);
      const secs = String(this.voiceDuration % 60).padStart(2, '0');
      voiceNote = {
        dataUrl: this.recordedVoiceDataUrl,
        duration: `${mins}:${secs}`
      };
    }

    const newMoment = {
      id: 'moment_' + Date.now(),
      author: {
        name: 'You (Journal)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        handle: '@you'
      },
      photoUrl: compositePhoto,
      pipPhotoUrl: this.capturedPipData || null,
      filter: this.selectedFilter,
      mood: this.selectedMood,
      location: location,
      privacy: privacy,
      favorite: false,
      timestamp: Date.now(),
      note: note,
      voiceNote: voiceNote,
      reactions: {
        '❤️': 1,
        '✨': 1
      },
      userReacted: { '❤️': true },
      comments: []
    };

    this.moments.unshift(newMoment);
    await this.db.putMoment(newMoment);

    this.closeCaptureModal();
    this.momentNoteInput.value = '';
    this.switchTab('feed');
    this.render();
    this.showToast('✨ Moment posted to your diary!');
  }

  // Switch App Navigation Views
  switchTab(tab) {
    this.activeTab = tab;
    [this.dockFeedBtn, this.dockCalendarBtn, this.dockLocketBtn].forEach(b => b.classList.remove('active'));

    this.momentsFeedView.style.display = 'none';
    this.calendarView.style.display = 'none';
    this.locketView.style.display = 'none';

    if (tab === 'feed') {
      this.dockFeedBtn.classList.add('active');
      this.momentsFeedView.style.display = 'flex';
      this.renderFeed();
    } else if (tab === 'memories') {
      this.dockCalendarBtn.classList.add('active');
      this.calendarView.style.display = 'flex';
      this.renderCalendar();
    } else if (tab === 'locket') {
      this.dockLocketBtn.classList.add('active');
      this.locketView.style.display = 'flex';
      this.renderLocket();
    }
  }

  render() {
    this.streakCountEl.textContent = `${Math.min(7, Math.max(1, this.moments.length * 2))} Days`;
    if (this.activeTab === 'feed') {
      this.renderFeed();
    } else if (this.activeTab === 'memories') {
      this.renderCalendar();
    } else if (this.activeTab === 'locket') {
      this.renderLocket();
    }
  }

  getFilteredMoments() {
    return this.moments.filter(m => {
      if (this.currentSpace === 'friends' && m.privacy !== 'friends') return false;
      if (this.currentSpace === 'private' && m.privacy !== 'private') return false;
      if (this.currentSpace === 'favorites' && !m.favorite) return false;

      if (this.currentFilter === 'today') {
        const isToday = new Date(m.timestamp).toDateString() === new Date().toDateString();
        if (!isToday) return false;
      } else if (this.currentFilter.startsWith('mood-')) {
        const moodKey = this.currentFilter.replace('mood-', '');
        const match = {
          'golden': 'Golden Hour',
          'cozy': 'Cozy Vibes',
          'peace': 'Quiet Mind',
          'night': 'Night'
        }[moodKey];
        if (match && !m.mood.includes(match)) return false;
      }
      return true;
    });
  }

  renderFeed() {
    const list = this.getFilteredMoments();
    if (list.length === 0) {
      this.momentsFeedView.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🕯️</div>
          <h3 style="color: var(--text-main); font-size: 1.1rem; margin-bottom: 6px;">No moments in this space yet</h3>
          <p style="font-size: 0.85rem; margin-bottom: 18px;">Capture your thoughts or switch filters to browse your archive.</p>
          <button class="btn-primary" onclick="window.nookApp.openCaptureModal()">+ Capture New Moment</button>
        </div>
      `;
      return;
    }

    this.momentsFeedView.innerHTML = list.map(m => this.createMomentCardHTML(m)).join('');
    this.bindCardInteractions(this.momentsFeedView);
  }

  createMomentCardHTML(m) {
    const timeFormatted = this.formatTimeAgo(m.timestamp);
    const filterClass = `filter-${m.filter || 'none'}`;
    const isFriends = m.privacy === 'friends';
    const favColor = m.favorite ? 'var(--accent-coral)' : 'currentColor';

    // Dual-Camera PiP Inset
    const dualPipHTML = m.pipPhotoUrl ? `
      <div class="feed-dual-pip" data-moment-id="${m.id}" title="Tap to swap main and selfie photo">
        <img src="${m.pipPhotoUrl}" alt="Selfie PiP">
        <span class="feed-pip-swap-badge">⇄ Swap</span>
      </div>
    ` : '';

    // Voice Note Player
    const voiceNoteHTML = m.voiceNote ? `
      <div class="moment-audio-player" data-moment-id="${m.id}" data-audio="${m.voiceNote.dataUrl || ''}">
        <button class="audio-play-btn" type="button" title="Play Voice Memo">▶</button>
        <div class="audio-waveform-bars">
          <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <span class="audio-duration-label">${m.voiceNote.duration || '0:15'}</span>
      </div>
    ` : '';

    const reactionsKeys = ['❤️', '🔥', '✨', '🥹', '☕'];
    const reactionsHTML = reactionsKeys.map(emoji => {
      const count = m.reactions[emoji] || 0;
      const hasReacted = m.userReacted && m.userReacted[emoji];
      return `
        <button class="reaction-btn ${hasReacted ? 'reacted' : ''}" data-moment-id="${m.id}" data-emoji="${emoji}">
          <span>${emoji}</span>
          <span>${count}</span>
        </button>
      `;
    }).join('');

    const commentsHTML = (m.comments || []).map(c => `
      <div class="comment-item">
        <span class="comment-user">${this.escapeHTML(c.user)}</span>
        <span class="comment-content">${this.escapeHTML(c.text)}</span>
        <span class="comment-time">${c.time}</span>
      </div>
    `).join('');

    return `
      <article class="moment-card" data-id="${m.id}">
        <header class="moment-header">
          <div class="author-meta">
            <img class="avatar" src="${m.author.avatar}" alt="${this.escapeHTML(m.author.name)}">
            <div class="author-text">
              <span class="author-name">${this.escapeHTML(m.author.name)}</span>
              <div class="moment-meta-row">
                <span>${timeFormatted}</span>
                <span>•</span>
                <span class="privacy-badge ${isFriends ? 'friends' : ''}">
                  ${isFriends ? '👥 Friends' : '🔒 Private'}
                </span>
              </div>
            </div>
          </div>
          <div class="action-tools">
            <button class="tool-btn btn-fav" data-moment-id="${m.id}" title="Favorite Moment" style="color: ${favColor}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${m.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <button class="tool-btn btn-delete" data-moment-id="${m.id}" title="Delete Moment">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </header>

        <div class="moment-media-wrapper" data-moment-id="${m.id}">
          <img class="moment-photo ${filterClass}" id="photo-${m.id}" src="${m.photoUrl}" alt="Moment captured by ${this.escapeHTML(m.author.name)}" loading="lazy">
          ${dualPipHTML}
          <div class="media-overlay-tags">
            <span class="mood-pill">${m.mood}</span>
            <span class="location-pill">${this.escapeHTML(m.location)}</span>
          </div>
        </div>

        ${voiceNoteHTML}

        <div class="moment-body">
          <p class="moment-note">${this.escapeHTML(m.note)}</p>
        </div>

        <footer class="moment-footer">
          <div class="reactions-group">
            ${reactionsHTML}
          </div>
          <button class="tool-btn btn-toggle-comments" data-moment-id="${m.id}" title="Comments">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span style="font-size: 0.75rem; margin-left: 4px;">${(m.comments || []).length}</span>
          </button>
        </footer>

        <div class="comments-section" id="comments-${m.id}" style="display: ${(m.comments && m.comments.length > 0) ? 'block' : 'none'};">
          <div class="comment-list" id="comment-list-${m.id}">
            ${commentsHTML}
          </div>
          <form class="comment-form" data-moment-id="${m.id}">
            <input type="text" class="comment-input" placeholder="Add a quiet thought..." required>
            <button type="submit" class="btn-comment-send">Reply</button>
          </form>
        </div>
      </article>
    `;
  }

  bindCardInteractions(container) {
    // Reactions
    container.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const momentId = btn.dataset.momentId;
        const emoji = btn.dataset.emoji;
        this.handleReaction(momentId, emoji, btn, e);
      });
    });

    // Double click photo to Heart
    container.querySelectorAll('.moment-media-wrapper').forEach(wrap => {
      wrap.addEventListener('dblclick', (e) => {
        const momentId = wrap.dataset.momentId;
        const heartBtn = wrap.parentElement.querySelector('.reaction-btn[data-emoji="❤️"]');
        this.handleReaction(momentId, '❤️', heartBtn || wrap, e);
      });
    });

    // Swap Dual-Camera PiP & Main photo on tap
    container.querySelectorAll('.feed-dual-pip').forEach(pip => {
      pip.addEventListener('click', (e) => {
        e.stopPropagation();
        const momentId = pip.dataset.momentId;
        this.swapDualCameraPhotos(momentId);
      });
    });

    // Voice Memo Audio Playback
    container.querySelectorAll('.moment-audio-player').forEach(player => {
      const playBtn = player.querySelector('.audio-play-btn');
      playBtn.addEventListener('click', () => {
        this.toggleAudioPlayback(player);
      });
    });

    // Favorite toggle
    container.querySelectorAll('.btn-fav').forEach(btn => {
      btn.addEventListener('click', () => {
        const momentId = btn.dataset.momentId;
        this.toggleFavorite(momentId);
      });
    });

    // Delete
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const momentId = btn.dataset.momentId;
        this.deleteMoment(momentId);
      });
    });

    // Toggle comments
    container.querySelectorAll('.btn-toggle-comments').forEach(btn => {
      btn.addEventListener('click', () => {
        const momentId = btn.dataset.momentId;
        const sec = document.getElementById(`comments-${momentId}`);
        if (sec) {
          sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
        }
      });
    });

    // Submit Comment
    container.querySelectorAll('.comment-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const momentId = form.dataset.momentId;
        const input = form.querySelector('.comment-input');
        const text = input.value.trim();
        if (!text) return;
        this.addComment(momentId, text);
        input.value = '';
      });
    });
  }

  // Swap Dual Camera Photos in Card
  swapDualCameraPhotos(momentId) {
    const moment = this.moments.find(m => m.id === momentId);
    if (!moment || !moment.pipPhotoUrl) return;

    // Swap
    const temp = moment.photoUrl;
    moment.photoUrl = moment.pipPhotoUrl;
    moment.pipPhotoUrl = temp;

    this.db.putMoment(moment);
    this.render();
    this.showToast('⇄ Swapped main and selfie perspective!');
  }

  // Audio Playback in Feed
  toggleAudioPlayback(playerElement) {
    const isPlaying = playerElement.classList.contains('playing');
    const playBtn = playerElement.querySelector('.audio-play-btn');

    // Stop currently active player
    if (this.activeAudioPlayer && this.activeAudioPlayer !== playerElement) {
      this.activeAudioPlayer.classList.remove('playing');
      const b = this.activeAudioPlayer.querySelector('.audio-play-btn');
      if (b) b.textContent = '▶';
      if (this.currentPlayingAudio) {
        this.currentPlayingAudio.pause();
        this.currentPlayingAudio = null;
      }
    }

    if (isPlaying) {
      playerElement.classList.remove('playing');
      playBtn.textContent = '▶';
      if (this.currentPlayingAudio) {
        this.currentPlayingAudio.pause();
        this.currentPlayingAudio = null;
      }
      this.activeAudioPlayer = null;
    } else {
      playerElement.classList.add('playing');
      playBtn.textContent = '⏸';
      this.activeAudioPlayer = playerElement;

      const audioUrl = playerElement.dataset.audio;
      if (audioUrl && audioUrl !== 'simulated' && audioUrl.startsWith('data:audio')) {
        this.currentPlayingAudio = new Audio(audioUrl);
        this.currentPlayingAudio.play();
        this.currentPlayingAudio.onended = () => {
          playerElement.classList.remove('playing');
          playBtn.textContent = '▶';
          this.activeAudioPlayer = null;
        };
      } else {
        // Simulated audio tone with Web Audio API
        this.playBeepSound();
        setTimeout(() => {
          playerElement.classList.remove('playing');
          playBtn.textContent = '▶';
          this.activeAudioPlayer = null;
        }, 3200);
      }
    }
  }

  handleReaction(momentId, emoji, targetEl, event) {
    const moment = this.moments.find(m => m.id === momentId);
    if (!moment) return;

    if (!moment.reactions) moment.reactions = {};
    if (!moment.userReacted) moment.userReacted = {};

    const hasReacted = moment.userReacted[emoji];
    if (hasReacted) {
      moment.reactions[emoji] = Math.max(0, (moment.reactions[emoji] || 1) - 1);
      delete moment.userReacted[emoji];
    } else {
      moment.reactions[emoji] = (moment.reactions[emoji] || 0) + 1;
      moment.userReacted[emoji] = true;
      this.spawnParticle(emoji, event ? event.clientX : null, event ? event.clientY : null, targetEl);
    }

    this.db.putMoment(moment);
    this.render();
  }

  spawnParticle(emoji, x, y, fallbackEl) {
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    particle.textContent = emoji;

    let posX = x;
    let posY = y;
    if (!posX && fallbackEl) {
      const rect = fallbackEl.getBoundingClientRect();
      posX = rect.left + rect.width / 2;
      posY = rect.top;
    }

    particle.style.left = `${posX || window.innerWidth / 2}px`;
    particle.style.top = `${posY || window.innerHeight / 2}px`;

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1200);
  }

  toggleFavorite(momentId) {
    const moment = this.moments.find(m => m.id === momentId);
    if (!moment) return;
    moment.favorite = !moment.favorite;
    this.db.putMoment(moment);
    this.render();
    this.showToast(moment.favorite ? '⭐️ Saved to favorites' : 'Removed from favorites');
  }

  async deleteMoment(momentId) {
    if (!confirm('Remove this moment from your diary?')) return;
    this.moments = this.moments.filter(m => m.id !== momentId);
    await this.db.deleteMoment(momentId);
    this.render();
    this.showToast('🗑 Moment removed');
  }

  addComment(momentId, text) {
    const moment = this.moments.find(m => m.id === momentId);
    if (!moment) return;
    if (!moment.comments) moment.comments = [];
    moment.comments.push({
      id: 'c_' + Date.now(),
      user: 'You',
      text: text,
      time: 'Just now'
    });
    this.db.putMoment(moment);
    this.render();
    this.showToast('Note added to moment');
  }

  // Calendar View
  renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarMonthTitle');
    const now = new Date();
    title.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    let html = days.map(d => `<div class="cal-day-label">${d}</div>`).join('');

    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="cal-day-cell" style="opacity: 0.2;"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
      const isToday = day === now.getDate();
      const hasMoments = this.moments.some(m => {
        const d = new Date(m.timestamp);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      });

      html += `
        <div class="cal-day-cell ${isToday ? 'today' : ''} ${hasMoments ? 'has-moment' : ''}" data-day="${day}">
          <span>${day}</span>
          ${hasMoments ? '<span class="cal-moment-dot"></span>' : ''}
        </div>
      `;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.cal-day-cell[data-day]').forEach(cell => {
      cell.addEventListener('click', () => {
        const d = parseInt(cell.dataset.day, 10);
        this.showMomentsForDay(d, month, year);
      });
    });
  }

  showMomentsForDay(day, month, year) {
    const target = document.getElementById('calendarSelectedMoments');
    const matched = this.moments.filter(m => {
      const dt = new Date(m.timestamp);
      return dt.getDate() === day && dt.getMonth() === month && dt.getFullYear() === year;
    });

    if (matched.length === 0) {
      target.innerHTML = `<p style="text-align: center; color: var(--text-dim); font-size: 0.85rem; padding: 12px;">No moments recorded on ${month + 1}/${day}/${year}</p>`;
      return;
    }

    target.innerHTML = `
      <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--accent-coral); margin-bottom: 8px;">
        Memories on ${nowMonthName(month)} ${day}:
      </h3>
      ${matched.map(m => this.createMomentCardHTML(m)).join('')}
    `;
    this.bindCardInteractions(target);
  }

  // Locket Widget Mode Simulator
  renderLocket() {
    const newest = this.moments[0];
    if (!newest) {
      this.locketWidgetContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); margin: auto;">
          No live moments yet.
        </div>
      `;
      return;
    }

    this.locketWidgetContainer.innerHTML = `
      <img class="locket-widget-img filter-${newest.filter || 'none'}" src="${newest.photoUrl}" alt="Widget memory">
      <div class="locket-widget-overlay">
        <span style="font-weight: 700;">${this.escapeHTML(newest.author.name)}</span>
        <span style="font-size: 0.72rem; opacity: 0.85;">${this.formatTimeAgo(newest.timestamp)}</span>
      </div>
    `;
  }

  initLocketClock() {
    const update = () => {
      const now = new Date();
      if (this.locketLiveClock) {
        this.locketLiveClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (this.locketLiveDate) {
        this.locketLiveDate.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      }
    };
    update();
    setInterval(update, 30000);
  }

  // Settings & IndexedDB Storage Stats
  async openSettings() {
    const estimate = await this.db.getStorageEstimate();
    this.settingsStatsText.innerHTML = `
      <strong>${this.moments.length} moments</strong> stored in IndexedDB.<br>
      Storage used: <span style="color:var(--accent-coral);">${estimate.usedMB} MB</span> / ${estimate.quotaMB} MB
    `;
    this.settingsDialog.showModal();
  }

  exportBackup() {
    const blob = new Blob([JSON.stringify(this.moments, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nook_moments_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('📥 Backup downloaded');
  }

  importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          this.moments = imported;
          await this.db.clearMoments();
          for (const m of this.moments) {
            await this.db.putMoment(m);
          }
          this.render();
          this.settingsDialog.close();
          this.showToast(`✨ Successfully imported ${imported.length} moments into IndexedDB!`);
        } else {
          alert('Invalid backup format: root must be an array of moments.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  }

  async resetSampleMoments() {
    if (!confirm('Restore default sample moments into your diary?')) return;
    this.moments = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_MOMENTS));
    await this.db.clearMoments();
    for (const m of this.moments) {
      await this.db.putMoment(m);
    }
    this.render();
    this.settingsDialog.close();
    this.showToast('↻ Sample moments restored in IndexedDB');
  }

  async clearAllMoments() {
    if (!confirm('Are you sure you want to delete all saved moments?')) return;
    this.moments = [];
    await this.db.clearMoments();
    this.render();
    this.settingsDialog.close();
    this.showToast('All moments cleared.');
  }

  // Search
  openSearch() {
    this.searchDialog.showModal();
    this.searchInput.value = '';
    this.searchResultsFeed.innerHTML = '';
    setTimeout(() => this.searchInput.focus(), 100);
  }

  performSearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.searchResultsFeed.innerHTML = '';
      return;
    }
    const matched = this.moments.filter(m => {
      return (
        m.note.toLowerCase().includes(q) ||
        m.mood.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.author.name.toLowerCase().includes(q)
      );
    });

    if (matched.length === 0) {
      this.searchResultsFeed.innerHTML = `<p style="text-align: center; color: var(--text-dim); padding: 18px;">No matching moments found.</p>`;
      return;
    }

    this.searchResultsFeed.innerHTML = matched.map(m => this.createMomentCardHTML(m)).join('');
    this.bindCardInteractions(this.searchResultsFeed);
  }

  initDailyPrompt() {
    const prompt = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
    this.dailyPromptText.textContent = `"${prompt}"`;
  }

  formatTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  }

  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${this.escapeHTML(message)}</span>`;
    this.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Nook ServiceWorker registered:', reg.scope))
          .catch(err => console.log('Nook ServiceWorker registration failed:', err));
      });
    }
  }
}

function nowMonthName(monthIndex) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex];
}

// Global Startup
window.addEventListener('DOMContentLoaded', () => {
  window.nookApp = new NookApp();
});
