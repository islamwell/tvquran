/**
 * tvQuran.com Main Application Controller
 */

class TVQuranApp {
  constructor() {
    this.currentLanguage = localStorage.getItem('tvquran_lang') || 'ar';
    this.currentTheme = localStorage.getItem('tvquran_theme') || 'dark';
    this.currentReciterId = 'alafasy';
    this.currentView = 'home';
    this.currentCollectionCategory = 'all';

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
    
    // Initial Render
    this.renderAllViews();
    this.mushaf.init();
  }

  // Language & RTL / LTR
  applyLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('tvquran_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update translations
    const dict = window.TRANSLATIONS[lang] || window.TRANSLATIONS.ar;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) el.placeholder = dict[key];
    });

    // Update Language Toggle Button Text
    const langBtnText = document.getElementById('langBtnText');
    if (langBtnText) {
      langBtnText.textContent = lang === 'ar' ? 'English' : 'العربية';
    }

    this.renderAllViews();
  }

  toggleLanguage() {
    const newLang = this.currentLanguage === 'ar' ? 'en' : 'ar';
    this.applyLanguage(newLang);
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
    this.renderLiveStreamsGrid();
  }

  // 1. Home View Renderers
  renderHomeTrending() {
    const container = document.getElementById('homeTrendingReciters');
    if (!container) return;
    const isAr = this.currentLanguage === 'ar';
    const topReciters = window.TVQURAN_DATA.reciters.slice(0, 6);

    container.innerHTML = topReciters.map(r => `
      <div class="reciter-card" onclick="window.tvquranApp.openReciterProfile('${r.id}')">
        <div class="reciter-card-top">
          <img src="${r.avatar}" alt="${isAr ? r.name_ar : r.name_en}" class="reciter-avatar" loading="lazy">
          <div class="reciter-info">
            <h4>${isAr ? r.name_ar : r.name_en}</h4>
            <span class="reciter-riwayah">${isAr ? r.riwayah_ar : r.riwayah_en}</span>
          </div>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.8rem; line-height: 1.5;">
          ${isAr ? r.bio_ar : r.bio_en}
        </p>
        <div class="reciter-stats">
          <span><i class="fa fa-microphone"></i> ${r.total_recitations} ${isAr ? 'تلاوة' : 'Recitations'}</span>
          <span><i class="fa fa-headphones"></i> ${r.total_listens}</span>
        </div>
      </div>
    `).join('');
  }

  renderHomeEmotional() {
    const container = document.getElementById('homePopularRecitations');
    if (!container) return;
    const isAr = this.currentLanguage === 'ar';
    const emotionalCollection = window.TVQURAN_DATA.collections[0];

    container.innerHTML = emotionalCollection.tracks.map(t => `
      <div class="track-card">
        <div class="track-top">
          <button class="track-play-trigger" onclick='window.tvquranPlayer.playTrack(${JSON.stringify(t)})'>
            <i class="fa fa-play"></i>
          </button>
          <div class="track-details" style="flex:1;">
            <h4>${isAr ? t.title_ar : t.title_en}</h4>
            <p class="track-reciter">${isAr ? t.reciter_ar : t.reciter_en}</p>
          </div>
        </div>
        <div class="track-footer">
          <span><i class="fa fa-headphones"></i> ${t.listens} ${isAr ? 'استماع' : 'listens'}</span>
          <div class="track-actions-bar">
            <a href="${t.url}" download class="btn-icon-sm" title="${isAr ? 'تحميل MP3' : 'Download MP3'}">
              <i class="fa fa-download"></i>
            </a>
            <button class="btn-icon-sm" onclick='window.tvquranApp.openShareModal(${JSON.stringify(t)})' title="${isAr ? 'مشاركة' : 'Share'}">
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
    const isAr = this.currentLanguage === 'ar';

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
          <img src="${r.avatar}" alt="${isAr ? r.name_ar : r.name_en}" class="reciter-avatar" loading="lazy">
          <div class="reciter-info">
            <h4>${isAr ? r.name_ar : r.name_en}</h4>
            <span class="reciter-riwayah">${isAr ? r.riwayah_ar : r.riwayah_en}</span>
          </div>
        </div>
        <div class="reciter-stats">
          <span><i class="fa fa-file-audio-o"></i> ${r.total_recitations} ${isAr ? 'سورة' : 'Surahs'}</span>
          <span><i class="fa fa-play"></i> ${r.total_listens}</span>
        </div>
      </div>
    `).join('');
  }

  // 3. Surahs Catalog (114 Surahs)
  renderSurahsGrid(searchQuery = '') {
    const container = document.getElementById('allSurahsGrid');
    if (!container) return;
    const isAr = this.currentLanguage === 'ar';

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
            <h4>${isAr ? s.name_ar : s.name_en}</h4>
            <p>${s.verses} ${isAr ? 'آيات' : 'verses'} • ${isAr ? s.type === 'Meccan' ? 'مكية' : 'مدنية' : s.type}</p>
          </div>
        </div>
        <div class="surah-right">
          <span class="surah-arabic-title">${s.name_ar}</span>
          <div class="surah-actions">
            <button class="btn-icon-sm" onclick="window.tvquranApp.playSurahWithCurrentReciter(${s.id})" title="${isAr ? 'استماع' : 'Listen'}">
              <i class="fa fa-play"></i>
            </button>
            <button class="btn-icon-sm" onclick="window.tvquranApp.openMushafSurah(${s.id})" title="${isAr ? 'قراءة المصحف' : 'Read Mushaf'}">
              <i class="fa fa-book"></i>
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
    const isAr = this.currentLanguage === 'ar';

    let collections = window.TVQURAN_DATA.collections;
    if (category !== 'all') {
      collections = collections.filter(c => c.category === category);
    }

    let allTracks = [];
    collections.forEach(col => {
      col.tracks.forEach(tr => {
        allTracks.push({ ...tr, badge: isAr ? col.badge_ar : col.badge_en, color: col.color });
      });
    });

    container.innerHTML = allTracks.map(t => `
      <div class="track-card">
        <div class="track-top">
          <button class="track-play-trigger" style="background: linear-gradient(135deg, ${t.color || 'var(--accent-emerald)'}, var(--accent-emerald-dark));" onclick='window.tvquranPlayer.playTrack(${JSON.stringify(t)})'>
            <i class="fa fa-play"></i>
          </button>
          <div class="track-details" style="flex:1;">
            <h4>${isAr ? t.title_ar : t.title_en}</h4>
            <p class="track-reciter">${isAr ? t.reciter_ar : t.reciter_en}</p>
          </div>
        </div>
        <div class="track-footer">
          <span style="color: ${t.color || 'var(--accent-gold)'}; font-weight:700;">${t.badge}</span>
          <div class="track-actions-bar">
            <a href="${t.url}" download class="btn-icon-sm" title="${isAr ? 'تحميل MP3' : 'Download MP3'}">
              <i class="fa fa-download"></i>
            </a>
            <button class="btn-icon-sm" onclick='window.tvquranApp.openShareModal(${JSON.stringify(t)})' title="${isAr ? 'مشاركة' : 'Share'}">
              <i class="fa fa-share-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 5. Live Streams Grid
  renderLiveStreamsGrid() {
    const container = document.getElementById('liveStreamsGrid');
    if (!container) return;
    const isAr = this.currentLanguage === 'ar';

    container.innerHTML = window.TVQURAN_DATA.live_streams.map(ls => `
      <div class="live-stream-card">
        <div class="live-media-wrapper">
          ${ls.type === 'video' ? `
            <iframe src="${ls.embed_url}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          ` : `
            <img src="${ls.cover}" alt="${isAr ? ls.title_ar : ls.title_en}">
          `}
          <span class="live-badge-overlay">
            <span class="live-badge-dot"></span> ${ls.badge}
          </span>
        </div>
        <div class="live-card-body">
          <h4>${isAr ? ls.title_ar : ls.title_en}</h4>
          <p>${isAr ? ls.subtitle_ar : ls.subtitle_en}</p>
          ${ls.type === 'audio' ? `
            <button class="btn-primary" style="width: 100%; justify-content: center;" onclick='window.tvquranApp.playLiveRadio(${JSON.stringify(ls)})'>
              <i class="fa fa-play"></i> <span>${isAr ? 'استماع للبث المباشر' : 'Listen Live'}</span>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  // 6. Favorites & History
  renderFavoritesView() {
    const container = document.getElementById('favoritesTracksGrid');
    if (!container) return;
    const isAr = this.currentLanguage === 'ar';
    const favs = this.player.favorites;

    if (favs.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <i class="fa fa-heart-o" style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent-emerald);"></i>
          <p style="font-size: 1.1rem;">${isAr ? window.TRANSLATIONS.ar.no_favorites : window.TRANSLATIONS.en.no_favorites}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = favs.map(t => `
      <div class="track-card">
        <div class="track-top">
          <button class="track-play-trigger" onclick='window.tvquranPlayer.playTrack(${JSON.stringify(t)})'>
            <i class="fa fa-play"></i>
          </button>
          <div class="track-details" style="flex:1;">
            <h4>${isAr ? t.title_ar : t.title_en}</h4>
            <p class="track-reciter">${isAr ? t.reciter_ar : t.reciter_en}</p>
          </div>
        </div>
        <div class="track-footer">
          <span><i class="fa fa-heart" style="color:#ef4444;"></i> ${isAr ? 'في المفضلة' : 'Favorite'}</span>
          <div class="track-actions-bar">
            <a href="${t.url}" download class="btn-icon-sm"><i class="fa fa-download"></i></a>
            <button class="btn-icon-sm" onclick='window.tvquranApp.openShareModal(${JSON.stringify(t)})'><i class="fa fa-share-alt"></i></button>
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
    const isAr = this.currentLanguage === 'ar';
    const track = {
      id: `live-${radio.id}`,
      title_ar: radio.title_ar,
      title_en: radio.title_en,
      reciter_ar: isAr ? 'بث مباشر 24/7' : '24/7 Live Stream',
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
    const isAr = this.currentLanguage === 'ar';

    const modal = document.getElementById('reciterProfileModal');
    const nameEl = document.getElementById('reciterModalName');
    const riwayahEl = document.getElementById('reciterModalRiwayah');
    const avatarEl = document.getElementById('reciterModalAvatar');
    const bioEl = document.getElementById('reciterModalBio');
    const surahsListEl = document.getElementById('reciterModalSurahsList');

    if (nameEl) nameEl.textContent = isAr ? reciter.name_ar : reciter.name_en;
    if (riwayahEl) riwayahEl.textContent = isAr ? reciter.riwayah_ar : reciter.riwayah_en;
    if (avatarEl) avatarEl.src = reciter.avatar;
    if (bioEl) bioEl.textContent = isAr ? reciter.bio_ar : reciter.bio_en;

    if (surahsListEl) {
      surahsListEl.innerHTML = window.TVQURAN_DATA.surahs.map(s => `
        <div class="search-item" onclick="window.tvquranApp.playSurahAndCloseModal('${reciter.id}', ${s.id})">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <span class="verse-number-pill" style="width:28px;height:28px;font-size:0.75rem;">${s.id}</span>
            <div>
              <strong>${isAr ? s.name_ar : s.name_en}</strong>
              <div style="font-size:0.75rem;color:var(--text-muted);">${s.verses} ${isAr ? 'آيات' : 'verses'} • ${isAr ? s.type === 'Meccan' ? 'مكية' : 'مدنية' : s.type}</div>
            </div>
          </div>
          <button class="btn-icon-sm"><i class="fa fa-play"></i></button>
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
        const isAr = this.currentLanguage === 'ar';
        
        // Search in Surahs
        const matchSurahs = window.TVQURAN_DATA.surahs.filter(s => 
          s.name_ar.includes(q) || s.name_en.toLowerCase().includes(q) || String(s.id) === q
        ).slice(0, 5);

        // Search in Reciters
        const matchReciters = window.TVQURAN_DATA.reciters.filter(r =>
          r.name_ar.includes(q) || r.name_en.toLowerCase().includes(q)
        ).slice(0, 4);

        let resultsHtml = '';
        if (matchReciters.length > 0) {
          resultsHtml += `<div style="font-size:0.8rem;font-weight:700;color:var(--accent-emerald);margin:0.5rem 0;">${isAr ? 'القراء' : 'Reciters'}</div>`;
          resultsHtml += matchReciters.map(r => `
            <div class="search-item" onclick="window.tvquranApp.openReciterProfile('${r.id}'); document.getElementById('searchModal').close();">
              <div style="display:flex;align-items:center;gap:0.75rem;">
                <img src="${r.avatar}" style="width:30px;height:30px;border-radius:50%;">
                <span>${isAr ? r.name_ar : r.name_en}</span>
              </div>
              <i class="fa fa-angle-left"></i>
            </div>
          `).join('');
        }

        if (matchSurahs.length > 0) {
          resultsHtml += `<div style="font-size:0.8rem;font-weight:700;color:var(--accent-gold);margin:0.8rem 0 0.5rem;">${isAr ? 'السور' : 'Surahs'}</div>`;
          resultsHtml += matchSurahs.map(s => `
            <div class="search-item" onclick="window.tvquranApp.playSurahWithCurrentReciter(${s.id}); document.getElementById('searchModal').close();">
              <span>${s.id}. ${isAr ? s.name_ar : s.name_en}</span>
              <button class="btn-icon-sm"><i class="fa fa-play"></i></button>
            </div>
          `).join('');
        }

        if (!matchReciters.length && !matchSurahs.length) {
          resultsHtml = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">${isAr ? 'لا توجد نتائج' : 'No results found'}</div>`;
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

  // Share & Embed Modal
  openShareModal(track) {
    const modal = document.getElementById('shareModal');
    const urlInput = document.getElementById('shareDirectUrlInput');
    const embedInput = document.getElementById('shareEmbedCodeInput');
    
    const trackUrl = track.url || window.location.href;
    const embedCode = `<iframe src="https://tvquran.com/embed?track=${encodeURIComponent(track.id || track.url)}" width="100%" height="220" frameborder="0" allow="autoplay" allowtransparency="true"></iframe>`;

    if (urlInput) urlInput.value = trackUrl;
    if (embedInput) embedInput.value = embedCode;
    if (modal) modal.showModal();
  }

  copyInputVal(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        alert(this.currentLanguage === 'ar' ? 'تم نسخ الرابط بنجاح!' : 'Copied to clipboard!');
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
