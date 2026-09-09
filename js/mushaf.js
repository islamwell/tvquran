/**
 * tvQuran.com Interactive Digital Mushaf & Quran Reader
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
    
    this.initEvents();
  }

  init() {
    this.populateSurahSelector();
    this.renderSurah(this.currentSurahId);
  }

  initEvents() {
    if (this.surahSelect) {
      this.surahSelect.addEventListener('change', (e) => {
        this.renderSurah(parseInt(e.target.value));
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

  renderSurah(surahId) {
    this.currentSurahId = surahId;
    const surahMeta = window.TVQURAN_DATA.surahs.find(s => s.id === surahId) || window.TVQURAN_DATA.surahs[0];
    const app = window.tvquranApp;

    if (this.surahSelect) this.surahSelect.value = surahId;
    if (this.surahOrnamentTitle) {
      this.surahOrnamentTitle.textContent = app.surahName(surahMeta);
    }

    // Check if we have sample verses data in mushaf_samples
    const sample = window.TVQURAN_DATA.mushaf_samples[surahId];
    let versesHtml = '';

    if (sample && sample.verses) {
      versesHtml = sample.verses.map(v => `
        <article class="verse-block" id="verse-${surahId}-${v.ayah}">
          <div class="verse-top-bar">
            <span class="verse-number-pill">${v.ayah}</span>
            <div class="verse-actions-strip">
              <button class="verse-action-btn btn-play-verse" onclick="window.tvquranMushaf.playVerse(${surahId}, ${v.ayah})">
                <i class="fa fa-play"></i> <span>${app.t('play')}</span>
              </button>
              <button class="verse-action-btn btn-tafsir-toggle" onclick="window.tvquranMushaf.toggleTafsir(${surahId}, ${v.ayah})">
                <i class="fa fa-book"></i> <span>${app.t('tafsir')}</span>
              </button>
              <button class="verse-action-btn btn-copy-verse" onclick="window.tvquranMushaf.copyVerse('${v.text_ar}', '${surahMeta.name_ar}', ${v.ayah})" title="نسخ الآية">
                <i class="fa fa-copy"></i>
              </button>
              <button class="verse-action-btn btn-share-verse" onclick="window.tvquranMushaf.shareVerse(${surahId}, ${v.ayah}, '${v.text_ar}', '${surahMeta.name_ar}')" title="${app.t('share')}">
                <i class="fa fa-share-alt"></i>
              </button>
            </div>
          </div>
          <p class="verse-arabic-text" style="font-size: ${this.fontSize}px;">${v.text_ar}</p>
          <p class="verse-translation-text">${v.text_en}</p>
          <div class="verse-tafsir-drawer" id="tafsir-${surahId}-${v.ayah}">
            <strong>${app.t('exegesis_heading')}</strong>
            <p>${v.tafsir_ar}</p>
          </div>
        </article>
      `).join('');
    } else {
      // Generated placeholder layout for surahs without pre-loaded sample ayaat
      versesHtml = `
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

    if (this.versesWrapper) {
      this.versesWrapper.innerHTML = versesHtml;
    }
  }

  playVerse(surahId, ayah) {
    if (this.player) {
      this.player.playSurah(window.tvquranApp.currentReciterId || 'idris-abkar', surahId);
      // Highlight the verse
      document.querySelectorAll('.verse-block').forEach(el => el.classList.remove('active-playing'));
      const activeEl = document.getElementById(`verse-${surahId}-${ayah}`);
      if (activeEl) activeEl.classList.add('active-playing');
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
      alert(window.tvquranApp.t('copy_verse_success'));
    });
  }

  updateFontSizes() {
    document.querySelectorAll('.verse-arabic-text').forEach(el => {
      el.style.fontSize = `${this.fontSize}px`;
    });
  }
}

window.TVQuranMushaf = TVQuranMushaf;
