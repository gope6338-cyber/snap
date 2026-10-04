/**
 * Nook — Moments Diary & Memory Journal Prototype
 * Client-Side PWA Engine
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
    filter: 'warm',
    mood: '🌅 Golden Hour',
    location: '📍 Pacific Palisades, CA',
    privacy: 'friends',
    favorite: true,
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    note: "Caught the horizon slipping into deep lavender and honey gold. No noise, just the tide breathing. Reminded myself that everything is unfolding right on time.",
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

// App State
class NookApp {
  constructor() {
    this.storageKey = 'nook_moments_data_v1';
    this.moments = this.loadMoments();
    this.currentSpace = 'all'; // 'all', 'friends', 'private', 'favorites'
    this.currentFilter = 'all'; // 'all', 'today', 'mood-*'
    this.activeTab = 'feed'; // 'feed', 'memories', 'locket'
    this.mediaStream = null;
    this.currentFacingMode = 'user'; // 'user' or 'environment'
    this.capturedImageData = null;
    this.selectedFilter = 'none';
    this.selectedMood = '🌅 Golden Hour';

    this.initElements();
    this.bindEvents();
    this.initPWA();
    this.render();
    this.initDailyPrompt();
    this.initLocketClock();
  }

  // Load from LocalStorage or initialize with defaults
  loadMoments() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read localStorage:', e);
    }
    // Fallback to initial defaults
    this.saveMoments(DEFAULT_SAMPLE_MOMENTS);
    return JSON.parse(JSON.stringify(DEFAULT_SAMPLE_MOMENTS));
  }

  saveMoments(moments) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(moments));
    } catch (e) {
      this.showToast('Storage full or unavailable');
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

    // Capture Modal
    this.captureDialog = document.getElementById('captureDialog');
    this.cameraVideo = document.getElementById('cameraVideo');
    this.capturePreviewImg = document.getElementById('capturePreviewImg');
    this.hiddenCanvas = document.getElementById('hiddenCanvas');
    this.viewfinderBox = document.getElementById('viewfinderBox');
    this.shutterFlash = document.getElementById('shutterFlash');
    this.btnShutterTrigger = document.getElementById('btnShutterTrigger');
    this.btnSwitchCamera = document.getElementById('btnSwitchCamera');
    this.btnUploadFile = document.getElementById('btnUploadFile');
    this.fileInput = document.getElementById('fileInput');
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

    // Filters
    this.filtersBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      this.filtersBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      this.currentFilter = chip.dataset.filter;
      this.render();
    });

    // Dock Tabs
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

    // Capture Dialog Controls
    this.btnCloseCapture.addEventListener('click', () => this.closeCaptureModal());
    this.btnCancelCapture.addEventListener('click', () => this.closeCaptureModal());
    this.btnShutterTrigger.addEventListener('click', () => this.snapPhoto());
    this.btnSwitchCamera.addEventListener('click', () => this.switchCamera());
    this.btnUploadFile.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    this.btnSaveMoment.addEventListener('click', () => this.saveCapturedMoment());

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

    // Calendar month controls
    document.getElementById('btnCalPrev')?.addEventListener('click', () => this.changeCalMonth(-1));
    document.getElementById('btnCalNext')?.addEventListener('click', () => this.changeCalMonth(1));
  }

  // Synthesize a retro physical camera shutter sound via Web Audio API
  playShutterSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Step 1: Mechanical click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);

      // Step 2: Soft shutter curtain release noise
      setTimeout(() => {
        const bufferSize = ctx.sampleRate * 0.06;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start();
      }, 50);
    } catch (e) {
      // AudioContext unavailable or blocked by browser policy
    }
  }

  // Camera Management
  async openCaptureModal() {
    this.capturedImageData = null;
    this.capturePreviewImg.style.display = 'none';
    this.cameraVideo.style.display = 'block';
    this.btnShutterTrigger.style.display = 'block';
    this.applyFilterPreview('none');

    this.captureDialog.showModal();
    await this.startCamera();
  }

  async startCamera() {
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
      // Fallback: Show photo upload helper if camera permissions denied
      this.cameraVideo.style.display = 'none';
      this.capturePreviewImg.src = 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80';
      this.capturePreviewImg.style.display = 'block';
      this.capturedImageData = this.capturePreviewImg.src;
      this.showToast('Camera unavailable. Using library photo instead.');
    }
  }

  switchCamera() {
    this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    this.startCamera();
  }

  snapPhoto() {
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

    // Stop video tracks to save power
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }
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
    this.captureDialog.close();
  }

  saveCapturedMoment() {
    const photo = this.capturedImageData || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80';
    const note = this.momentNoteInput.value.trim() || 'A quiet moment preserved in the diary.';
    const location = this.momentLocationInput.value.trim() || '📍 My Secret Nook';
    const privacy = this.momentPrivacySelect.value;

    const newMoment = {
      id: 'moment_' + Date.now(),
      author: {
        name: 'You (Journal)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
        handle: '@you'
      },
      photoUrl: photo,
      filter: this.selectedFilter,
      mood: this.selectedMood,
      location: location,
      privacy: privacy,
      favorite: false,
      timestamp: Date.now(),
      note: note,
      reactions: {
        '❤️': 1,
        '✨': 1
      },
      userReacted: { '❤️': true },
      comments: []
    };

    this.moments.unshift(newMoment);
    this.saveMoments(this.moments);
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

  // Render the primary chronological stream
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
      // Space matching
      if (this.currentSpace === 'friends' && m.privacy !== 'friends') return false;
      if (this.currentSpace === 'private' && m.privacy !== 'private') return false;
      if (this.currentSpace === 'favorites' && !m.favorite) return false;

      // Filter chip matching
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
          <img class="moment-photo ${filterClass}" src="${m.photoUrl}" alt="Moment captured by ${this.escapeHTML(m.author.name)}" loading="lazy">
          <div class="media-overlay-tags">
            <span class="mood-pill">${m.mood}</span>
            <span class="location-pill">${this.escapeHTML(m.location)}</span>
          </div>
        </div>

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

    // Double tap / click photo to Heart
    container.querySelectorAll('.moment-media-wrapper').forEach(wrap => {
      wrap.addEventListener('dblclick', (e) => {
        const momentId = wrap.dataset.momentId;
        const heartBtn = wrap.parentElement.querySelector('.reaction-btn[data-emoji="❤️"]');
        this.handleReaction(momentId, '❤️', heartBtn || wrap, e);
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

    this.saveMoments(this.moments);
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
    this.saveMoments(this.moments);
    this.render();
    this.showToast(moment.favorite ? '⭐️ Saved to favorites' : 'Removed from favorites');
  }

  deleteMoment(momentId) {
    if (!confirm('Remove this moment from your diary?')) return;
    this.moments = this.moments.filter(m => m.id !== momentId);
    this.saveMoments(this.moments);
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
    this.saveMoments(this.moments);
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

    // Blank prefix cells
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="cal-day-cell" style="opacity: 0.2;"></div>`;
    }

    // Days of Month
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

  // Settings & Data Export / Import
  openSettings() {
    this.settingsStatsText.textContent = `${this.moments.length} moments saved in local storage.`;
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
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          this.moments = imported;
          this.saveMoments(this.moments);
          this.render();
          this.settingsDialog.close();
          this.showToast(`✨ Successfully imported ${imported.length} moments!`);
        } else {
          alert('Invalid backup format: root must be an array of moments.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  }

  resetSampleMoments() {
    if (!confirm('Restore default sample moments into your diary?')) return;
    this.moments = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_MOMENTS));
    this.saveMoments(this.moments);
    this.render();
    this.settingsDialog.close();
    this.showToast('↻ Sample moments restored');
  }

  clearAllMoments() {
    if (!confirm('Are you sure you want to delete all saved moments?')) return;
    this.moments = [];
    this.saveMoments([]);
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

  // Daily Prompts
  initDailyPrompt() {
    const prompt = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
    this.dailyPromptText.textContent = `"${prompt}"`;
  }

  // Utilities
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

  // PWA Service Worker Registration
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

// Instantiate globally
window.addEventListener('DOMContentLoaded', () => {
  window.nookApp = new NookApp();
});
