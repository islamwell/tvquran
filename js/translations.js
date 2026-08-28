/**
 * tvQuran.com Bilingual Translations (English & Arabic)
 */

const TRANSLATIONS = {
  ar: {
    app_title: "NQuran",
    app_subtitle: "بوابتك العصرية للاستماع إلى تلاوات القرآن الكريم بأصوات مشاهير القراء ودروس التفسير بجودة عالية",
    
    // Navigation
    nav_home: "الرئيسية",
    nav_reciters: "القراء",
    nav_surahs: "المصحف",
    nav_collections: "المختارات",
    nav_urdu: "أردو",
    nav_favorites: "المفضلة",
    reciter_surahs_heading: "سور القرآن الكريم",
    
    // Actions & Buttons
    search_placeholder: "ابحث عن قارئ، سورة، أو محاضرة... (اضغط Ctrl+K)",
    quick_search: "بحث...",
    listen_now: "استمع الآن",
    browse_all: "عرض الكل",
    download_mp3: "تحميل MP3",
    share: "مشاركة",
    embed_code: "كود التضمين",
    report_issue: "إبلاغ عن خطأ",
    support_btn: "ادعم",
    support_us: "ادعم الموقع ❤️",
    play_all: "تشغيل الكل",
    pause: "إيقاف مؤقت",
    play: "تشغيل",
    resume: "متابعة",
    repeat_off: "إيقاف التكرار",
    repeat_one: "تكرار التلاوة",
    repeat_all: "تكرار القائمة",
    shuffle: "تشغيل عشوائي",
    speed: "سرعة القراءة",
    sleep_timer: "مؤقت النوم",
    close: "إغلاق",
    copy: "نسخ",
    copied: "تم النسخ بنجاح!",
    view_profile: "عرض تلاوات القارئ",
    read_mushaf: "قراءة المصحف",
    open_tafsir: "التفسير الميسر",
    tafsir: "التفسير",
    translation: "الترجمة",
    visit_nq: "زيارة nq-international.com",
    play_first_lecture: "تشغيل الدرس الأول",
    listen_lecture: "استماع للمحاضرة",
    
    // Headings & Sections
    hero_title: "استمع إلى القرآن الكريم بسكينة",
    hero_subtitle: "تلاوات قرآنية خاشعة ومصاحف كاملة بأصوات نخبة من كبار قراء العالم الإسلامي",
    daily_ayah_title: "آية اليوم المباركة",
    trending_reciters: "مشاهير القراء",
    popular_recitations: "تلاوات مختارة وخاشعة",
    quick_categories: "الأقسام الرئيسية",
    urdu_lectures_title: "محاضرات وتفسير القرآن بالأردية",
    urdu_lectures_subtitle: "سلسلة المحاضرات والدروس الإيمانية المختارة للأستاذة عفت مقبول - مؤسسة نور القرآن العالمية (NQ International)",
    speaker_name: "الأستاذة عفت مقبول",
    top_urdu_lectures: "أفضل 10 محاضرات ودروس تفسير للأستاذة عفت مقبول",
    live_radio_title: "الإذاعات والبث المباشر",
    all_surahs_title: "فهرس سور القرآن الكريم (114 سورة)",
    reciters_catalog: "دليل القراء والمصاحف المرتلة",
    collections_title: "المختارات القرآنية والتسجيلات النادرة",
    favorites_title: "قائمتي المفضلة وسجل الاستماع",
    
    // Categories
    cat_all: "الكل",
    cat_beautiful: "تلاوات خاشعة",
    cat_ruqyah: "الرقية الشرعية",
    cat_dhikr: "أذكار وأدعية",
    cat_rare: "تلاوات نادرة",
    cat_adhan: "الأذان والتكبير",
    cat_children: "تلاوات براعم",
    
    // Surah types & metadata
    type_meccan: "مكية",
    type_medinan: "مدنية",
    verses_count: "آياتها",
    juzz: "الجزء",
    page: "صفحة",
    recitations_count: "تلاوة",
    listens: "استماع",
    likes: "إعجاب",
    
    // Themes & Settings
    theme_dark: "الوضع الليلي المخملي",
    theme_emerald: "الزمردي الملكي",
    theme_light: "وضع النور النهاري",
    select_reciter: "اختر القارئ",
    font_size: "حجم الخط",
    audio_quality: "جودة الصوت",
    auto_next: "تشغيل السورة التالية تلقائياً",
    
    // Empty states
    no_favorites: "لم تقم بإضافة أي تلاوات إلى المفضلة بعد. اضغط على أيقونة القلب في أي تلاوة لحفظها هنا!",
    no_search_results: "لم يتم العثور على نتائج مطابقة لكلمة البحث.",
    
    // Footer
    footer_about: "موقع NQuran (nquran.com) هو منصة إسلامية رائدة غير ربحية تهدف إلى إيصال القرآن الكريم وتلاواته الخاشعة ودروس التفسير بالأردية والعربية إلى كل مسلم ومسلمة حول العالم بأحدث التقنيات وأعلى جودة.",
    footer_rights: "جميع الحقوق محفوظة لموقع NQuran © 2008-2026",
    footer_version_prefix: "الإصدار",
    
    // Modal Titles
    modal_search_title: "البحث الشامل في NQuran",
    modal_share_title: "مشاركة التلاوة أو تضمينها",
    modal_timer_title: "ضبط مؤقت النوم",
    modal_reciter_title: "تلاوات القارئ",
    modal_support_title: "المساهمة في دعم موقع القرآن الكريم"
  },
  
  en: {
    app_title: "NQuran",
    app_subtitle: "Your modern gateway to listening to high-quality Quran recitations and Urdu Tafseer lectures by Ustadha Iffat Maqbool",
    
    // Navigation
    nav_home: "Home",
    nav_reciters: "Reciters",
    nav_surahs: "Mushaf",
    nav_collections: "Collections",
    nav_urdu: "Urdu",
    nav_favorites: "Favorites",
    reciter_surahs_heading: "Quran Surahs",
    
    // Actions & Buttons
    search_placeholder: "Search for a reciter, surah, or lecture... (Press Ctrl+K)",
    quick_search: "Search...",
    listen_now: "Listen Now",
    browse_all: "Browse All",
    download_mp3: "Download MP3",
    share: "Share",
    embed_code: "Embed Code",
    report_issue: "Report an Issue",
    support_btn: "Support",
    support_us: "Support ❤️",
    play_all: "Play All",
    pause: "Pause",
    play: "Play",
    resume: "Resume",
    repeat_off: "Repeat Off",
    repeat_one: "Repeat Track",
    repeat_all: "Repeat Playlist",
    shuffle: "Shuffle",
    speed: "Speed",
    sleep_timer: "Sleep Timer",
    close: "Close",
    copy: "Copy",
    copied: "Copied successfully!",
    view_profile: "View Reciter Recitations",
    read_mushaf: "Read Mushaf",
    open_tafsir: "Open Exegesis (Tafsir)",
    tafsir: "Tafsir",
    translation: "Translation",
    visit_nq: "Visit nq-international.com",
    play_first_lecture: "Play First Lecture",
    listen_lecture: "Listen Lecture",
    
    // Headings & Sections
    hero_title: "Listen to the Quran with Tranquility",
    hero_subtitle: "Experience soothing Quran recitations and complete Mushaf audio catalogs by the world's most renowned Qaris.",
    daily_ayah_title: "Verse of the Day",
    trending_reciters: "Featured Reciters",
    popular_recitations: "Curated Heart-Touching Recitations",
    quick_categories: "Featured Categories",
    urdu_lectures_title: "Urdu Quran Lectures & Tafseer",
    urdu_lectures_subtitle: "Curated Urdu Quran Tafseer & spiritual lectures by Ustadha Iffat Maqbool (Founder of NurulQuran - nq-international.com)",
    speaker_name: "Ustadha Iffat Maqbool",
    top_urdu_lectures: "Top 10 Curated Urdu Lectures (Ustadha Iffat Maqbool)",
    live_radio_title: "Live Radios & Broadcasts",
    all_surahs_title: "Quran Surah Index (114 Surahs)",
    reciters_catalog: "Reciters Catalog & Complete Recitations",
    collections_title: "Curated Collections & Rare Recordings",
    favorites_title: "My Favorites & Listening History",
    
    // Categories
    cat_all: "All",
    cat_beautiful: "Heart-Touching",
    cat_ruqyah: "Sharia Ruqyah",
    cat_dhikr: "Daily Dhikr & Dua",
    cat_rare: "Rare Recitations",
    cat_adhan: "Adhan & Takbeer",
    cat_children: "Young Reciters",
    
    // Surah types & metadata
    type_meccan: "Meccan",
    type_medinan: "Medinan",
    verses_count: "Verses",
    juzz: "Juzz",
    page: "Page",
    recitations_count: "Recitations",
    listens: "Listens",
    likes: "Likes",
    
    // Themes & Settings
    theme_dark: "Velvet Dark",
    theme_emerald: "Royal Emerald",
    theme_light: "Pure Noor (Light)",
    select_reciter: "Select Reciter",
    font_size: "Font Size",
    audio_quality: "Audio Quality",
    auto_next: "Auto-play Next Surah",
    
    // Empty states
    no_favorites: "You haven't saved any recitations to your favorites yet. Click the heart icon on any track to add it here!",
    no_search_results: "No results found matching your search query.",
    
    // Footer
    footer_about: "tvQuran.com is a leading independent, non-profit digital platform dedicated to making the Holy Quran easily accessible to Muslims worldwide in top-tier audio quality.",
    footer_rights: "All rights reserved for tvQuran.com © 2008-2026",
    footer_version_prefix: "Version",
    
    // Modal Titles
    modal_search_title: "Global Search in tvQuran",
    modal_share_title: "Share or Embed Recitation",
    modal_timer_title: "Set Sleep Timer",
    modal_reciter_title: "Reciter Recitations",
    modal_support_title: "Support tvQuran Platform"
  }
};

window.TRANSLATIONS = TRANSLATIONS;
