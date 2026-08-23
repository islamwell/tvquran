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
    const isAr = (document.documentElement.lang || 'ar') === 'ar';
    this.surahSelect.innerHTML = window.TVQURAN_DATA.surahs.map(s => `
      <option value="${s.id}">
        ${s.id}. ${isAr ? s.name_ar : s.name_en} (${isAr ? s.type === 'Meccan' ? 'مكية' : 'مدنية' : s.type}) - ${s.verses} ${isAr ? 'آيات' : 'verses'}
      </option>
    `).join('');
  }

  renderSurah(surahId) {
    this.currentSurahId = surahId;
    const surahMeta = window.TVQURAN_DATA.surahs.find(s => s.id === surahId) || window.TVQURAN_DATA.surahs[0];
    const isAr = (document.documentElement.lang || 'ar') === 'ar';

    if (this.surahSelect) this.surahSelect.value = surahId;
    if (this.surahOrnamentTitle) {
      this.surahOrnamentTitle.textContent = isAr ? `سُورَةُ ${surahMeta.name_ar}` : `Surah ${surahMeta.name_en}`;
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
                <i class="fa fa-play"></i> <span>${isAr ? 'استماع' : 'Play'}</span>
              </button>
              <button class="verse-action-btn btn-tafsir-toggle" onclick="window.tvquranMushaf.toggleTafsir(${surahId}, ${v.ayah})">
                <i class="fa fa-book"></i> <span>${isAr ? 'التفسير' : 'Tafsir'}</span>
              </button>
              <button class="verse-action-btn btn-copy-verse" onclick="window.tvquranMushaf.copyVerse('${v.text_ar}', '${surahMeta.name_ar}', ${v.ayah})">
                <i class="fa fa-copy"></i>
              </button>
            </div>
          </div>
          <p class="verse-arabic-text" style="font-size: ${this.fontSize}px;">${v.text_ar}</p>
          <p class="verse-translation-text">${v.text_en}</p>
          <div class="verse-tafsir-drawer" id="tafsir-${surahId}-${v.ayah}">
            <strong>${isAr ? 'تفسير الآية:' : 'Exegesis (Tafsir):'}</strong>
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
                <i class="fa fa-play"></i> <span>${isAr ? 'تشغيل التلاوة الكاملة' : 'Play Full Audio'}</span>
              </button>
            </div>
          </div>
          <p class="verse-arabic-text" style="font-size: ${this.fontSize}px;">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ <br>
            ${isAr ? `تتوفر التلاوة الصوتية الكاملة لسورة ${surahMeta.name_ar} بأصوات مشاهير القراء.` : `Full audio recitation for Surah ${surahMeta.name_en} is available.`}
          </p>
          <p class="verse-translation-text">
            ${isAr ? `عدد آيات السورة: ${surahMeta.verses} آية | نوعها: ${surahMeta.type === 'Meccan' ? 'مكية' : 'مدنية'} | الجزء: ${surahMeta.juzz}` : `Total Verses: ${surahMeta.verses} | Revelation: ${surahMeta.type} | Juzz: ${surahMeta.juzz}`}
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
      this.player.playSurah('alafasy', surahId);
      // Highlight the verse
      document.querySelectorAll('.verse-block').forEach(el => el.classList.remove('active-playing'));
      const activeEl = document.getElementById(`verse-${surahId}-${ayah}`);
      if (activeEl) activeEl.classList.add('active-playing');
    }
  }

  toggleTafsir(surahId, ayah) {
    const tafsirDrawer = document.getElementById(`tafsir-${surahId}-${ayah}`);
    if (tafsirDrawer) {
      tafsirDrawer.classList.toggle('active');
    }
  }

  copyVerse(text, surahName, ayah) {
    const formatted = `﴿ ${text} ﴾ [سورة ${surahName}: ${ayah}] - عبر موقع tvQuran.com`;
    navigator.clipboard.writeText(formatted).then(() => {
      alert(document.documentElement.lang === 'ar' ? 'تم نسخ الآية الكريمة بنجاح!' : 'Verse copied to clipboard!');
    });
  }

  updateFontSizes() {
    document.querySelectorAll('.verse-arabic-text').forEach(el => {
      el.style.fontSize = `${this.fontSize}px`;
    });
  }
}

window.TVQuranMushaf = TVQuranMushaf;
