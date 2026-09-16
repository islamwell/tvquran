/**
 * NQuran Interactive Digital Mushaf & Quran Reader
 * With dynamic live API fetcher for all 114 Surahs, localized translations, and synchronized highlighting.
 */

class TVQuranMushaf {
  constructor(player) {
    this.player = player;
    this.currentSurahId = 1;
    this.fontSize = 28; // px
    this.container = document.getElementById('mushafReaderContainer');
    this.surahSelect = document.getElementById('mushafSurahSelect');
    this.btnFontPlus = document.getElementById('btnMushafFontPlus');
    this.btnFontMinus = document.getElementById('btnMushafFontMinus');
    this.versesWrapper = document.getElementById('mushafVersesWrapper');
    this.surahOrnamentTitle = document.getElementById('mushafOrnamentSurahName');
    this.surahCache = {};
    
    this.initEvents();
  }

  init() {
    this.populateSurahSelector();
    this.renderSurah(this.currentSurahId);
  }

  initEvents() {
    if (this.surahSelect) {
      this.surahSelect.addEventListener('change', (e) => {
        this.renderSurah(parseInt(e.target.value, 10));
      });
    }

    if (this.btnFontPlus) {
      this.btnFontPlus.addEventListener('click', () => {
        if (this.fontSize < 44) {
          this.fontSize += 2;
          this.updateFontSizes();
        }
      });
    }

    if (this.btnFontMinus) {
      this.btnFontMinus.addEventListener('click', () => {
        if (this.fontSize > 20) {
          this.fontSize -= 2;
          this.updateFontSizes();
        }
      });
    }
  }

  populateSurahSelector() {
    if (!this.surahSelect) return;
    const app = window.tvquranApp;
    this.surahSelect.innerHTML = window.TVQURAN_DATA.surahs.map(s => `
      <option value="${s.id}">
        ${s.id}. ${app.surahName(s)} (${app.surahType(s.type)}) - ${s.verses} ${app.t('verses_count')}
      </option>
    `).join('');
  }

  async fetchSurahAyahs(surahId) {
    const cacheKey = `nquran_mushaf_surah_${surahId}`;
    if (this.surahCache[surahId]) return this.surahCache[surahId];

    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.surahCache[surahId] = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('LocalStorage read error for surah cache:', e);
    }

    // Live API fetch for Arabic Uthmani, English Sahih, and Urdu Jalandhry
    const url = `https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,en.sahih,ur.jalandhry`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      
      if (data && data.code === 200 && Array.isArray(data.data) && data.data.length >= 3) {
        const uthmaniEd = data.data[0].ayahs;
        const enEd = data.data[1].ayahs;
        const urEd = data.data[2].ayahs;

        const verses = uthmaniEd.map((ayahObj, idx) => ({
          ayah: ayahObj.numberInSurah,
          text_ar: ayahObj.text,
          text_en: enEd[idx] ? enEd[idx].text : '',
          text_ur: urEd[idx] ? urEd[idx].text : '',
          tafsir_ar: `تفسير ميسر للآية ${ayahObj.numberInSurah} من سورة ${data.data[0].name}`
        }));

        this.surahCache[surahId] = verses;
        try {
          localStorage.setItem(cacheKey, JSON.stringify(verses));
        } catch (storageErr) {
          console.warn('Storage quota exceeded, keeping in memory cache:', storageErr);
        }
        return verses;
      }
    } catch (fetchErr) {
      console.warn(`Could not fetch surah ${surahId} from live API:`, fetchErr);
    }

    return null;
  }

  async renderSurah(surahId) {
    this.currentSurahId = surahId;
    const surahMeta = window.TVQURAN_DATA.surahs.find(s => s.id === surahId) || window.TVQURAN_DATA.surahs[0];
    const app = window.tvquranApp;

    if (this.surahSelect) this.surahSelect.value = surahId;
    if (this.surahOrnamentTitle) {
      this.surahOrnamentTitle.textContent = app.surahName(surahMeta);
    }

    // 1. Check local sample data first
    const sample = window.TVQURAN_DATA.mushaf_samples[surahId];
    if (sample && sample.verses && sample.verses.length > 0) {
      this.renderVersesList(sample.verses, surahMeta);
      return;
    }

    // 2. Check memory or localStorage cache
    if (this.surahCache[surahId]) {
      this.renderVersesList(this.surahCache[surahId], surahMeta);
      return;
    }

    // 3. Show Loading Skeletons while fetching
    if (this.versesWrapper) {
      this.versesWrapper.innerHTML = `
        <div style="text-align:center; padding: 1rem; color: var(--text-muted); font-size: 0.95rem;">
          <i class="fa fa-spinner fa-spin" style="color:var(--accent-emerald); margin-inline-end: 0.5rem;"></i>
          <span>${app.t('loading_ayahs')} (${app.surahName(surahMeta)})</span>
        </div>
        <div class="verse-skeleton"></div>
        <div class="verse-skeleton"></div>
        <div class="verse-skeleton"></div>
      `;
    }

    // 4. Fetch dynamically from Quran API
    const fetchedVerses = await this.fetchSurahAyahs(surahId);
    if (this.currentSurahId !== surahId) return; // Ignore if user switched surah during fetch

    if (fetchedVerses && fetchedVerses.length > 0) {
      this.renderVersesList(fetchedVerses, surahMeta);
    } else {
      // Graceful fallback card if offline or API unreachable
      if (this.versesWrapper) {
        this.versesWrapper.innerHTML = `
          <div class="verse-block">
            <div class="verse-top-bar">
              <span class="verse-number-pill">1</span>
              <div class="verse-actions-strip">
                <button class="verse-action-btn" onclick="window.tvquranApp.playSurahWithCurrentReciter(${surahId})">
                  <i class="fa fa-play"></i> <span>${app.t('full_audio')}</span>
                </button>
                <button class="verse-action-btn" onclick="window.tvquranApp.shareSurahWithCurrentReciter(${surahId}, event)" title="${app.t('share')}">
                  <i class="fa fa-share-alt"></i> <span>${app.t('share')}</span>
                </button>
              </div>
            </div>
            <p class="verse-arabic-text" style="font-size: ${this.fontSize}px;">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ <br>
              ${app.t('full_audio_available')} ${app.surahName(surahMeta)}.
            </p>
            <p class="verse-translation-text">
              ${app.t('total_verses_label')}: ${surahMeta.verses} | ${app.t('revelation')}: ${app.surahType(surahMeta.type)} | ${app.t('juzz')}: ${surahMeta.juzz}
            </p>
          </div>
        `;
      }
    }
  }

  renderVersesList(verses, surahMeta) {
    if (!this.versesWrapper) return;
    const app = window.tvquranApp;
    const isUrdu = app.currentLanguage === 'ur';

    const versesHtml = verses.map(v => {
      const translationText = isUrdu && v.text_ur ? v.text_ur : (v.text_en || v.text_ur || '');
      const secondaryTranslation = isUrdu && v.text_en ? `<p class="verse-translation-text" style="font-size:0.8rem; color:var(--text-muted); margin-top:0.3rem;">${v.text_en}</p>` : '';

      return `
        <article class="verse-block" id="verse-${this.currentSurahId}-${v.ayah}">
          <div class="verse-top-bar">
            <span class="verse-number-pill">${v.ayah}</span>
            <div class="verse-actions-strip">
              <button class="verse-action-btn btn-play-verse" onclick="window.tvquranMushaf.playVerse(${this.currentSurahId}, ${v.ayah})">
                <i class="fa fa-play"></i> <span>${app.t('play')}</span>
              </button>
              <button class="verse-action-btn btn-tafsir-toggle" onclick="window.tvquranMushaf.toggleTafsir(${this.currentSurahId}, ${v.ayah})">
                <i class="fa fa-book"></i> <span>${app.t('tafsir')}</span>
              </button>
              <button class="verse-action-btn btn-copy-verse" onclick="window.tvquranMushaf.copyVerse('${v.text_ar.replace(/'/g, "\\'")}', '${surahMeta.name_ar}', ${v.ayah})" title="نسخ الآية">
                <i class="fa fa-copy"></i>
              </button>
              <button class="verse-action-btn btn-share-verse" onclick="window.tvquranMushaf.shareVerse(${this.currentSurahId}, ${v.ayah}, '${v.text_ar.replace(/'/g, "\\'")}', '${surahMeta.name_ar}')" title="${app.t('share')}">
                <i class="fa fa-share-alt"></i>
              </button>
            </div>
          </div>
          <p class="verse-arabic-text" style="font-size: ${this.fontSize}px;">${v.text_ar}</p>
          <p class="verse-translation-text">${translationText}</p>
          ${secondaryTranslation}
          <div class="verse-tafsir-drawer" id="tafsir-${this.currentSurahId}-${v.ayah}">
            <strong>${app.t('exegesis_heading')}</strong>
            <p>${v.tafsir_ar || (v.text_ur ? `تفسير وبيان الآية ${v.ayah}: ${v.text_ur}` : 'التفسير متاح في المراجع المعتمدة')}</p>
          </div>
        </article>
      `;
    }).join('');

    this.versesWrapper.innerHTML = versesHtml;
  }

  playVerse(surahId, ayah) {
    if (this.player) {
      this.player.playSurah(window.tvquranApp.currentReciterId || 'idris-abkar', surahId);
      
      // Synchronized auto-scroll & glowing verse highlight
      document.querySelectorAll('.verse-block').forEach(el => el.classList.remove('active-playing'));
      const activeEl = document.getElementById(`verse-${surahId}-${ayah}`);
      if (activeEl) {
        activeEl.classList.add('active-playing');
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  shareVerse(surahId, ayah, text, surahName) {
    const app = window.tvquranApp;
    const track = {
      id: `verse-${surahId}-${ayah}`,
      title_ar: `${surahName} [آية ${ayah}]`,
      title_en: `Surah ${surahName} [Ayah ${ayah}]`,
      reciter_ar: app.t('listen_now'),
      reciter_en: 'Recitation & Tafsir',
      url: window.TVQURAN_DATA.getSurahAudioUrl(app.currentReciterId || 'idris-abkar', surahId)
    };
    app.openShareModal(track);
  }

  toggleTafsir(surahId, ayah) {
    const tafsirDrawer = document.getElementById(`tafsir-${surahId}-${ayah}`);
    if (tafsirDrawer) {
      tafsirDrawer.classList.toggle('active');
    }
  }

  copyVerse(text, surahName, ayah) {
    const formatted = `﴿ ${text} ﴾ [${surahName}: ${ayah}] - عبر موقع NQuran.com`;
    navigator.clipboard.writeText(formatted).then(() => {
      if (window.tvquranApp && typeof window.tvquranApp.showToast === 'function') {
        window.tvquranApp.showToast(window.tvquranApp.t('copy_verse_success'), 'success');
      }
    });
  }

  updateFontSizes() {
    document.querySelectorAll('.verse-arabic-text').forEach(el => {
      el.style.fontSize = `${this.fontSize}px`;
    });
  }
}

window.TVQuranMushaf = TVQuranMushaf;
