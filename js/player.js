/**
 * tvQuran.com Modern Audio Engine & Waveform Visualizer
 */

class TVQuranPlayer {
  constructor() {
    this.audio = new Audio();
    this.currentTrack = null;
    this.queue = [];
    this.queueIndex = 0;
    this.isPlaying = false;
    this.repeatMode = 'all'; // 'off', 'one', 'all'
    this.isShuffle = false;
    this.playbackRate = 1.0;
    this.sleepTimerInterval = null;
    this.sleepTimerSeconds = 0;
    
    // Favorites & History (LocalStorage)
    this.favorites = this.readStoredArray('tvquran_favorites');
    this.history = this.readStoredArray('tvquran_history');

    this.initElements();
    this.initEvents();
    this.initVisualizer();
  }

  readStoredArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn(`Ignoring invalid localStorage value for ${key}:`, error);
      return [];
    }
  }

  localizedTrackValue(track, field) {
    if (window.tvquranApp) return window.tvquranApp.content(track, field);
    return track[`${field}_en`] || track[`${field}_ur`] || track[`${field}_ar`] || '';
  }

  t(key) {
    return window.tvquranApp ? window.tvquranApp.t(key) : (window.TRANSLATIONS.en[key] || key);
  }

  initElements() {
    this.playerBar = document.getElementById('appPlayerBar');
    this.thumbImg = document.getElementById('playerThumb');
    this.titleEl = document.getElementById('playerTitle');
    this.subtitleEl = document.getElementById('playerSubtitle');
    this.btnPlayMain = document.getElementById('btnPlayMain');
    this.btnPlayIcon = document.getElementById('btnPlayIcon');
    this.btnPrev = document.getElementById('btnPrev');
    this.btnNext = document.getElementById('btnNext');
    this.btnRepeat = document.getElementById('btnRepeat');
    this.btnShuffle = document.getElementById('btnShuffle');
    this.btnFav = document.getElementById('playerFavBtn');
    
    this.scrubber = document.getElementById('playerScrubber');
    this.progressFill = document.getElementById('playerProgressFill');
    this.progressBuffered = document.getElementById('playerProgressBuffered');
    this.progressThumb = document.getElementById('playerProgressThumb');
    this.currentTimeEl = document.getElementById('playerCurrentTime');
    this.durationTimeEl = document.getElementById('playerDurationTime');
    
    this.volumeSlider = document.getElementById('playerVolumeSlider');
    this.volumeBtn = document.getElementById('playerVolumeBtn');
    this.speedBtn = document.getElementById('playerSpeedBtn');
    this.speedMenu = document.getElementById('speedMenuPopover');
    this.timerBtn = document.getElementById('playerTimerBtn');
    this.fullscreenBtn = document.getElementById('playerFullscreenBtn');
    
    // Fullscreen View Elements
    this.fullscreenModal = document.getElementById('fullscreenPlayerModal');
    this.fsCloseBtn = document.getElementById('fsCloseBtn');
    this.fsCover = document.getElementById('fsCover');
    this.fsSurahName = document.getElementById('fsSurahName');
    this.fsReciterName = document.getElementById('fsReciterName');
    this.fsPlayBtn = document.getElementById('fsPlayBtn');
    this.fsPlayIcon = document.getElementById('fsPlayIcon');
    this.fsScrubber = document.getElementById('fsScrubber');
    this.fsProgressFill = document.getElementById('fsProgressFill');
    this.fsCurrentTime = document.getElementById('fsCurrentTime');
    this.fsDurationTime = document.getElementById('fsDurationTime');
    
    // Canvas visualizer
    this.canvas = document.getElementById('playerCanvas');
    this.fsCanvas = document.getElementById('fsCanvas');
  }

  initEvents() {
    // Audio element events
    this.audio.addEventListener('play', () => this.onPlayStateChange(true));
    this.audio.addEventListener('pause', () => this.onPlayStateChange(false));
    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('progress', () => this.onProgress());
    this.audio.addEventListener('ended', () => this.onEnded());
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.durationTimeEl) this.durationTimeEl.textContent = this.formatTime(this.audio.duration);
      if (this.fsDurationTime) this.fsDurationTime.textContent = this.formatTime(this.audio.duration);
    });

    // Control button clicks
    if (this.btnPlayMain) this.btnPlayMain.addEventListener('click', () => this.togglePlay());
    if (this.fsPlayBtn) this.fsPlayBtn.addEventListener('click', () => this.togglePlay());
    if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.prevTrack());
    if (this.btnNext) this.btnNext.addEventListener('click', () => this.nextTrack());
    if (this.btnRepeat) this.btnRepeat.addEventListener('click', () => this.cycleRepeatMode());
    if (this.btnShuffle) this.btnShuffle.addEventListener('click', () => this.toggleShuffle());
    if (this.btnFav) this.btnFav.addEventListener('click', () => this.toggleFavoriteCurrent());

    // Seeking
    if (this.scrubber) {
      this.scrubber.addEventListener('click', (e) => this.seek(e, this.scrubber));
    }
    if (this.fsScrubber) {
      this.fsScrubber.addEventListener('click', (e) => this.seek(e, this.fsScrubber));
    }

    // Volume
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        this.audio.volume = parseFloat(e.target.value);
        this.updateVolumeIcon();
      });
    }
    if (this.volumeBtn) {
      this.volumeBtn.addEventListener('click', () => {
        this.audio.muted = !this.audio.muted;
        this.updateVolumeIcon();
      });
    }

    // Speed Controls
    if (this.speedBtn && this.speedMenu) {
      this.speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.speedMenu.classList.toggle('active');
      });
      document.addEventListener('click', () => this.speedMenu.classList.remove('active'));
      
      this.speedMenu.querySelectorAll('.speed-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const rate = parseFloat(e.target.dataset.rate || 1.0);
          this.setPlaybackRate(rate);
        });
      });
    }

    // Fullscreen view toggle
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => {
        if (this.fullscreenModal) this.fullscreenModal.classList.add('active');
      });
    }
    if (this.fsCloseBtn) {
      this.fsCloseBtn.addEventListener('click', () => {
        if (this.fullscreenModal) this.fullscreenModal.classList.remove('active');
      });
    }
  }

  // Load and play a track
  playTrack(track, queueList = null) {
    if (!track) return;
    track.url = track.url || track.audio_url;
    this.currentTrack = track;
    
    if (queueList && Array.isArray(queueList)) {
      this.queue = queueList.map(t => {
        t.url = t.url || t.audio_url;
        return t;
      });
      this.queueIndex = this.queue.findIndex(t => (t.url || t.audio_url) === track.url || t.id === track.id);
      if (this.queueIndex === -1) this.queueIndex = 0;
    } else if (this.queue.length === 0) {
      this.queue = [track];
      this.queueIndex = 0;
    }

    const targetSrc = track.url || track.audio_url;
    if (this.audio.src !== targetSrc) {
      this.audio.src = targetSrc;
    }
    this.audio.playbackRate = this.playbackRate;
    
    this.updateTrackMetaUI(track);
    this.checkIsFavorite(track);

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Audio playback prevented or waiting for interaction:', err);
      });
    }

    this.addToHistory(track);
    this.updateMediaSession(track);
  }

  // Play Surah by Reciter and Surah Number
  playSurah(reciterId, surahNumber) {
    const surahNum = Number(surahNumber);
    const surah = window.TVQURAN_DATA.surahs.find(s => s.id === surahNum) || window.TVQURAN_DATA.surahs[0];
    const reciter = window.TVQURAN_DATA.reciters.find(r => r.id === reciterId) || window.TVQURAN_DATA.reciters.find(r => r.id === 'idris-abkar') || window.TVQURAN_DATA.reciters[0];
    const url = window.TVQURAN_DATA.getSurahAudioUrl(reciter.id, surah.id);

    const track = {
      id: `surah-${reciter.id}-${surah.id}`,
      title_ar: surah.name_ar,
      title_ur: surah.name_ar,
      title_en: `Surah ${surah.name_en}`,
      reciter_ar: reciter.name_ar,
      reciter_ur: reciter.name_ar,
      reciter_en: reciter.name_en,
      surah_id: surah.id,
      reciter_id: reciter.id,
      url: url,
      audio_url: url,
      cover: reciter.avatar
    };

    // Construct full surah queue for this reciter
    const fullQueue = window.TVQURAN_DATA.surahs.map(s => ({
      id: `surah-${reciter.id}-${s.id}`,
      title_ar: s.name_ar,
      title_ur: s.name_ar,
      title_en: `Surah ${s.name_en}`,
      reciter_ar: reciter.name_ar,
      reciter_ur: reciter.name_ar,
      reciter_en: reciter.name_en,
      surah_id: s.id,
      reciter_id: reciter.id,
      url: window.TVQURAN_DATA.getSurahAudioUrl(reciter.id, s.id),
      audio_url: window.TVQURAN_DATA.getSurahAudioUrl(reciter.id, s.id),
      cover: reciter.avatar
    }));

    this.playTrack(track, fullQueue);
  }

  // Play a random Surah (by specified or current reciter)
  playRandomSurah(reciterId = null) {
    const currentReciter = reciterId || (this.currentTrack ? this.currentTrack.reciter_id : 'idris-abkar') || 'idris-abkar';
    const currentSurahId = this.currentTrack && this.currentTrack.surah_id ? Number(this.currentTrack.surah_id) : 6;
    
    // Pick random surah from 1 to 114 different from current surah
    const allSurahs = window.TVQURAN_DATA.surahs || [];
    const pool = allSurahs.filter(s => s.id !== currentSurahId);
    const chosen = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : allSurahs[Math.floor(Math.random() * allSurahs.length)];
      
    if (chosen) {
      this.playSurah(currentReciter, chosen.id);
    }
  }

  togglePlay() {
    if (!this.currentTrack) {
      // Default track: Surah 6 (Al-An'am) by Idris Abkar
      this.playSurah('idris-abkar', 6);
      return;
    }
    if (this.audio.paused) {
      this.audio.play().catch(e => console.log(e));
    } else {
      this.audio.pause();
    }
  }

  nextTrack() {
    if (this.isAutoRandomNext || this.isShuffle) {
      this.playRandomSurah();
      return;
    }
    if (this.queue.length === 0) {
      this.playRandomSurah();
      return;
    }
    this.queueIndex = (this.queueIndex + 1) % this.queue.length;
    this.playTrack(this.queue[this.queueIndex]);
  }

  prevTrack() {
    if (this.queue.length === 0) return;
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    this.queueIndex = (this.queueIndex - 1 + this.queue.length) % this.queue.length;
    this.playTrack(this.queue[this.queueIndex]);
  }

  onEnded() {
    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      this.audio.play().catch(e => console.warn(e));
    } else if (this.repeatMode === 'all') {
      // Auto-transition to random surah when track ends
      this.playRandomSurah();
    }
  }

  cycleRepeatMode() {
    if (this.repeatMode === 'all') {
      this.repeatMode = 'one';
      if (this.btnRepeat) {
        this.btnRepeat.innerHTML = '<i class="fa fa-repeat"></i><span style="font-size:8px;position:absolute">1</span>';
        this.btnRepeat.classList.add('active');
      }
    } else if (this.repeatMode === 'one') {
      this.repeatMode = 'off';
      if (this.btnRepeat) {
        this.btnRepeat.innerHTML = '<i class="fa fa-repeat"></i>';
        this.btnRepeat.classList.remove('active');
      }
    } else {
      this.repeatMode = 'all';
      if (this.btnRepeat) {
        this.btnRepeat.innerHTML = '<i class="fa fa-repeat"></i>';
        this.btnRepeat.classList.add('active');
      }
    }
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    if (this.btnShuffle) {
      this.btnShuffle.classList.toggle('active', this.isShuffle);
    }
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;
    this.audio.playbackRate = rate;
    if (this.speedBtn) this.speedBtn.textContent = `${rate}x`;
    if (this.speedMenu) {
      this.speedMenu.querySelectorAll('.speed-option-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.dataset.rate) === rate);
      });
    }
  }

  seek(event, element) {
    if (!this.audio.duration) return;
    const rect = element.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    this.audio.currentTime = Math.max(0, Math.min(pos * this.audio.duration, this.audio.duration));
  }

  onTimeUpdate() {
    if (!this.audio.duration) return;
    const progress = (this.audio.currentTime / this.audio.duration) * 100;
    
    if (this.progressFill) this.progressFill.style.width = `${progress}%`;
    if (this.progressThumb) this.progressThumb.style.left = `${progress}%`;
    if (this.currentTimeEl) this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);

    if (this.fsProgressFill) this.fsProgressFill.style.width = `${progress}%`;
    if (this.fsCurrentTime) this.fsCurrentTime.textContent = this.formatTime(this.audio.currentTime);
  }

  onProgress() {
    if (this.audio.buffered.length > 0 && this.audio.duration) {
      const bufferedEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
      const bufferedPercent = (bufferedEnd / this.audio.duration) * 100;
      if (this.progressBuffered) this.progressBuffered.style.width = `${bufferedPercent}%`;
    }
  }

  onPlayStateChange(playing) {
    this.isPlaying = playing;
    if (this.playerBar) this.playerBar.classList.toggle('is-playing', playing);
    
    const iconClass = playing ? 'fa-pause' : 'fa-play';
    if (this.btnPlayIcon) this.btnPlayIcon.className = `fa ${iconClass}`;
    if (this.fsPlayIcon) this.fsPlayIcon.className = `fa ${iconClass}`;
  }

  updateTrackMetaUI(track) {
    const title = this.localizedTrackValue(track, 'title');
    const reciter = this.localizedTrackValue(track, 'reciter');
    
    if (this.titleEl) this.titleEl.textContent = title;
    if (this.subtitleEl) this.subtitleEl.textContent = reciter;
    if (this.thumbImg) this.thumbImg.src = track.cover || 'favicon.svg';

    if (this.fsSurahName) this.fsSurahName.textContent = title;
    if (this.fsReciterName) this.fsReciterName.textContent = reciter;
    if (this.fsCover) this.fsCover.src = track.cover || 'favicon.svg';

    this.checkIsFavorite(track);
  }

  updateVolumeIcon() {
    if (!this.volumeBtn) return;
    const icon = this.volumeBtn.querySelector('i');
    if (!icon) return;

    if (this.audio.muted || this.audio.volume === 0) {
      icon.className = 'fa fa-volume-off';
    } else if (this.audio.volume < 0.5) {
      icon.className = 'fa fa-volume-down';
    } else {
      icon.className = 'fa fa-volume-up';
    }
  }

  // Sleep Timer
  setSleepTimer(minutes) {
    if (this.sleepTimerInterval) clearInterval(this.sleepTimerInterval);
    if (minutes === 0) {
      this.sleepTimerSeconds = 0;
      if (this.timerBtn) this.timerBtn.classList.remove('active');
      return;
    }

    this.sleepTimerSeconds = minutes * 60;
    if (this.timerBtn) this.timerBtn.classList.add('active');

    this.sleepTimerInterval = setInterval(() => {
      this.sleepTimerSeconds--;
      if (this.sleepTimerSeconds <= 0) {
        clearInterval(this.sleepTimerInterval);
        this.audio.pause();
        if (this.timerBtn) this.timerBtn.classList.remove('active');
      }
    }, 1000);
  }

  // Favorites Management
  toggleFavorite(track) {
    if (!track) return;
    track.url = track.url || track.audio_url;
    const trackUrl = track.url;
    const index = this.favorites.findIndex(f => (f.url || f.audio_url) === trackUrl || (track.id && f.id === track.id));
    
    if (index > -1) {
      this.favorites.splice(index, 1);
      if (window.tvquranApp && typeof window.tvquranApp.showToast === 'function') {
        window.tvquranApp.showToast(this.t('favorite_removed'));
      }
    } else {
      this.favorites.unshift(track);
      if (window.tvquranApp && typeof window.tvquranApp.showToast === 'function') {
        window.tvquranApp.showToast(this.t('favorite_added'));
      }
    }
    localStorage.setItem('tvquran_favorites', JSON.stringify(this.favorites));
    
    if (this.currentTrack && (this.currentTrack.id === track.id || (this.currentTrack.url || this.currentTrack.audio_url) === trackUrl)) {
      this.checkIsFavorite(this.currentTrack);
    }
    if (window.tvquranApp && typeof window.tvquranApp.renderFavoritesView === 'function') {
      window.tvquranApp.renderFavoritesView();
    }
    if (window.tvquranApp && typeof window.tvquranApp.renderUrduLecturesGrid === 'function') {
      window.tvquranApp.renderUrduLecturesGrid();
    }
  }

  toggleFavoriteCurrent() {
    if (!this.currentTrack) return;
    this.toggleFavorite(this.currentTrack);
  }

  isFavorite(track) {
    if (!track) return false;
    const trackUrl = track.url || track.audio_url;
    return this.favorites.some(f => (f.url || f.audio_url) === trackUrl || (track.id && f.id === track.id));
  }

  checkIsFavorite(track) {
    if (!this.btnFav || !track) return;
    const isFav = this.isFavorite(track);
    this.btnFav.classList.toggle('active', isFav);
    const icon = this.btnFav.querySelector('i');
    if (icon) icon.className = isFav ? 'fa fa-heart' : 'fa fa-heart-o';
  }

  addToHistory(track) {
    const trackUrl = track.url || track.audio_url;
    this.history = this.history.filter(h => (h.url || h.audio_url) !== trackUrl && (track.id ? h.id !== track.id : true));
    this.history.unshift({ ...track, url: trackUrl, playedAt: new Date().toISOString() });
    if (this.history.length > 50) this.history.pop();
    localStorage.setItem('tvquran_history', JSON.stringify(this.history));
  }

  // MediaSession API
  updateMediaSession(track) {
    if ('mediaSession' in navigator && 'MediaMetadata' in window) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.localizedTrackValue(track, 'title'),
        artist: this.localizedTrackValue(track, 'reciter'),
        album: 'tvQuran.com',
        artwork: [
          { src: track.cover || '/favicon.svg', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
    }
  }

  // Audio Waveform Canvas Animation
  initVisualizer() {
    const draw = () => {
      requestAnimationFrame(draw);
      this.renderCanvasBars(this.canvas);
      this.renderCanvasBars(this.fsCanvas);
    };
    draw();
  }

  renderCanvasBars(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth || 140;
    const h = canvas.height = canvas.offsetHeight || 24;
    ctx.clearRect(0, 0, w, h);

    const barCount = 18;
    const barWidth = w / barCount - 2;
    const isPlaying = this.isPlaying;
    const time = Date.now() / 200;

    for (let i = 0; i < barCount; i++) {
      let barHeight = 4;
      if (isPlaying) {
        barHeight = Math.sin(time + i * 0.45) * (h * 0.4) + (h * 0.45);
      }
      
      const x = i * (barWidth + 2);
      const y = h - barHeight;
      
      const grad = ctx.createLinearGradient(0, y, 0, h);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#f59e0b');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
      ctx.fill();
    }
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

window.TVQuranPlayer = TVQuranPlayer;
