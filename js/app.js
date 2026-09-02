/**
 * tvQuran.com Main Application Controller
 */

class TVQuranApp {
  constructor() {
    this.supportedLanguages = ['en', 'ur', 'fr', 'no'];
    const savedLanguage = localStorage.getItem('tvquran_lang');
    // Migrate visitors who previously selected the retired Arabic interface.
    this.currentLanguage = savedLanguage === 'ar' ? 'ur' : (savedLanguage || 'en');
    if (!this.supportedLanguages.includes(this.currentLanguage)) this.currentLanguage = 'en';
    this.currentTheme = localStorage.getItem('tvquran_theme') || 'dark';
    this.currentReciterId = 'idris-abkar';
    this.currentView = 'home';
    this.currentCollectionCategory = 'all';
    this.currentSlideIndex = 0;
    this.slideDuration = 5500;
    this.slideInterval = null;

    this.player = new TVQuranPlayer();
    this.mushaf = new TVQuranMushaf(this.player);

    window.tvquranApp = this;
    window.tvquranPlayer = this.player;
    window.tvquranMushaf = this.mushaf;

    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.applyLanguage(this.currentLanguage);
    this.initNavigation();
    this.initModals();
    this.initKeyboardShortcuts();
    this.initHeroSlider();
    
    // Initial Render
    this.renderAllViews();
    this.mushaf.init();

    // Auto-play Surah 6 (Al-An'am) from Idris Abkar on site entry, followed by random surahs
    this.initSiteAutoPlay();
  }

  initSiteAutoPlay() {
    this.currentReciterId = 'idris-abkar';
    this.player.isAutoRandomNext = true;
    
    // Start auto playback with Surah 6 by Idris Abkar
    this.player.playSurah('idris-abkar', 6);

    // If browser Autoplay policy temporarily delays unmuted audio before user gesture,
    // trigger audio seamlessly on the very first touch/click/key interaction.
    const startAudioOnFirstInteraction = () => {
      if (this.player.audio && this.player.audio.paused) {
        this.player.audio.play().catch(err => console.warn('Interaction autoplay attempt:', err));
      }
    };

    ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(evt => {
      document.addEventListener(evt, startAudioOnFirstInteraction, { once: true, capture: true, passive: true });
    });
  }

  // Hero Slider Carousel (4 Slides with Progress Indicators)
  initHeroSlider() {
    const sliderContainer = document.getElementById('heroSliderContainer');
    const prevBtn = document.getElementById('sliderPrevBtn');
    const nextBtn = document.getElementById('sliderNextBtn');
    const segments = document.querySelectorAll('.slider-progress-segment');

    if (!sliderContainer) return;

    // Arrow navigation
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        // In RTL, prev arrow moves to previous slide
        this.goToSlide(this.currentSlideIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.goToSlide(this.currentSlideIndex + 1);
      });
    }

    // Direct segment click
    segments.forEach((seg, idx) => {
      seg.addEventListener('click', () => {
        this.goToSlide(idx);
      });
    });

    // Pause on hover
    sliderContainer.addEventListener('mouseenter', () => {
      this.pauseSlideTimer();
    });

    sliderContainer.addEventListener('mouseleave', () => {
      this.startSlideTimer();
    });

    // Touch support (swipe)
    let touchStartX = 0;
    sliderContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      this.pauseSlideTimer();
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchEndX - touchStartX;
      if (Math.abs(diffX) > 45) {
        if (diffX > 0) {
          // Swipe Right
          this.goToSlide(this.currentSlideIndex - 1);
        } else {
          // Swipe Left
          this.goToSlide(this.currentSlideIndex + 1);
        }
      }
      this.startSlideTimer();
    }, { passive: true });

    this.startSlideTimer();
  }

  goToSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const segments = document.querySelectorAll('.slider-progress-segment');
    if (slides.length === 0) return;

    // Loop through 0, 1, 2, 3 and return back to 0
    this.currentSlideIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === this.currentSlideIndex);
    });

    segments.forEach((seg, idx) => {
      seg.classList.toggle('active', idx === this.currentSlideIndex);
      seg.classList.toggle('completed', idx < this.currentSlideIndex);

      // Re-trigger animation on active fill bar
      const fill = seg.querySelector('.slider-progress-fill');
      if (fill && idx === this.currentSlideIndex) {
        fill.style.animation = 'none';
        void fill.offsetWidth; // Trigger reflow
        fill.style.animation = '';
      }
    });

    this.startSlideTimer();
  }

  startSlideTimer() {
    this.pauseSlideTimer();
    this.slideInterval = setInterval(() => {
      this.goToSlide(this.currentSlideIndex + 1);
    }, this.slideDuration);
  }

  pauseSlideTimer() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  // Language & RTL / LTR
  applyLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) lang = 'en';
    this.currentLanguage = lang;
    localStorage.setItem('tvquran_lang', lang);
    document.documentElement.lang = lang;
    const direction = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.body.dir = direction;

    // Update translations
    const dict = window.TRANSLATIONS[lang] || window.TRANSLATIONS.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) el.placeholder = dict[key];
    });

    // The button announces the next language in the requested loop.
    const currentIndex = this.supportedLanguages.indexOf(lang);
    const nextLanguage = this.supportedLanguages[(currentIndex + 1) % this.supportedLanguages.length];
    const languageNames = { en: 'English', ur: 'اردو', fr: 'Français', no: 'Norsk' };
    const langBtnText = document.getElementById('langBtnText');
    if (langBtnText) {
      langBtnText.textContent = languageNames[nextLanguage];
      const button = langBtnText.closest('button');
      if (button) button.title = `Switch to ${languageNames[nextLanguage]}`;
    }

    document.title = `NQuran | ${this.t('hero_title')}`;
    this.renderAllViews();
    if (this.mushaf) {
      this.mushaf.populateSurahSelector();
      this.mushaf.renderSurah(this.mushaf.currentSurahId);
    }
    if (this.player && this.player.currentTrack) this.player.updateTrackMetaUI(this.player.currentTrack);
  }

  toggleLanguage() {
    const currentIndex = this.supportedLanguages.indexOf(this.currentLanguage);
    this.applyLanguage(this.supportedLanguages[(currentIndex + 1) % this.supportedLanguages.length]);
  }

  t(key) {
    const dict = window.TRANSLATIONS[this.currentLanguage] || window.TRANSLATIONS.en;
    return dict[key] || window.TRANSLATIONS.en[key] || key;
  }

  content(item, field) {
    if (!item) return '';
    if (this.currentLanguage === 'ur' && item[`${field}_ur`]) return item[`${field}_ur`];
    return item[`${field}_en`] || item[`${field}_ar`] || item[field] || '';
  }

  surahName(surah) {
    return this.currentLanguage === 'ur' ? surah.name_ar : surah.name_en;
  }

  reciterName(reciter) {
    return this.currentLanguage === 'ur' ? reciter.name_ar : reciter.name_en;
  }

  reciterRiwayah(reciter) {
    return this.currentLanguage === 'ur' ? reciter.riwayah_ar : reciter.riwayah_en;
  }

  surahType(type) {
    return this.t(type === 'Meccan' ? 'type_meccan' : 'type_medinan');
  }

  // Theme Management
  applyTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('tvquran_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      if (theme === 'emerald') themeIcon.className = 'fa fa-leaf';
      else if (theme === 'light') themeIcon.className = 'fa fa-sun-o';
      else themeIcon.className = 'fa fa-moon-o';
    }
  }

  cycleTheme() {
    const themes = ['dark', 'emerald', 'light'];
    const nextIdx = (themes.indexOf(this.currentTheme) + 1) % themes.length;
    this.applyTheme(themes[nextIdx]);
  }

  // View Navigation
  initNavigation() {
    const navButtons = document.querySelectorAll('[data-view-target]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const viewId = btn.getAttribute('data-view-target');
        this.switchView(viewId);
      });
    });
  }

  switchView(viewId) {
    this.currentView = viewId;
    
    // Update active tab buttons
    document.querySelectorAll('[data-view-target]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view-target') === viewId);
    });

    // Update visible view section
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${viewId}`);
    if (targetSection) {
      targetSection.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (viewId === 'favorites') {
      this.renderFavoritesView();
    }
  }

  // Render All Content Grids
  renderAllViews() {
    this.renderHomeTrending();
    this.renderHomeEmotional();
    this.renderRecitersGrid();
    this.renderSurahsGrid();
    this.renderCollectionsGrid();
    this.renderUrduLecturesGrid();
  }

  // 1. Home View Renderers
  renderHomeTrending() {
    const container = document.getElementById('homeTrendingReciters');
    if (!container) return;
    const topReciters = window.TVQURAN_DATA.reciters.slice(0, 6);

    container.innerHTML = topReciters.map(r => `
      <div class="reciter-card" onclick="window.tvquranApp.openReciterProfile('${r.id}')">
        <div class="reciter-card-top">
          <img src="${r.avatar}" alt="${this.reciterName(r)}" class="reciter-avatar" loading="lazy">
          <div class="reciter-info">
            <h4>${this.reciterName(r)}</h4>
            <span class="reciter-riwayah">${this.reciterRiwayah(r)}</span>
          </div>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.8rem; line-height: 1.5;">
          ${this.content(r, 'bio')}
        </p>
        <div class="reciter-stats">
          <span><i class="fa fa-microphone"></i> ${r.total_recitations} ${this.t('recitations_count')}</span>
          <span><i class="fa fa-headphones"></i> ${r.total_listens}</span>
        </div>
      </div>
    `).join('');
  }

  renderHomeEmotional() {
    const container = document.getElementById('homePopularRecitations');
    if (!container) return;
    const emotionalCollection = window.TVQURAN_DATA.collections[0];

    container.innerHTML = emotionalCollection.tracks.map(t => `
      <div class="track-card">
        <div class="track-top">
          <button class="track-play-trigger" onclick='window.tvquranPlayer.playTrack(${JSON.stringify(t)})'>
            <i class="fa fa-play"></i>
          </button>
          <div class="track-details" style="flex:1;">
            <h4>${this.content(t, 'title')}</h4>
            <p class="track-reciter">${this.content(t, 'reciter')}</p>
          </div>
        </div>
        <div class="track-footer">
          <span><i class="fa fa-headphones"></i> ${t.listens} ${this.t('listens')}</span>
          <div class="track-actions-bar">
            <a href="${t.url}" download class="btn-icon-sm" title="${this.t('download_mp3')}">
              <i class="fa fa-download"></i>
            </a>
            <button class="btn-icon-sm" onclick='window.tvquranApp.openShareModal(${JSON.stringify(t)})' title="${this.t('share')}">
              <i class="fa fa-share-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 2. Reciters Catalog
  renderRecitersGrid(filterLetter = null, filterRiwayah = null) {
    const container = document.getElementById('recitersCatalogGrid');
    if (!container) return;

    let reciters = window.TVQURAN_DATA.reciters;
    if (filterLetter && filterLetter !== 'all') {
      reciters = reciters.filter(r => r.letter.toUpperCase() === filterLetter.toUpperCase());
    }
    if (filterRiwayah && filterRiwayah !== 'all') {
      reciters = reciters.filter(r => r.riwayah_en.toLowerCase().includes(filterRiwayah.toLowerCase()) || r.riwayah_ar.includes(filterRiwayah));
    }

    container.innerHTML = reciters.map(r => `
      <div class="reciter-card" onclick="window.tvquranApp.openReciterProfile('${r.id}')">
        <div class="reciter-card-top">
          <img src="${r.avatar}" alt="${this.reciterName(r)}" class="reciter-avatar" loading="lazy">
          <div class="reciter-info">
            <h4>${this.reciterName(r)}</h4>
            <span class="reciter-riwayah">${this.reciterRiwayah(r)}</span>
          </div>
        </div>
        <div class="reciter-stats">
          <span><i class="fa fa-file-audio-o"></i> ${r.total_recitations} ${this.t('surahs')}</span>
          <span><i class="fa fa-play"></i> ${r.total_listens}</span>
        </div>
      </div>
    `).join('');
  }

  // 3. Surahs Catalog (114 Surahs)
  renderSurahsGrid(searchQuery = '') {
    const container = document.getElementById('allSurahsGrid');
    if (!container) return;

    let surahs = window.TVQURAN_DATA.surahs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      surahs = surahs.filter(s => 
        s.name_ar.includes(q) ||
        s.name_en.toLowerCase().includes(q) ||
        s.translation_en.toLowerCase().includes(q) ||
        String(s.id) === q
      );
    }

    container.innerHTML = surahs.map(s => `
      <div class="surah-card">
        <div class="surah-left">
          <div class="surah-number-badge">${s.id}</div>
          <div class="surah-title-meta">
            <h4>${this.surahName(s)}</h4>
            <p>${s.verses} ${this.t('verses_count')} • ${this.surahType(s.type)}</p>
          </div>
        </div>
        <div class="surah-right">
          <span class="surah-arabic-title">${s.name_ar}</span>
          <div class="surah-actions">
            <button class="btn-icon-sm" onclick="window.tvquranApp.playSurahWithCurrentReciter(${s.id})" title="${this.t('listen')}">
              <i class="fa fa-play"></i>
            </button>
            <button class="btn-icon-sm" onclick="window.tvquranApp.openMushafSurah(${s.id})" title="${this.t('read_mushaf')}">
              <i class="fa fa-book"></i>
            </button>
            <button class="btn-icon-sm" onclick="window.tvquranApp.shareSurahWithCurrentReciter(${s.id}, event)" title="${this.t('share')}">
              <i class="fa fa-share-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 4. Curated Collections Grid
  renderCollectionsGrid(category = 'all') {
    const container = document.getElementById('collectionsTracksGrid');
    if (!container) return;

    let collections = window.TVQURAN_DATA.collections;
    if (category !== 'all') {
      collections = collections.filter(c => c.category === category);
    }

    let allTracks = [];
    collections.forEach(col => {
      col.tracks.forEach(tr => {
        allTracks.push({ ...tr, badge: this.content(col, 'badge'), color: col.color });
      });
    });

    container.innerHTML = allTracks.map(t => `
      <div class="track-card">
        <div class="track-top">
          <button class="track-play-trigger" style="background: linear-gradient(135deg, ${t.color || 'var(--accent-emerald)'}, var(--accent-emerald-dark));" onclick='window.tvquranPlayer.playTrack(${JSON.stringify(t)})'>
            <i class="fa fa-play"></i>
          </button>
          <div class="track-details" style="flex:1;">
            <h4>${this.content(t, 'title')}</h4>
            <p class="track-reciter">${this.content(t, 'reciter')}</p>
          </div>
        </div>
        <div class="track-footer">
          <span style="color: ${t.color || 'var(--accent-gold)'}; font-weight:700;">${t.badge}</span>
          <div class="track-actions-bar">
            <a href="${t.url}" download class="btn-icon-sm" title="${this.t('download_mp3')}">
              <i class="fa fa-download"></i>
            </a>
            <button class="btn-icon-sm" onclick='window.tvquranApp.openShareModal(${JSON.stringify(t)})' title="${this.t('share')}">
              <i class="fa fa-share-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 5. Urdu Lectures Grid (Ustadha Iffat Maqbool - NQ International)
  renderUrduLecturesGrid() {
    const container = document.getElementById('urduLecturesGrid');
    if (!container) return;
    const lectures = window.TVQURAN_DATA.urdu_lectures || [];

    container.innerHTML = lectures.map(l => {
      const isFav = this.player ? this.player.isFavorite(l) : false;
      return `
      <div class="urdu-lecture-card">
        <div class="urdu-lecture-thumb">
          <img src="${l.cover}" alt="${this.content(l, 'title')}" loading="lazy">
          <span class="urdu-lecture-category">${l.category}</span>
          <div class="urdu-play-overlay" onclick="window.tvquranApp.playUrduLecture('${l.id}')">
            <div class="urdu-play-btn-circle">
              <i class="fa fa-play"></i>
            </div>
          </div>
        </div>
        <div class="urdu-lecture-body">
          <div>
            <h4>${this.content(l, 'title')}</h4>
            <div class="urdu-lecture-speaker">
              <i class="fa fa-user-circle-o"></i> <span>${this.content(l, 'reciter')}</span>
            </div>
            <p class="urdu-lecture-desc">${this.content(l, 'description')}</p>
          </div>
          <div class="urdu-lecture-footer">
            <div class="urdu-lecture-stats">
              <span><i class="fa fa-clock-o"></i> ${l.duration}</span>
              <span><i class="fa fa-headphones"></i> ${l.listens}</span>
            </div>
            <div class="urdu-lecture-actions">
              <button class="btn-icon-sm" onclick="window.tvquranApp.playUrduLecture('${l.id}')" title="${this.t('play')}"><i class="fa fa-play"></i></button>
              <button class="btn-icon-sm ${isFav ? 'active' : ''}" onclick="window.tvquranApp.toggleFavoriteUrdu('${l.id}', event)" title="${this.t('save_favorite')}">
                <i class="fa ${isFav ? 'fa-heart' : 'fa-heart-o'}" style="${isFav ? 'color: #ef4444;' : ''}"></i>
              </button>
              <button class="btn-icon-sm" onclick="window.tvquranApp.openShareModalById('${l.id}')" title="${this.t('share')}"><i class="fa fa-share-alt"></i></button>
              <a href="${l.url || l.audio_url}" download class="btn-icon-sm" title="${this.t('download')}"><i class="fa fa-download"></i></a>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('');
  }

  playUrduLecture(lectureId) {
    const lectures = window.TVQURAN_DATA.urdu_lectures || [];
    const lecture = lectures.find(l => l.id === lectureId) || lectures[0];
    if (!lecture) return;
    this.player.playTrack(lecture, lectures);
  }

  toggleFavoriteUrdu(lectureId, event) {
    if (event) {
      event.stopPropagation();
    }
    const lecture = (window.TVQURAN_DATA.urdu_lectures || []).find(l => l.id === lectureId);
    if (!lecture) return;
    this.player.toggleFavorite(lecture);
  }

  openShareModalById(id) {
    const lecture = (window.TVQURAN_DATA.urdu_lectures || []).find(l => l.id === id);
    if (lecture) {
      this.openShareModal(lecture);
    }
  }

  // 6. Favorites & History
  renderFavoritesView() {
    const container = document.getElementById('favoritesTracksGrid');
    if (!container) return;
    const favs = this.player.favorites;

    if (favs.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <i class="fa fa-heart-o" style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent-emerald);"></i>
          <p style="font-size: 1.1rem;">${this.t('no_favorites')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = favs.map(t => `
      <div class="track-card">
        <div class="track-top">
          <button class="track-play-trigger" onclick='window.tvquranPlayer.playTrack(${JSON.stringify(t).replace(/'/g, "&#39;")})'>
            <i class="fa fa-play"></i>
          </button>
          <div class="track-details" style="flex:1;">
            <h4>${this.content(t, 'title')}</h4>
            <p class="track-reciter">${this.content(t, 'reciter')}</p>
          </div>
        </div>
        <div class="track-footer">
          <button class="btn-icon-sm" onclick='window.tvquranPlayer.toggleFavorite(${JSON.stringify(t).replace(/'/g, "&#39;")})' title="${this.t('remove_favorite')}">
            <i class="fa fa-heart" style="color:#ef4444;"></i>
          </button>
          <div class="track-actions-bar">
            <a href="${t.url || t.audio_url}" download class="btn-icon-sm" title="${this.t('download')}"><i class="fa fa-download"></i></a>
            <button class="btn-icon-sm" onclick='window.tvquranApp.openShareModal(${JSON.stringify(t).replace(/'/g, "&#39;")})' title="${this.t('share')}"><i class="fa fa-share-alt"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Play Helpers
  playSurahWithCurrentReciter(surahId) {
    this.player.playSurah(this.currentReciterId, surahId);
  }

  playLiveRadio(radio) {
    const track = {
      id: `live-${radio.id}`,
      title_ar: radio.title_ar,
      title_en: radio.title_en,
      title_ur: radio.title_ur,
      reciter_ur: this.t('live_stream'),
      reciter_ar: this.t('live_stream'),
      reciter_en: '24/7 Live Broadcast',
      url: radio.stream_url,
      cover: radio.cover
    };
    this.player.playTrack(track);
  }

  openMushafSurah(surahId) {
    this.switchView('surahs');
    this.mushaf.renderSurah(surahId);
    const container = document.getElementById('mushafReaderContainer');
    if (container) container.scrollIntoView({ behavior: 'smooth' });
  }

  // Reciter Profile Modal
  openReciterProfile(reciterId) {
    this.currentReciterId = reciterId;
    const reciter = window.TVQURAN_DATA.reciters.find(r => r.id === reciterId);
    if (!reciter) return;

    const modal = document.getElementById('reciterProfileModal');
    const nameEl = document.getElementById('reciterModalName');
    const riwayahEl = document.getElementById('reciterModalRiwayah');
    const avatarEl = document.getElementById('reciterModalAvatar');
    const bioEl = document.getElementById('reciterModalBio');
    const surahsListEl = document.getElementById('reciterModalSurahsList');

    if (nameEl) nameEl.textContent = this.reciterName(reciter);
    if (riwayahEl) riwayahEl.textContent = this.reciterRiwayah(reciter);
    if (avatarEl) avatarEl.src = reciter.avatar;
    if (bioEl) bioEl.textContent = this.content(reciter, 'bio');

    if (surahsListEl) {
      surahsListEl.innerHTML = window.TVQURAN_DATA.surahs.map(s => `
        <div class="search-item" onclick="window.tvquranApp.playSurahAndCloseModal('${reciter.id}', ${s.id})">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <span class="verse-number-pill" style="width:28px;height:28px;font-size:0.75rem;">${s.id}</span>
            <div>
              <strong>${this.surahName(s)}</strong>
              <div style="font-size:0.75rem;color:var(--text-muted);">${s.verses} ${this.t('verses_count')} • ${this.surahType(s.type)}</div>
            </div>
          </div>
          <div style="display:flex;gap:0.35rem;align-items:center;">
            <button class="btn-icon-sm" onclick="window.tvquranApp.shareSurahByReciter('${reciter.id}', ${s.id}, event)" title="${this.t('share')}"><i class="fa fa-share-alt"></i></button>
            <button class="btn-icon-sm" title="${this.t('listen')}"><i class="fa fa-play"></i></button>
          </div>
        </div>
      `).join('');
    }

    if (modal) modal.showModal();
  }

  playSurahAndCloseModal(reciterId, surahId) {
    this.player.playSurah(reciterId, surahId);
    const modal = document.getElementById('reciterProfileModal');
    if (modal) modal.close();
  }

  // Modals & Dialogs Handling
  initModals() {
    // Search Dialog
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('globalSearchInput');
    const searchTrigger = document.getElementById('searchTriggerBtn');
    const searchResults = document.getElementById('globalSearchResults');

    if (searchTrigger && searchModal) {
      searchTrigger.addEventListener('click', () => {
        searchModal.showModal();
        if (searchInput) searchInput.focus();
      });
    }

    if (searchInput && searchResults) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (!q) {
          searchResults.innerHTML = '';
          return;
        }
        // Search in Surahs
        const matchSurahs = window.TVQURAN_DATA.surahs.filter(s => 
          s.name_ar.includes(q) || s.name_en.toLowerCase().includes(q) || String(s.id) === q
        ).slice(0, 5);

        // Search in Reciters
        const matchReciters = window.TVQURAN_DATA.reciters.filter(r =>
          r.name_ar.includes(q) || r.name_en.toLowerCase().includes(q)
        ).slice(0, 4);

        // Search in Urdu Lectures
        const matchUrdu = (window.TVQURAN_DATA.urdu_lectures || []).filter(l =>
          l.title_ar.includes(q) || l.title_en.toLowerCase().includes(q) || (l.title_ur && l.title_ur.includes(q))
        ).slice(0, 4);

        let resultsHtml = '';
        if (matchReciters.length > 0) {
          resultsHtml += `<div style="font-size:0.8rem;font-weight:700;color:var(--accent-emerald);margin:0.5rem 0;">${this.t('reciters')}</div>`;
          resultsHtml += matchReciters.map(r => `
            <div class="search-item" onclick="window.tvquranApp.openReciterProfile('${r.id}'); document.getElementById('searchModal').close();">
              <div style="display:flex;align-items:center;gap:0.75rem;">
                <img src="${r.avatar}" style="width:30px;height:30px;border-radius:50%;">
                <span>${this.reciterName(r)}</span>
              </div>
              <i class="fa fa-angle-left"></i>
            </div>
          `).join('');
        }

        if (matchSurahs.length > 0) {
          resultsHtml += `<div style="font-size:0.8rem;font-weight:700;color:var(--accent-gold);margin:0.8rem 0 0.5rem;">${this.t('surahs')}</div>`;
          resultsHtml += matchSurahs.map(s => `
            <div class="search-item" onclick="window.tvquranApp.playSurahWithCurrentReciter(${s.id}); document.getElementById('searchModal').close();">
              <span>${s.id}. ${this.surahName(s)}</span>
              <div style="display:flex;gap:0.35rem;align-items:center;">
                <button class="btn-icon-sm" onclick="event.stopPropagation(); window.tvquranApp.shareSurahWithCurrentReciter(${s.id});" title="${this.t('share')}"><i class="fa fa-share-alt"></i></button>
                <button class="btn-icon-sm" title="${this.t('listen')}"><i class="fa fa-play"></i></button>
              </div>
            </div>
          `).join('');
        }

        if (matchUrdu.length > 0) {
          resultsHtml += `<div style="font-size:0.8rem;font-weight:700;color:#38bdf8;margin:0.8rem 0 0.5rem;">${this.t('urdu_lectures')}</div>`;
          resultsHtml += matchUrdu.map(l => `
            <div class="search-item" onclick='window.tvquranPlayer.playTrack(${JSON.stringify(l).replace(/'/g, "&#39;")}); document.getElementById("searchModal").close();'>
              <span><i class="fa fa-graduation-cap" style="color:var(--accent-gold);margin-left:5px;"></i> ${this.content(l, 'title')}</span>
              <div style="display:flex;gap:0.35rem;align-items:center;">
                <button class="btn-icon-sm" onclick="event.stopPropagation(); window.tvquranApp.openShareModalById('${l.id}');" title="${this.t('share')}"><i class="fa fa-share-alt"></i></button>
                <button class="btn-icon-sm" title="${this.t('play')}"><i class="fa fa-play"></i></button>
              </div>
            </div>
          `).join('');
        }

        if (!matchReciters.length && !matchSurahs.length && !matchUrdu.length) {
          resultsHtml = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">${this.t('no_search_results')}</div>`;
        }

        searchResults.innerHTML = resultsHtml;
      });
    }

    // Close Dialogs when clicking close button or backdrop
    document.querySelectorAll('dialog').forEach(diag => {
      diag.querySelectorAll('.dialog-close-btn').forEach(btn => {
        btn.addEventListener('click', () => diag.close());
      });
      diag.addEventListener('click', (e) => {
        const rect = diag.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
          && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
          diag.close();
        }
      });
    });

    // Sleep Timer Modal
    const timerBtn = document.getElementById('playerTimerBtn');
    const timerModal = document.getElementById('sleepTimerModal');
    if (timerBtn && timerModal) {
      timerBtn.addEventListener('click', () => timerModal.showModal());
    }

    // Support Modal
    const supportBtns = document.querySelectorAll('.btn-support-pill, [data-open-support]');
    const supportModal = document.getElementById('supportModal');
    if (supportModal) {
      supportBtns.forEach(b => b.addEventListener('click', () => supportModal.showModal()));
    }
  }

  // Surah Sharing Helpers
  shareSurahWithCurrentReciter(surahId, event) {
    if (event) event.stopPropagation();
    this.shareSurahByReciter(this.currentReciterId || 'idris-abkar', surahId, event);
  }

  shareSurahByReciter(reciterId, surahId, event) {
    if (event) event.stopPropagation();
    const surahNum = Number(surahId);
    const surah = window.TVQURAN_DATA.surahs.find(s => s.id === surahNum) || window.TVQURAN_DATA.surahs[0];
    const reciter = window.TVQURAN_DATA.reciters.find(r => r.id === reciterId) || window.TVQURAN_DATA.reciters[0];
    const url = window.TVQURAN_DATA.getSurahAudioUrl(reciter.id, surah.id);

    const track = {
      id: `surah-${reciter.id}-${surah.id}`,
      title_ar: `سورة ${surah.name_ar}`,
      title_en: `Surah ${surah.name_en}`,
      reciter_ar: reciter.name_ar,
      reciter_en: reciter.name_en,
      surah_id: surah.id,
      reciter_id: reciter.id,
      url: url,
      audio_url: url,
      cover: reciter.avatar
    };

    this.openShareModal(track);
  }

  // Share & Embed Modal
  openShareModal(track = null) {
    const targetTrack = track || this.player.currentTrack || {
      id: 'surah-idris-abkar-6',
      title_ar: 'سورة الأنعام',
      title_en: 'Surah Al-An\'am',
      reciter_ar: 'إدريس أبكر',
      reciter_en: 'Idris Abkar',
      url: 'https://server6.mp3quran.net/abkr/006.mp3'
    };

    const modal = document.getElementById('shareModal');
    const urlInput = document.getElementById('shareDirectUrlInput');
    const embedInput = document.getElementById('shareEmbedCodeInput');
    const titleEl = document.getElementById('shareModalTrackTitle');
    
    const isAr = this.currentLanguage === 'ar';
    const trackTitle = this.content(targetTrack, 'title') || (isAr ? targetTrack.title_ar : targetTrack.title_en) || 'NQuran';
    const trackReciter = this.content(targetTrack, 'reciter') || (isAr ? targetTrack.reciter_ar : targetTrack.reciter_en) || '';
    const trackUrl = targetTrack.url || targetTrack.audio_url || window.location.href;
    const embedCode = `<iframe src="https://tvquran.pages.dev/embed?track=${encodeURIComponent(targetTrack.id || trackUrl)}" width="100%" height="220" frameborder="0" allow="autoplay" allowtransparency="true"></iframe>`;

    if (titleEl) {
      titleEl.textContent = trackReciter ? `${trackTitle} - ${trackReciter}` : trackTitle;
    }
    if (urlInput) urlInput.value = trackUrl;
    if (embedInput) embedInput.value = embedCode;

    this.currentSharingTrack = {
      title: trackReciter ? `${trackTitle} - ${trackReciter}` : trackTitle,
      url: trackUrl
    };

    if (modal) modal.showModal();
  }

  shareToWhatsApp() {
    if (!this.currentSharingTrack) return;
    const text = encodeURIComponent(`استمع إلى: ${this.currentSharingTrack.title}\n${this.currentSharingTrack.url}\nعبر منصة NQuran`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  shareToTelegram() {
    if (!this.currentSharingTrack) return;
    const text = encodeURIComponent(this.currentSharingTrack.title);
    const url = encodeURIComponent(this.currentSharingTrack.url);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  }

  shareToTwitter() {
    if (!this.currentSharingTrack) return;
    const text = encodeURIComponent(`استمع إلى ${this.currentSharingTrack.title} عبر منصة NQuran\n${this.currentSharingTrack.url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  shareNative() {
    if (navigator.share && this.currentSharingTrack) {
      navigator.share({
        title: this.currentSharingTrack.title,
        text: `استمع إلى ${this.currentSharingTrack.title} - NQuran`,
        url: this.currentSharingTrack.url
      }).catch(err => console.log('Share dismissed or cancelled', err));
    } else {
      this.copyInputVal('shareDirectUrlInput');
    }
  }

  copyInputVal(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        alert(this.t('copied_link'));
      });
    }
  }

  // Keyboard Shortcuts (Ctrl+K, Space to play/pause)
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K / Cmd+K -> Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const modal = document.getElementById('searchModal');
        if (modal) {
          modal.showModal();
          const input = document.getElementById('globalSearchInput');
          if (input) input.focus();
        }
      }
      // Space to toggle play (when not focused on input)
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        this.player.togglePlay();
      }
    });
  }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new TVQuranApp();
});
