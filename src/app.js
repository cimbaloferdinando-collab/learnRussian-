// ─── App principale ───────────────────────────────────────────────────────────

const KEYS = {
  startDate: 'russo_start_date',
  cardsProgress: 'russo_cards_progress',
  dailyLog: 'russo_daily_log',
  streak: 'russo_streak',
  sessionCheckpoint: 'russo_session_checkpoint',
  phrasesStudied: 'russo_phrases_studied'
};

const TRAVEL_DATE = new Date('2025-08-01');
const TOTAL_DAYS = 65;

// ─── Stato globale ────────────────────────────────────────────────────────────

let APP = {
  startDate: null,
  progress: {},     // SM-2 state per card id
  streak: 0,
  currentPhase: null,
  dayNumber: 1,
  activeTab: 'session',
  sessionActive: false,
  sessionSteps: [],
  sessionStepIndex: 0,
  sessionStats: { cardsReviewed: 0, newCards: 0, correct: 0, total: 0 },
  phrasesStudied: new Set()
};

// ─── Inizializzazione ─────────────────────────────────────────────────────────

function init() {
  TTS.init();

  // Data di inizio
  let startDate = Storage.get(KEYS.startDate);
  if (!startDate) {
    startDate = new Date().toISOString();
    Storage.set(KEYS.startDate, startDate);
  }
  APP.startDate = new Date(startDate);

  // Progressi SM-2
  APP.progress = Storage.get(KEYS.cardsProgress) || {};

  // Streak
  APP.streak = Storage.get(KEYS.streak) || 0;
  updateStreak();

  // Frasi studiate oggi
  const todayKey = new Date().toLocaleDateString('it-IT');
  const phrasesLog = Storage.get(KEYS.phrasesStudied) || {};
  APP.phrasesStudied = new Set(phrasesLog[todayKey] || []);

  // Calcola giorno e fase corrente
  const elapsed = Math.floor((Date.now() - APP.startDate.getTime()) / 86400000);
  APP.dayNumber = Math.min(Math.max(elapsed + 1, 1), TOTAL_DAYS);
  APP.currentPhase = DATA.phases.find(p => {
    const [start, end] = p.days.split('-').map(Number);
    return APP.dayNumber >= start && APP.dayNumber <= end;
  }) || DATA.phases[2];

  renderHeader();
  setupTabs();
  renderAllTabs();
  startSession();
}

// ─── Header / Dashboard ───────────────────────────────────────────────────────

function renderHeader() {
  const stats = SM2.getStats(DATA.allCards, APP.progress);
  const dueCount = SM2.getDueCards(DATA.allCards, APP.progress).length;
  const progressPct = Math.round((APP.dayNumber / TOTAL_DAYS) * 100);

  document.getElementById('day-number').textContent = `Giorno ${APP.dayNumber} di ${TOTAL_DAYS}`;
  document.getElementById('phase-label').textContent = APP.currentPhase.name;
  document.getElementById('streak-count').textContent = APP.streak;
  document.getElementById('due-count').textContent = dueCount;
  document.getElementById('due-badge').style.display = dueCount > 0 ? 'inline-flex' : 'none';
  document.getElementById('progress-bar-fill').style.width = `${progressPct}%`;
  document.getElementById('progress-pct').textContent = `${progressPct}%`;
}

// ─── Streak ───────────────────────────────────────────────────────────────────

function updateStreak() {
  const log = Storage.get(KEYS.dailyLog) || {};
  const today = new Date().toLocaleDateString('it-IT');
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('it-IT');

  if (!log[today]) {
    // Prima apertura di oggi
    if (log[yesterday]) {
      APP.streak = (Storage.get(KEYS.streak) || 0) + 1;
    } else if (Object.keys(log).length === 0) {
      APP.streak = 1;
    } else {
      APP.streak = 1; // streak interrotto
    }
    log[today] = { opened: true, cardsReviewed: 0, phrasesStudied: 0 };
    Storage.set(KEYS.dailyLog, log);
    Storage.set(KEYS.streak, APP.streak);
  } else {
    APP.streak = Storage.get(KEYS.streak) || 1;
  }
}

function logDailyActivity(cardsReviewed = 0, phrasesStudied = 0) {
  const log = Storage.get(KEYS.dailyLog) || {};
  const today = new Date().toLocaleDateString('it-IT');
  if (!log[today]) log[today] = { cardsReviewed: 0, phrasesStudied: 0 };
  log[today].cardsReviewed += cardsReviewed;
  log[today].phrasesStudied += phrasesStudied;
  Storage.set(KEYS.dailyLog, log);
}

// ─── Tab navigation ───────────────────────────────────────────────────────────

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  APP.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.toggle('active', t.id === `tab-${tab}`));
  // Chiudi sessione se si naviga manualmente via tab
  if (tab !== 'session') hideSessionOverlay();
}

// ─── Render di tutti i tab ────────────────────────────────────────────────────

function renderAllTabs() {
  renderPronunciaTab();
  renderFlashcardTab();
  renderFrasiTab();
  renderNomadeTab();
  renderAiutoTab();
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — PRONUNCIA
// ═══════════════════════════════════════════════════════════════════════════════

function renderPronunciaTab() {
  const container = document.getElementById('tab-pronuncia');

  // Suoni difficili
  const soundsHtml = DATA.sounds.map(sound => `
    <div class="sound-card">
      <div class="sound-header">
        <span class="sound-symbol">${sound.symbol}</span>
        <span class="sound-label">${sound.label}</span>
      </div>
      <p class="sound-description">${sound.description}</p>
      <div class="sound-tip">💡 ${sound.tip}</div>
      <div class="sound-examples">
        ${sound.examples.map(ex => `
          <div class="sound-example">
            <span class="ex-ru">${ex.ru}</span>
            <span class="ex-tr">${ex.tr}</span>
            <span class="ex-it">${ex.it}</span>
            <button class="btn-tts btn-tts-sm" onclick="TTS.speakRussian('${ex.ru}', {button: this})">▶</button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Regole d'oro
  const rulesHtml = DATA.rules.map((rule, i) => `
    <div class="rule-card">
      <div class="rule-number">${i + 1}</div>
      <div class="rule-content">
        <h4 class="rule-title">${rule.title}</h4>
        <p class="rule-text">${rule.text}</p>
        <div class="rule-example">${rule.example}</div>
      </div>
    </div>
  `).join('');

  // Parole segnale
  const signalHtml = DATA.signalWords.map(w => `
    <div class="signal-card">
      <div class="signal-ru">${w.ru}</div>
      <div class="signal-tr">${w.tr}</div>
      <div class="signal-it">${w.it}</div>
      <div class="signal-note">${w.note}</div>
      <button class="btn-tts btn-tts-sm" onclick="TTS.speakRussian('${w.ru}', {button: this})">▶ Ascolta</button>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="section-header">
      <h2>Pronuncia</h2>
      <p class="section-subtitle">6 suoni difficili per italiani + 4 regole d'oro</p>
    </div>

    <h3 class="subsection-title">I 6 suoni che fanno la differenza</h3>
    <div class="sounds-grid">${soundsHtml}</div>

    <h3 class="subsection-title">4 regole d'oro</h3>
    <div class="rules-list">${rulesHtml}</div>

    <h3 class="subsection-title">5 parole da riconoscere in cirillico</h3>
    <p class="section-note">Queste scritte le vedrai ovunque — negozi, stazioni, strade.</p>
    <div class="signal-grid">${signalHtml}</div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — FLASHCARD
// ═══════════════════════════════════════════════════════════════════════════════

let flashcardState = {
  activeDeck: null,
  currentCardIndex: 0,
  flipped: false,
  sessionCards: [],
  mode: 'deck-select' // 'deck-select' | 'studying'
};

function renderFlashcardTab() {
  renderDeckSelector();
}

function renderDeckSelector() {
  const container = document.getElementById('tab-flashcard');
  const stats = SM2.getStats(DATA.allCards, APP.progress);
  const due = SM2.getDueCards(DATA.allCards, APP.progress);

  const decksHtml = Object.entries(DATA.decks).map(([id, deck]) => {
    const deckCards = deck.cards;
    const studied = deckCards.filter(c => APP.progress[c.id]).length;
    const dueInDeck = deckCards.filter(c => APP.progress[c.id] && SM2.isDue(APP.progress[c.id])).length;
    const pct = Math.round((studied / deckCards.length) * 100);

    return `
      <button class="deck-card" onclick="startDeckStudy('${id}')">
        <div class="deck-icon">${deck.icon}</div>
        <div class="deck-info">
          <div class="deck-name">${deck.name}</div>
          <div class="deck-stats">${studied}/${deckCards.length} carte studiate</div>
          <div class="deck-progress-bar"><div class="deck-progress-fill" style="width:${pct}%"></div></div>
        </div>
        ${dueInDeck > 0 ? `<div class="deck-due-badge">${dueInDeck}</div>` : ''}
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header">
      <h2>Flashcard</h2>
      <p class="section-subtitle">${stats.due} carte da rivedere oggi · ${stats.newCount} nuove</p>
    </div>

    ${due.length > 0 ? `
      <button class="btn-primary btn-full-width" onclick="startDueCardsStudy()">
        Ripassa le ${due.length} carte in scadenza oggi
      </button>
    ` : '<p class="empty-state">Nessuna carta in scadenza oggi — ottimo!</p>'}

    <h3 class="subsection-title">Mazzi</h3>
    <div class="decks-list">${decksHtml}</div>
  `;
  flashcardState.mode = 'deck-select';
}

function startDueCardsStudy() {
  const due = SM2.getDueCards(DATA.allCards, APP.progress);
  startCardStudySession(due, 'Ripasso del giorno');
}

function startDeckStudy(deckId) {
  const deck = DATA.decks[deckId];
  startCardStudySession(deck.cards, deck.name);
}

function startCardStudySession(cards, title) {
  if (cards.length === 0) {
    alert('Nessuna carta disponibile in questo mazzo!');
    return;
  }
  flashcardState = {
    ...flashcardState,
    activeDeck: title,
    currentCardIndex: 0,
    flipped: false,
    sessionCards: [...cards].sort(() => Math.random() - 0.5),
    mode: 'studying',
    sessionCorrect: 0,
    sessionTotal: 0
  };
  renderFlashcardStudy();
}

function renderFlashcardStudy() {
  const container = document.getElementById('tab-flashcard');
  const { sessionCards, currentCardIndex, activeDeck } = flashcardState;

  if (currentCardIndex >= sessionCards.length) {
    renderFlashcardComplete(container);
    return;
  }

  const card = sessionCards[currentCardIndex];
  const progress = currentCardIndex + 1;
  const total = sessionCards.length;
  const state = APP.progress[card.id];

  container.innerHTML = `
    <div class="fc-header">
      <button class="btn-ghost btn-back" onclick="renderDeckSelector()">← Mazzi</button>
      <span class="fc-progress-label">${activeDeck} · ${progress}/${total}</span>
    </div>
    <div class="fc-progress-bar"><div class="fc-progress-fill" style="width:${(progress/total*100)}%"></div></div>

    <div class="flashcard-container" id="flashcard-container" onclick="flipCard()">
      <div class="flashcard" id="flashcard">
        <div class="flashcard-front">
          <div class="fc-deck-label">${DATA.decks[card.deckId]?.icon || ''} ${card.deckName}</div>
          <div class="fc-transliteration">${card.tr}</div>
          <div class="fc-cyrillic">${card.ru}</div>
          <div class="fc-tap-hint">Tocca per vedere la traduzione</div>
        </div>
        <div class="flashcard-back">
          <div class="fc-deck-label">${DATA.decks[card.deckId]?.icon || ''} ${card.deckName}</div>
          <div class="fc-transliteration">${card.tr}</div>
          <div class="fc-cyrillic">${card.ru}</div>
          <div class="fc-italian">${card.it}</div>
          <div class="fc-context">${card.ctx}</div>
          <button class="btn-tts" onclick="event.stopPropagation(); TTS.speakRussian('${card.ru.replace(/'/g, "\\'")}', {button: this})">▶ Ascolta</button>
        </div>
      </div>
    </div>

    <div class="fc-rating" id="fc-rating" style="display:none">
      <p class="fc-rating-label">Come è andata?</p>
      <div class="fc-rating-buttons">
        <button class="btn-rating btn-wrong" onclick="rateCard(1)">
          <span class="rating-icon">✗</span>
          <span class="rating-label">Non sapevo</span>
        </button>
        <button class="btn-rating btn-medium" onclick="rateCard(3)">
          <span class="rating-icon">~</span>
          <span class="rating-label">Difficile</span>
        </button>
        <button class="btn-rating btn-correct" onclick="rateCard(5)">
          <span class="rating-icon">✓</span>
          <span class="rating-label">Sapevo bene</span>
        </button>
      </div>
    </div>
  `;
  flashcardState.flipped = false;
}

function flipCard() {
  if (flashcardState.flipped) return;
  flashcardState.flipped = true;
  document.getElementById('flashcard').classList.add('flipped');
  document.getElementById('fc-rating').style.display = 'block';
}

function rateCard(rating) {
  const card = flashcardState.sessionCards[flashcardState.currentCardIndex];
  const currentState = APP.progress[card.id] || SM2.defaultCardState();
  const newState = SM2.update(currentState, rating);

  APP.progress[card.id] = newState;
  Storage.set(KEYS.cardsProgress, APP.progress);

  flashcardState.sessionTotal++;
  if (rating >= 3) flashcardState.sessionCorrect++;

  // Aggiorna stats globali sessione
  APP.sessionStats.cardsReviewed++;
  if (!currentState || currentState.isNew) APP.sessionStats.newCards++;
  if (rating >= 3) APP.sessionStats.correct++;
  APP.sessionStats.total++;

  logDailyActivity(1, 0);
  renderHeader();

  flashcardState.currentCardIndex++;
  renderFlashcardStudy();
}

function renderFlashcardComplete(container) {
  const pct = flashcardState.sessionTotal > 0
    ? Math.round((flashcardState.sessionCorrect / flashcardState.sessionTotal) * 100)
    : 0;

  container.innerHTML = `
    <div class="complete-screen mini">
      <div class="check-circle">✓</div>
      <h3>${pct >= 80 ? 'Ottimo lavoro' : pct >= 60 ? 'Ben fatto' : 'Continuiamo domani'}</h3>
      <div class="complete-stats">
        <span>${flashcardState.sessionTotal} carte</span>
        <span>${flashcardState.sessionCorrect} corrette</span>
        <span>${pct}%</span>
      </div>
      <button class="btn-primary" onclick="renderDeckSelector()">Torna ai mazzi</button>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — FRASI DEL GIORNO
// ═══════════════════════════════════════════════════════════════════════════════

function renderFrasiTab() {
  const container = document.getElementById('tab-frasi');
  const phase = APP.currentPhase;
  const phrases = phase.phrases;

  const phrasesHtml = phrases.map(phrase => {
    const isStudied = APP.phrasesStudied.has(phrase.id);
    return `
      <div class="phrase-card ${isStudied ? 'studied' : ''}" id="phrase-${phrase.id}">
        <div class="phrase-header">
          ${isStudied ? '<span class="phrase-done-badge">✓ Studiata</span>' : ''}
        </div>
        <div class="phrase-transliteration">${phrase.tr}</div>
        <div class="phrase-cyrillic">${phrase.ru}</div>
        <div class="phrase-italian">${phrase.it}</div>
        <div class="phrase-context">${phrase.ctx}</div>
        <div class="phrase-actions">
          <button class="btn-tts" onclick="TTS.speakRussian('${phrase.ru.replace(/'/g, "\\'")}', {button: this})">▶ Ascolta</button>
          ${!isStudied ? `<button class="btn-secondary" onclick="markPhraseStudied('${phrase.id}')">Segna come studiata</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const daysLeft = Math.max(0, Math.ceil((TRAVEL_DATE - Date.now()) / 86400000));

  container.innerHTML = `
    <div class="section-header">
      <h2>Frasi del giorno</h2>
      <p class="section-subtitle">${phase.name}</p>
    </div>

    <div class="phase-info">
      <div class="phase-days">Giorni ${phase.days}</div>
      <div class="phase-description">${phase.description}</div>
    </div>

    <div class="travel-countdown">
      <span class="countdown-icon">✈</span>
      <span>Partenza tra <strong>${daysLeft} giorni</strong> — 1 agosto 2025</span>
    </div>

    <div class="phrases-list">${phrasesHtml}</div>

    <div class="phase-nav">
      ${DATA.phases.map(p => `
        <button class="phase-btn ${p.id === phase.id ? 'active' : ''}" onclick="switchPhaseView(${p.id})">
          Fase ${p.id}
        </button>
      `).join('')}
    </div>
  `;
}

function switchPhaseView(phaseId) {
  const phase = DATA.phases.find(p => p.id === phaseId);
  if (!phase) return;
  const savedPhase = APP.currentPhase;
  APP.currentPhase = phase;
  renderFrasiTab();
  APP.currentPhase = savedPhase; // ripristina fase reale
}

function markPhraseStudied(phraseId) {
  APP.phrasesStudied.add(phraseId);
  const todayKey = new Date().toLocaleDateString('it-IT');
  const phrasesLog = Storage.get(KEYS.phrasesStudied) || {};
  phrasesLog[todayKey] = [...APP.phrasesStudied];
  Storage.set(KEYS.phrasesStudied, phrasesLog);
  logDailyActivity(0, 1);

  const card = document.getElementById(`phrase-${phraseId}`);
  if (card) {
    card.classList.add('studied');
    card.querySelector('.phrase-header').innerHTML = '<span class="phrase-done-badge">✓ Studiata</span>';
    const markBtn = card.querySelector('.btn-secondary');
    if (markBtn) markBtn.remove();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — VITA NOMADE
// ═══════════════════════════════════════════════════════════════════════════════

function renderNomadeTab() {
  const container = document.getElementById('tab-nomade');
  const { nomadeSection } = DATA;

  const renderBloccoA = () => nomadeSection.bloccoA.items.map(item => `
    <div class="nomade-item">
      <div class="nomade-item-header">
        <div>
          <div class="nomade-tr">${item.tr}</div>
          <div class="nomade-ru">${item.ru}</div>
        </div>
        <button class="btn-tts btn-tts-nomade" onclick="TTS.speakRussian('${item.ru.replace(/'/g, "\\'")}', {button: this})">▶</button>
      </div>
      <div class="nomade-it">${item.it}</div>
      <div class="nomade-ctx">${item.ctx}</div>
    </div>
  `).join('');

  const renderBloccoB = () => nomadeSection.bloccoB.items.map(item => `
    <div class="nomade-item">
      <div class="nomade-item-header">
        <div>
          <div class="nomade-tr">${item.tr}</div>
          <div class="nomade-ru">${item.ru}</div>
        </div>
        <button class="btn-tts btn-tts-nomade" onclick="TTS.speakRussian('${item.ru.replace(/'/g, "\\'")}', {button: this})">▶</button>
      </div>
      <div class="nomade-it">${item.it}</div>
      <div class="nomade-ctx">${item.ctx}</div>
    </div>
  `).join('');

  const renderBloccoC = () => nomadeSection.bloccoC.items.map(item => `
    <div class="nomade-item kyrgyz-item">
      <div class="nomade-item-header">
        <div>
          <span class="kyrgyz-badge">kirghizo</span>
          <div class="nomade-tr">${item.tr}</div>
          <div class="nomade-ru kyrgyz-script">${item.ky}</div>
        </div>
        <button class="btn-tts btn-tts-nomade" onclick="TTS.speakKyrgyz('${item.tr}', {button: this})" title="Pronuncia approssimativa (ko-KR)">▶</button>
      </div>
      <div class="nomade-it">${item.it}</div>
      <div class="nomade-ctx">${item.ctx}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="nomade-hero">
      <div class="nomade-hero-icon">⛺</div>
      <h2 class="nomade-hero-title">Vita Nomade</h2>
      <p class="nomade-hero-intro">${nomadeSection.intro}</p>
    </div>

    <div class="nomade-section">
      <div class="nomade-section-header">
        <h3>${nomadeSection.bloccoA.title}</h3>
        <p>${nomadeSection.bloccoA.subtitle}</p>
      </div>
      <div class="nomade-items">${renderBloccoA()}</div>
    </div>

    <div class="nomade-section">
      <div class="nomade-section-header">
        <h3>${nomadeSection.bloccoB.title}</h3>
        <p>${nomadeSection.bloccoB.subtitle}</p>
      </div>
      <div class="nomade-items">${renderBloccoB()}</div>
    </div>

    <div class="nomade-section kyrgyz-section">
      <div class="nomade-section-header">
        <h3>${nomadeSection.bloccoC.title}</h3>
        <p class="kyrgyz-warning">${nomadeSection.bloccoC.subtitle}</p>
        <div class="tts-note">⚠️ Audio approssimativo: il kirghizo non è supportato nativamente dai browser. Viene usata una voce di fallback.</div>
      </div>
      <div class="nomade-items">${renderBloccoC()}</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — AIUTO & SUGGERIMENTI
// ═══════════════════════════════════════════════════════════════════════════════

function renderAiutoTab() {
  const container = document.getElementById('tab-aiuto');
  container.innerHTML = `
    <div class="section-header">
      <h2>Aiuto & Suggerimenti</h2>
      <p class="section-subtitle">Guide pratiche per il tuo viaggio in Kirghizistan e Uzbekistan</p>
    </div>
    <div class="accordion">
      ${aiutoAccordionItem('acc1', '🔊 Pronuncia approfondita — i 6 suoni', aiutoPronuncia(), true)}
      ${aiutoAccordionItem('acc2', '💬 Situazioni reali, frase per frase', aiutoSituazioni(), false)}
      ${aiutoAccordionItem('acc3', '🔢 Numeri, prezzi e trattative', aiutoNumeri(), false)}
      ${aiutoAccordionItem('acc4', '🤝 Cultura e galateo', aiutoCultura(), false)}
    </div>
  `;
}

function aiutoAccordionItem(id, title, content, openByDefault) {
  return `
    <div class="accordion-item${openByDefault ? ' open' : ''}" id="${id}">
      <button class="accordion-header" onclick="toggleAccordion(this)" aria-expanded="${openByDefault}">
        <span class="accordion-title">${title}</span>
        <span class="accordion-icon">${openByDefault ? '−' : '+'}</span>
      </button>
      <div class="accordion-body" style="${openByDefault ? '' : 'max-height:0'}">
        <div class="accordion-content">${content}</div>
      </div>
    </div>
  `;
}

function toggleAccordion(btn) {
  const item = btn.closest('.accordion-item');
  const isOpen = item.classList.contains('open');

  // Chiudi tutti
  document.querySelectorAll('#tab-aiuto .accordion-item').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.accordion-body').style.maxHeight = '0';
    i.querySelector('.accordion-icon').textContent = '+';
    i.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
  });

  // Apri quello cliccato se era chiuso
  if (!isOpen) {
    item.classList.add('open');
    const body = item.querySelector('.accordion-body');
    body.style.maxHeight = body.scrollHeight + 'px';
    btn.querySelector('.accordion-icon').textContent = '−';
    btn.setAttribute('aria-expanded', 'true');
  }
}

// ─── Contenuto Sezione 1 — Pronuncia approfondita ────────────────────────────

function aiutoPronuncia() {
  const suoni = [
    {
      simbolo: 'Х', nome: 'KH — il raschio gutturale',
      posizione: 'Solleva la lingua verso il palato morbido — quella zona gommosa che senti toccando il tetto della bocca con la lingua fino in fondo. Tienila quasi a contatto senza toccare. Soffia: l\'aria passa raschiando e produce un suono caldo e gutturale.',
      confronto: 'Identico al "ch" tedesco di <em>Bach</em> o <em>acht</em>. Simile al "ch" scozzese in <em>loch</em>. Se sei del Sud Italia, pensa alla pronuncia napoletana veloce di "non c\'ho" — quel suono rasposo c\'è dentro.',
      errore: 'Sostituirlo con una "c" dura italiana (tipo "casa") o con una semplice "k". "Khorosho" diventa incomprensibile se si dice "Korosho" — sembra un\'altra parola.',
      parole: [
        { ru: 'Хорошо', tr: 'khoroSHO', it: 'Bene / OK' },
        { ru: 'Плохо', tr: 'PLOkho', it: 'Male' },
        { ru: 'Хлеб', tr: 'KHLEB', it: 'Pane' }
      ],
      trucco: 'Immagina di avere un capello in gola e vuoi toglierlo discretamente — quel suono soffocato e raschioso è esattamente KH.'
    },
    {
      simbolo: 'Ш', nome: 'SH — lo scivolone scuro',
      posizione: 'Alza la lingua verso il palato anteriore come per "sci", poi spingila un centimetro più indietro. La lingua si appiattisce a cucchiaio. I bordi toccano i denti laterali superiori. L\'aria scorre sul centro della lingua appiattita.',
      confronto: 'Simile allo "sh" inglese di <em>shop</em> ma più scuro e posteriore. Il nostro "sc" di <em>sciare</em> è troppo avanzato e leggero — il russo suona più cupo.',
      errore: 'Usare lo "sc" italiano standard, troppo leggero. In russo Ш suona come un fischio pesante e opaco, non leggero come il nostro.',
      parole: [
        { ru: 'Хорошо', tr: 'khoroSHO', it: 'Bene' },
        { ru: 'Ещё', tr: 'yeshCHYO', it: 'Ancora / Di più' },
        { ru: 'Шашлык', tr: 'shashLYK', it: 'Spiedino (piatto tipico)' }
      ],
      trucco: 'Di\' "scia" come in <em>sciare</em> e immagina che qualcuno ti spinga la lingua indietro di un centimetro — quel suono più opaco e posteriore è SH russo.'
    },
    {
      simbolo: 'Щ', nome: 'SHCH — lo SH con il singhiozzo',
      posizione: 'Parti dalla posizione SH (lingua a cucchiaio, indietro). Ora aggiungi una piccola tensione extra e allunga il suono. È come uno SH che non finisce subito e aggiunge una piccola strizzata finale simile al "ci" di <em>ciao</em>.',
      confronto: 'Prova a dire "sci-ci" molto veloce, fondendoli insieme: diventa qualcosa tipo "shchi". È quasi uno SH che non finisce mai e poi aggiunge un\'ombra di CH.',
      errore: 'Pronunciarlo uguale a SH, ignorando la parte finale, oppure pronunciarlo come due suoni distinti invece di uno fuso e allungato.',
      parole: [
        { ru: 'Ещё', tr: 'yeshCHYO', it: 'Ancora — "ещё воды" = ancora acqua' },
        { ru: 'Борщ', tr: 'BORSHCH', it: 'Borscht (zuppa di barbabietola)' },
        { ru: 'Овощи', tr: 'OvoshCHI', it: 'Verdure — utile per vegetariani' }
      ],
      trucco: 'È uno SH che ha il singhiozzo — parte normale e poi fa una piccola strizzata finale. "Shch... hic!"'
    },
    {
      simbolo: 'Й', nome: 'Y breve — la i che scivola via',
      posizione: 'Come la "i" italiana ma brevissima e consonantica. La lingua sale verso il palato come per dire "i" e ridiscende immediatamente. Non è una vocale piena — è una scivolata velocissima. Le labbra quasi non si muovono.',
      confronto: 'La "y" di <em>yogurt</em> in inglese. Oppure la "i" quando dici "ieri" molto veloce — solo quell\'attimo iniziale prima che arrivi la "e".',
      errore: 'Pronunciarla come una "i" normale lunga. "Chay" (tè) con la "i" allungata suona buffo. Oppure ignorarla del tutto: "Cha" invece di "Chay".',
      parole: [
        { ru: 'Чай', tr: 'CHAY', it: 'Tè — offerto ovunque' },
        { ru: 'Мой', tr: 'MOY', it: 'Mio — "мой паспорт" = il mio passaporto' },
        { ru: 'Трамвай', tr: 'tramVAY', it: 'Tram — a Tashkent' }
      ],
      trucco: 'È la "i" di "ahi!" — non la "i" di "isola". Veloce, appoggiata, poi via. Pensa a un rimbalzo rapido.'
    },
    {
      simbolo: 'Ы', nome: 'Ы — la vocale del pugno allo stomaco',
      posizione: 'Apri la bocca come per dire "e" (labbra neutre, non tonde). Ora spingi la lingua all\'indietro verso la gola senza alzarla troppo. Tieni le labbra neutre e stese. Il risultato è una vocale scura, opaca, come se venisse da più in fondo.',
      confronto: 'Non esiste in italiano. Si avvicina al suono "hmm" o "ugh" inglese quando sei sorpreso. Oppure alla vocale francese "eu" di <em>peur</em> ma con la lingua ancora più indietro.',
      errore: 'Sostituirla con "i" normale. "Вы" (VY = voi/Lei formale) pronunciato come "vi" suona come un\'altra parola. "Рынок" (mercato) pronunciato "Rinok" è incomprensibile.',
      parole: [
        { ru: 'Вы', tr: 'VY', it: 'Voi / Lei (forma di rispetto)' },
        { ru: 'Выход', tr: 'VYkhod', it: 'Uscita — da riconoscere nelle stazioni' },
        { ru: 'Рынок', tr: 'RYnok', it: 'Mercato' }
      ],
      trucco: 'Immagina di mordere un limone: quella smorfia involontaria con la bocca semiaperta e la lingua tirata indietro — la vocale che emetteresti in quel momento è Ы.'
    },
    {
      simbolo: 'Р', nome: 'R vibrante — come al Sud, mai alla francese',
      posizione: 'La punta della lingua tocca gli alveoli (la cresta subito dietro i denti superiori) e vibra mentre l\'aria passa. Come la "r" toscana, napoletana, siciliana — o spagnola. MAI come la "r" uvulare milanese o francese.',
      confronto: 'Identica alla "r" di Roma, Napoli, Palermo. Se vieni dal Nord, pensa alla "r" spagnola di <em>perro</em>. Se non riesci a farla vibrare, dì "dr" molto veloce finché la punta della lingua inizia a battere.',
      errore: 'Usare la "r" uvulare settentrionale o francese (il gorgoglio in fondo alla gola). Per un russo suona stranissimo e rende le parole irriconoscibili.',
      parole: [
        { ru: 'Хорошо', tr: 'khoroSHO', it: 'Bene — la R è nella sillaba "ro"' },
        { ru: 'Рубль', tr: 'RUBL\'', it: 'Rublo — inizia con R' },
        { ru: 'Рынок', tr: 'RYnok', it: 'Mercato — R + Y: doppia sfida' }
      ],
      trucco: 'Di\' "drrrr" come un motorino o un telefono che vibra. Quella vibrazione della punta della lingua è esattamente la R russa. Esercitati sotto la doccia.'
    }
  ];

  return suoni.map(s => `
    <div class="aiuto-suono">
      <div class="aiuto-suono-header">
        <span class="aiuto-suono-simbolo">${s.simbolo}</span>
        <span class="aiuto-suono-nome">${s.nome}</span>
      </div>
      <div class="aiuto-suono-body">
        <div class="aiuto-label">Come posizionarsi</div>
        <p>${s.posizione}</p>
        <div class="aiuto-label">Con cosa confrontarlo</div>
        <p>${s.confronto}</p>
        <div class="aiuto-label">Errore tipico degli italiani</div>
        <p class="errore-text">${s.errore}</p>
        <div class="aiuto-label">3 parole da viaggio per esercitarsi</div>
        <div class="aiuto-parole">
          ${s.parole.map(p => `
            <div class="aiuto-parola">
              <div class="aiuto-parola-main">
                <span class="aiuto-parola-tr">${p.tr}</span>
                <span class="aiuto-parola-ru">${p.ru}</span>
              </div>
              <span class="aiuto-parola-it">${p.it}</span>
              <button class="btn-tts btn-tts-sm" onclick="TTS.speakRussian('${p.ru.replace(/'/g, "\\'")}', {button:this})">▶</button>
            </div>
          `).join('')}
        </div>
        <div class="aiuto-trucco">💡 ${s.trucco}</div>
      </div>
    </div>
  `).join('');
}

// ─── Contenuto Sezione 2 — Situazioni reali ──────────────────────────────────

function aiutoSituazioni() {
  const scenari = [
    {
      titolo: '🛒 Contrattare al bazaar',
      contesto: 'Al bazaar di Samarcanda o Osh il prezzo iniziale è sempre trattabile. La trattativa è un rito sociale — non un conflitto. Il venditore si aspetta che tu tratti.',
      dialogo: [
        { chi: 'Tu', tr: 'Skol\'ko stoit?', ru: 'Сколько стоит?', it: 'Quanto costa?' },
        { chi: 'Ven.', tr: 'Tristat\' dollarov.', ru: 'Тридцать долларов.', it: 'Trenta dollari.' },
        { chi: 'Tu', tr: 'Dorogo!', ru: 'Дорого!', it: 'Troppo caro!' },
        { chi: '—', tr: '[Ti allontani lentamente]', ru: '', it: '[Non correre — cammina piano]' },
        { chi: 'Ven.', tr: 'Dvadtsat\' pyat\'!', ru: 'Двадцать пять!', it: 'Venticinque!' },
        { chi: 'Tu', tr: 'Dvadtsat\'.', ru: 'Двадцать.', it: 'Venti.' },
        { chi: 'Ven.', tr: 'Khorosho, beri.', ru: 'Хорошо, бери.', it: 'Va bene, prendilo.' },
        { chi: 'Tu', tr: 'Spasibo!', ru: 'Спасибо!', it: 'Grazie!' }
      ],
      aspettati: 'Il venditore potrebbe non parlare russo — in questo caso usa gesti e la calcolatrice del telefono. Mostra il numero che sei disposto a pagare.',
      varianti: [
        { tr: 'Mozhno deshevle?', it: 'Si può a meno?' },
        { tr: 'Pokazhite drugoy.', it: 'Mostrami un altro.' },
        { tr: 'Ya podumayu.', it: 'Ci penso. (per guadagnare tempo)' }
      ]
    },
    {
      titolo: '🚌 Prendere una marshrutka',
      contesto: 'La marshrutka (minibus condiviso) è il mezzo principale in Asia Centrale. Si paga direttamente all\'autista o al bigliettaio, di solito alla fine del viaggio.',
      dialogo: [
        { chi: 'Tu', tr: 'Do Osha?', ru: 'До Оша?', it: 'Per Osh?' },
        { chi: 'Aut.', tr: 'Da, sadi\'s\'.', ru: 'Да, садись.', it: 'Sì, siediti.' },
        { chi: 'Tu', tr: 'Skol\'ko?', ru: 'Сколько?', it: 'Quanto costa?' },
        { chi: 'Aut.', tr: 'Pyat\'desyat som.', ru: 'Пятьдесят сом.', it: 'Cinquanta som.' },
        { chi: '—', tr: '[Durante il viaggio]', ru: '', it: '' },
        { chi: 'Tu', tr: 'Ostanovite zdes\'!', ru: 'Остановите здесь!', it: 'Si fermi qui!' },
        { chi: 'Aut.', tr: 'Khorosho.', ru: 'Хорошо.', it: 'Ok.' }
      ],
      aspettati: 'La marshrutka parte quando è piena, non a orario fisso. L\'attesa può essere da 5 minuti a un\'ora. Il percorso è fisso ma puoi scendere dove vuoi.',
      varianti: [
        { tr: 'Yest\' mesta?', it: 'Ci sono posti?' },
        { tr: 'Kogda vykhodit?', it: 'Quando parte?' },
        { tr: 'Buku, pozhaluysta.', it: 'Bussate (sul vetro) per scendere.' }
      ]
    },
    {
      titolo: '🏠 Check-in in guesthouse',
      contesto: 'Le guesthouse locali sono economiche e accoglienti. Il proprietario spesso parla pochissimo inglese. Il passaporto va lasciato per la registrazione — è obbligatorio per legge.',
      dialogo: [
        { chi: 'Tu', tr: 'Zdravstvuyte! U vas yest\' svobodnye nomera?', ru: 'Здравствуйте! У вас есть свободные номера?', it: 'Buongiorno! Avete camere libere?' },
        { chi: 'Gest.', tr: 'Da, yest\'. Skol\'ko nochey?', ru: 'Да, есть. Сколько ночей?', it: 'Sì. Quante notti?' },
        { chi: 'Tu', tr: 'Dve nochi. Skol\'ko stoit?', ru: 'Две ночи. Сколько стоит?', it: 'Due notti. Quanto costa?' },
        { chi: 'Gest.', tr: 'Tysyacha som v noch\'.', ru: 'Тысяча сом в ночь.', it: 'Mille som a notte.' },
        { chi: 'Tu', tr: 'Yest\' li dush? Goryachaya voda?', ru: 'Есть ли душ? Горячая вода?', it: 'C\'è la doccia? Acqua calda?' },
        { chi: 'Gest.', tr: 'Da, yest\'. Zavtrak vkhodit.', ru: 'Да, есть. Завтрак входит.', it: 'Sì, c\'è. La colazione è inclusa.' },
        { chi: 'Tu', tr: 'Khorosho, beru. Vot pasport.', ru: 'Хорошо, беру. Вот паспорт.', it: 'Bene, la prendo. Ecco il passaporto.' }
      ],
      aspettati: 'Spesso il gestore scatta una foto del passaporto con il telefono per la registrazione. Te lo restituisce subito o la mattina dopo. La doccia calda potrebbe essere disponibile solo a certe ore.',
      varianti: [
        { tr: 'Yest\' li wifi? Kakoy parol\'?', it: 'C\'è wifi? Qual è la password?' },
        { tr: 'V kotorom chasu zavtrak?', it: 'A che ora è la colazione?' },
        { tr: 'Mozhno ostavit\' bagaj?', it: 'Posso lasciare i bagagli?' }
      ]
    },
    {
      titolo: '🍽️ Ordinare senza menu italiano',
      contesto: 'Quasi nessun ristorante locale ha il menu in italiano o inglese. Il menù spesso non esiste affatto — il cameriere ti dice cosa c\'è oggi. Funziona benissimo.',
      dialogo: [
        { chi: 'Tu', tr: 'Chto u vas yest\'?', ru: 'Что у вас есть?', it: 'Cosa avete?' },
        { chi: 'Cam.', tr: 'Plov, shashlik, lagman, samsa.', ru: 'Плов, шашлык, лагман, самса.', it: 'Plov, shashlik, lagman, samsa.' },
        { chi: 'Tu', tr: 'Chto takoe lagman?', ru: 'Что такое лагман?', it: 'Cos\'è il lagman?' },
        { chi: 'Cam.', tr: 'Sup s lapshoy i myasom.', ru: 'Суп с лапшой и мясом.', it: 'Zuppa con pasta e carne.' },
        { chi: 'Tu', tr: 'Ya ne yem myaso. Bez myasa mozhno?', ru: 'Я не ем мясо. Без мяса можно?', it: 'Non mangio carne. Si può senza carne?' },
        { chi: 'Cam.', tr: 'Mozhno, da.', ru: 'Можно, да.', it: 'Sì, si può.' },
        { chi: 'Tu', tr: 'Togda lagman bez myasa. I chay, pozhaluysta.', ru: 'Тогда лагман без мяса. И чай, пожалуйста.', it: 'Allora lagman senza carne. E un tè.' },
        { chi: '—', tr: '[Alla fine]', ru: '', it: '' },
        { chi: 'Tu', tr: 'Schot, pozhaluysta.', ru: 'Счёт, пожалуйста.', it: 'Il conto.' }
      ],
      aspettati: 'Il tè arriva sempre — verde o nero. I piatti principali tipici sono plov (riso con carne), shashlik (spiedini), lagman (zuppa con pasta), samsa (sfoglia ripiena). Quasi tutto contiene carne.',
      varianti: [
        { tr: 'Bez luka, pozhaluysta.', it: 'Senza cipolla.' },
        { tr: 'Ochen\' vkusno!', it: 'Buonissimo! (dillo sempre)' },
        { tr: 'Chto vy rekomenduete?', it: 'Cosa raccomanda?' }
      ]
    },
    {
      titolo: '⛺ Arrivare in una yurta nomade',
      contesto: 'Nelle montagne kirghize passerai notti con famiglie nomadi. Il rituale dell\'arrivo è importante — queste frasi ti fanno entrare nel cuore della famiglia.',
      dialogo: [
        { chi: 'Tu', tr: 'Mozhno voyti?', ru: 'Можно войти?', it: '(bussando) Posso entrare?' },
        { chi: 'Fam.', tr: 'Da-da, zakhodite!', ru: 'Да-да, заходите!', it: 'Sì, sì, entrate!' },
        { chi: 'Tu', tr: 'Zdravstvuyte! Spasibo za gostepriimstvo.', ru: 'Здравствуйте! Спасибо за гостеприимство.', it: 'Buonasera! Grazie per l\'ospitalità.' },
        { chi: 'Fam.', tr: 'Sadites\', pozhaluysta. Chay budete?', ru: 'Садитесь, пожалуйста. Чай будете?', it: 'Siedetevi. Volete il tè?' },
        { chi: 'Tu', tr: 'Da, spasibo. Ochen\' krasivo zdes\'!', ru: 'Да, спасибо. Очень красиво здесь!', it: 'Sì, grazie. È molto bello qui!' },
        { chi: '—', tr: '[A cena]', ru: '', it: '' },
        { chi: 'Tu', tr: 'Ochen\' vkusno! Chto eto?', ru: 'Очень вкусно! Что это?', it: 'Buonissimo! Cos\'è questo?' },
        { chi: 'Fam.', tr: 'Eto beshbarmak.', ru: 'Это бешбармак.', it: 'È il beshbarmak.' },
        { chi: 'Tu', tr: 'Mozhno yeshchyo?', ru: 'Можно ещё?', it: 'Posso averne ancora?' },
        { chi: '—', tr: '[La sera prima di dormire]', ru: '', it: '' },
        { chi: 'Tu', tr: 'Spasibo za gostepriimstvo. Spokoinoy nochi.', ru: 'Спасибо за гостеприимство. Спокойной ночи.', it: 'Grazie per l\'ospitalità. Buonanotte.' }
      ],
      aspettati: 'La famiglia ti offrirà kumis (latte di giumenta fermentato) e kurt (palline di formaggio secco). Accetta almeno un sorso — rifiutare è scortese. La cena è tardi, spesso intorno alle 21.',
      varianti: [
        { tr: 'U menya yest\' spalnyy meshok.', it: 'Ho il sacco a pelo.' },
        { tr: 'Kogda vykhodit\' zavtra?', it: 'A che ora si parte domani?' },
        { tr: 'Kholodno nochyu.', it: 'Di notte fa freddo.' }
      ]
    },
    {
      titolo: '🆘 Non capisco — chiedere aiuto',
      contesto: 'Capiterà spesso di non capire nulla. Queste frasi ti salvano in ogni situazione — dalla stazione agli angoli di strada.',
      dialogo: [
        { chi: '—', tr: '[Qualcuno parla veloce]', ru: '', it: '' },
        { chi: 'Tu', tr: 'Izvinite, ya ne ponimayu.', ru: 'Извините, я не понимаю.', it: 'Scusi, non capisco.' },
        { chi: 'Tu', tr: 'Pozhaluysta, pomédlennee.', ru: 'Пожалуйста, помедленнее.', it: 'Per favore, più lentamente.' },
        { chi: '—', tr: '[Se ancora non capisce]', ru: '', it: '' },
        { chi: 'Tu', tr: 'Mozhno napisat\'?', ru: 'Можно написать?', it: 'Può scrivere?' },
        { chi: '—', tr: '[Mostra il telefono con Google Translate]', ru: '', it: '' },
        { chi: 'Tu', tr: 'Pozhaluysta, napishite zdes\'.', ru: 'Пожалуйста, напишите здесь.', it: 'Scriva qui.' },
        { chi: '—', tr: '[Se cerchi qualcuno che parla inglese]', ru: '', it: '' },
        { chi: 'Tu', tr: 'Vy govorite po-angliyski?', ru: 'Вы говорите по-английски?', it: 'Parla inglese?' }
      ],
      aspettati: 'La maggior parte delle persone rallenta e semplifica se lo chiedi. I giovani (under 30) spesso capiscono qualcosa di inglese. Il telefono con Google Translate + fotocamera è lo strumento numero uno.',
      varianti: [
        { tr: 'Povtorite, pozhaluysta.', it: 'Ripeta, per favore.' },
        { tr: 'Ya ne govoryu po-russki khorosho.', it: 'Non parlo bene il russo.' },
        { tr: 'Ya italyanets / italyanka.', it: 'Sono italiano / italiana.' }
      ]
    }
  ];

  return scenari.map(s => `
    <div class="aiuto-scenario">
      <h4 class="aiuto-scenario-titolo">${s.titolo}</h4>
      <p class="aiuto-scenario-ctx">${s.contesto}</p>
      <div class="dialogo">
        ${s.dialogo.map(r => r.ru ? `
          <div class="dialogo-riga ${r.chi === 'Tu' ? 'dialogo-tu' : 'dialogo-altri'}">
            <span class="dialogo-chi">${r.chi}</span>
            <div class="dialogo-testo">
              <div class="dialogo-tr">${r.tr}</div>
              <div class="dialogo-ru">${r.ru}</div>
              <div class="dialogo-it">${r.it}</div>
            </div>
            <button class="btn-tts btn-tts-sm" onclick="TTS.speakRussian('${r.ru.replace(/'/g, "\\'")}', {button:this})">▶</button>
          </div>
        ` : `<div class="dialogo-nota">${r.it}</div>`).join('')}
      </div>
      <div class="aiuto-aspettati"><strong>Cosa aspettarsi:</strong> ${s.aspettati}</div>
      <div class="aiuto-varianti">
        <div class="aiuto-label">Varianti utili</div>
        ${s.varianti.map(v => `
          <div class="aiuto-variante">
            <span class="aiuto-variante-tr">${v.tr}</span>
            <span class="aiuto-variante-it">${v.it}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ─── Contenuto Sezione 3 — Numeri, prezzi, trattative ────────────────────────

function aiutoNumeri() {
  return `
    <div class="aiuto-numeri">

      <div class="aiuto-label">Numeri da 1 a 20 — con trucchi mnemonici</div>
      <div class="numeri-grid">
        ${[
          ['1', 'odin', 'oh-DEEN', 'Come "oh, deen!"'],
          ['2', 'dva', 'DVAH', 'Come "dva" in tedesco'],
          ['3', 'tri', 'TREE', 'Come l\'inglese "tree"'],
          ['4', 'chetyre', 'cheh-TY-ree', 'Suona come "che tiri"'],
          ['5', 'pyat\'', 'PYAT\'', 'Come "piat" in italiano antico'],
          ['6', 'shest\'', 'SHEST\'', 'SH + est'],
          ['7', 'sem\'', 'SEM\'', 'Quasi come "sette"'],
          ['8', 'vosem\'', 'VO-sem\'', 'VO + sem'],
          ['9', 'devyat\'', 'DYEH-vyat\'', 'DEV + yat'],
          ['10', 'desyat\'', 'DYEH-syat\'', 'Quasi "dieci" slavizzato'],
          ['11', 'odinnadtsat\'', 'a-DEEN-nat-sat\'', 'Veloce: "odiNNATsat"'],
          ['12', 'dvenadtsat\'', 'dvee-NAT-sat\'', '"Dvenadtsat" in un respiro'],
          ['15', 'pyatnadtsat\'', 'pyat-NAT-sat\'', 'pyat + nadtsat'],
          ['20', 'dvadtsat\'', 'DVAT-sat\'', 'Il più usato al bazaar'],
          ['30', 'tridtsat\'', 'TREET-sat\'', 'tri + dtsat'],
          ['40', 'sorok', 'SO-rok', 'Irregolare — memorizzalo!'],
          ['50', 'pyat\'desyat', 'pyat-dee-SYAT', '"cinque-decine"'],
          ['100', 'sto', 'STOH', 'Breve e facile'],
          ['1000', 'tysyacha', 'TY-syah-cha', 'Per i prezzi uzbeki']
        ].map(([n, tr, pron, note]) => `
          <div class="numero-card">
            <div class="numero-n">${n}</div>
            <div class="numero-tr">${tr}</div>
            <div class="numero-pron">[${pron}]</div>
            <div class="numero-note">${note}</div>
          </div>
        `).join('')}
      </div>

      <div class="aiuto-label" style="margin-top:20px">Valute — come orientarsi</div>
      <div class="valute-grid">
        <div class="valuta-card valuta-kg">
          <div class="valuta-nome">🇰🇬 Som kirghizo (KGS)</div>
          <div class="valuta-cambio">≈ 100 som = 1 €</div>
          <table class="prezzi-table">
            <tr><td>Marshrutka locale</td><td><strong>20–50 som</strong></td></tr>
            <tr><td>Taxi in città</td><td><strong>150–400 som</strong></td></tr>
            <tr><td>Pasto in teahouse</td><td><strong>150–400 som</strong></td></tr>
            <tr><td>Notte guesthouse</td><td><strong>800–1500 som</strong></td></tr>
            <tr><td>Acqua (1.5L)</td><td><strong>50–80 som</strong></td></tr>
            <tr><td>Yurta (con pasti)</td><td><strong>2000–4000 som</strong></td></tr>
          </table>
        </div>
        <div class="valuta-card valuta-uz">
          <div class="valuta-nome">🇺🇿 Som uzbeko (UZS)</div>
          <div class="valuta-cambio">≈ 13.000 som = 1 €</div>
          <table class="prezzi-table">
            <tr><td>Taxi in città</td><td><strong>20–50 mila</strong></td></tr>
            <tr><td>Pasto locale</td><td><strong>30–80 mila</strong></td></tr>
            <tr><td>Notte guesthouse</td><td><strong>100–300 mila</strong></td></tr>
            <tr><td>Ingresso museo</td><td><strong>30–80 mila</strong></td></tr>
            <tr><td>Acqua (1.5L)</td><td><strong>5–10 mila</strong></td></tr>
            <tr><td>Plov al ristorante</td><td><strong>30–60 mila</strong></td></tr>
          </table>
          <div class="valuta-nota">In Uzbekistan si parla di migliaia — non spaventarti se senti "dvadtsat\' tysyach" (20 mila) per un taxi.</div>
        </div>
      </div>

      <div class="aiuto-label" style="margin-top:20px">Script completo di trattativa al bazaar</div>
      <div class="trattativa-steps">
        <div class="trattativa-step">
          <div class="step-numero">1</div>
          <div class="step-content">
            <div class="step-titolo">Chiedi il prezzo senza emozioni</div>
            <div class="step-frase">"Skol\'ko stoit?" (Сколько стоит?)</div>
            <div class="step-note">Voce neutra. Non mostrare entusiasmo per l\'oggetto — se ti vede emozionato, il prezzo sale.</div>
          </div>
        </div>
        <div class="trattativa-step">
          <div class="step-numero">2</div>
          <div class="step-content">
            <div class="step-titolo">Reagisci con sorpresa/dispiacere</div>
            <div class="step-frase">"Dorogo!" (Дорого!) — "Ochen\' dorogo!" (Очень дорого!)</div>
            <div class="step-note">Scuoti la testa. Non arrabbiarti, sorriditi anche — è un gioco che entrambi conoscono.</div>
          </div>
        </div>
        <div class="trattativa-step">
          <div class="step-numero">3</div>
          <div class="step-content">
            <div class="step-titolo">Fai una controproposta (50-60% del prezzo iniziale)</div>
            <div class="step-frase">"Dvadtsat\' dollarov?" (Двадцать долларов?) — mostra il numero sul telefono</div>
            <div class="step-note">Usa la calcolatrice del telefono per mostrare il prezzo — evita ambiguità linguistiche.</div>
          </div>
        </div>
        <div class="trattativa-step">
          <div class="step-numero">4</div>
          <div class="step-content">
            <div class="step-titolo">Il trucco del "vado via"</div>
            <div class="step-frase">[inizia ad allontanarti lentamente, senza fretta]</div>
            <div class="step-note">Nella maggior parte dei casi il venditore ti richiama con un prezzo più basso. Se non lo fa, l\'articolo valeva davvero quello.</div>
          </div>
        </div>
        <div class="trattativa-step">
          <div class="step-numero">5</div>
          <div class="step-content">
            <div class="step-titolo">Chiudi con eleganza</div>
            <div class="step-frase">"Khorosho, beru." (Хорошо, беру.) — Va bene, lo prendo.</div>
            <div class="step-note">Stretta di mano, sorriso, grazie. Il venditore non è un nemico — è un partner del rito.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── Contenuto Sezione 4 — Cultura e galateo ─────────────────────────────────

function aiutoCultura() {
  const sezioni = [
    {
      titolo: '⛺ Nella yurta nomade',
      items: [
        '<strong>Bussa sempre prima di entrare</strong> — anche se la porta è aperta. Di\' "Mozhno voyti?" e aspetta "Zakhodite!" (Entrate!).',
        '<strong>Entra con il piede destro</strong> — è una tradizione. Non è rigidissima ma i nomadi anziani la apprezzano.',
        '<strong>Non passare davanti all\'anziano della famiglia</strong> o tra lui e il fuoco centrale. Gira attorno.',
        '<strong>Siediti dove ti indicano</strong> — non scegliere da solo il posto. Gli ospiti siedono di solito di fronte alla porta.',
        '<strong>Il kumis si accetta</strong> (latte di giumenta fermentato). Anche solo un sorso, anche se è acido. Rifiutare direttamente è scortese. Se non riesci, toccalo con le labbra e sorridi.',
        '<strong>Non rifiutare mai il tè</strong> — almeno tienilo in mano. La tazza si tiene con entrambe le mani o con la destra come segno di rispetto.',
        '<strong>Porta un piccolo dono</strong>: caramelle, cioccolato, frutta. Non costoso — il gesto conta più del valore.',
        '<strong>La cena è tardi</strong>, spesso tra le 20 e le 22. Adattati ai ritmi — non chiedere di mangiare prima.'
      ]
    },
    {
      titolo: '🛒 Al bazaar',
      items: [
        '<strong>Trattare è obbligatorio</strong> — non è scortese, è parte della transazione. Se accetti il primo prezzo, il venditore pensa che hai pagato troppo e anche tu hai perso un rito sociale.',
        '<strong>Non toccare la frutta e la verdura</strong> del venditore senza permesso. Indica e lui ti darà lui. Se vuoi scegliere tu, chiedi prima.',
        '<strong>Fotografare le persone: chiedi sempre</strong>. Di\' "Mozhno sfotografirovat\'?" e mostra la fotocamera. Mostra poi la foto — fa sempre piacere.',
        '<strong>Non fotografare militari, polizia, edifici governativi, confini</strong>. In Asia Centrale è una regola da prendere sul serio.',
        '<strong>Al "no" di un venditore non insistere</strong> — passa al banco successivo. Ce ne sono sempre altri simili.'
      ]
    },
    {
      titolo: '🏠 In guesthouse',
      items: [
        '<strong>Togli le scarpe all\'ingresso</strong> — cerca il muccchio di scarpe vicino alla porta. È sempre così nelle case private.',
        '<strong>Il proprietario spesso cena con te</strong> — partecipa alla conversazione anche con pochissimo russo. Un sorriso e "ochen\' vkusno!" fanno molto.',
        '<strong>Orario di rientro</strong>: chiedi sempre. Molte guesthouse chiudono il portone dopo le 23. "V kotorom chasu zakryvayetsya?" = A che ora chiudete?',
        '<strong>Lasciare il passaporto</strong> per la registrazione è normale e obbligatorio per legge. Il gestore ne farà una copia o una foto e te lo ridà subito o la mattina.'
      ]
    },
    {
      titolo: '🕌 Moschee e luoghi sacri (Uzbekistan)',
      items: [
        '<strong>Abbigliamento</strong>: spalle coperte, gambe coperte sotto il ginocchio per tutti. Le donne coprano i capelli all\'interno.',
        '<strong>Togli le scarpe</strong> all\'ingresso — segui l\'esempio degli altri visitatori. C\'è sempre un posto dove lasciarle.',
        '<strong>Durante la preghiera</strong> non entrare — aspetta fuori. I cinque momenti di preghiera sono all\'alba, a mezzogiorno, nel pomeriggio, al tramonto, di sera.',
        '<strong>Foto dell\'interno</strong>: generalmente consentite. Foto di persone che pregano: no, mai.',
        '<strong>Mostra rispetto visibile</strong>: non mangiare, non parlare ad alta voce, non fare telefonate. Anche se non sei credente, il rispetto è sempre apprezzato.'
      ]
    },
    {
      titolo: '🤲 Ospitalità generale',
      items: [
        '"<strong>Poydem chay pit\'</strong>" (andiamo a bere il tè) è un invito sociale importante — non è solo tè, è conversazione, amicizia, fiducia. Accettalo quando puoi.',
        '<strong>Non pulire il piatto completamente</strong> se non vuoi altra roba. Un po\' di cibo nel piatto segnala "sono sazio, grazie". Il piatto vuoto = ne voglio ancora.',
        '<strong>Mangia con la mano destra</strong> — la sinistra è considerata impura nella cultura islamica. Anche se sei mancino, usa la destra per toccare il cibo.',
        '<strong>Se non capisci nulla e tutti ridono</strong>: ridi con loro. Nella grande maggioranza dei casi è un\'atmosfera amichevole, non si ride di te.',
        '<strong>Non parlare di politica</strong> (Russia, USA, Cina, questioni territoriali). Non ne sai abbastanza del contesto locale e potresti creare imbarazzo.',
        '<strong>"Ya iz Italii"</strong> (Sono italiano/a) apre quasi sempre porte — l\'Italia è vista positivamente in tutta la regione. Usalo!'
      ]
    }
  ];

  return sezioni.map(s => `
    <div class="cultura-sezione">
      <h4 class="cultura-titolo">${s.titolo}</h4>
      <ul class="cultura-list">
        ${s.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSIONE GUIDATA
// ═══════════════════════════════════════════════════════════════════════════════

function startSession() {
  // Controlla se c'è un checkpoint valido
  const checkpoint = Session.loadCheckpoint();
  if (checkpoint) {
    APP.sessionSteps = checkpoint.steps;
    APP.sessionStepIndex = checkpoint.currentStep;
    APP.sessionStats = checkpoint.stats;
  } else {
    APP.sessionSteps = Session.build(APP.progress, APP.currentPhase);
    APP.sessionStepIndex = 0;
    APP.sessionStats = { cardsReviewed: 0, newCards: 0, correct: 0, total: 0 };
  }

  // Controlla se la sessione è già completata oggi
  const log = Storage.get(KEYS.dailyLog) || {};
  const today = new Date().toLocaleDateString('it-IT');
  if (log[today]?.sessionCompleted) {
    renderSessionComplete(true);
    return;
  }

  renderSessionIntro();
}

function showSessionOverlay() {
  document.getElementById('session-overlay').classList.add('active');
  APP.sessionActive = true;
}

function hideSessionOverlay() {
  document.getElementById('session-overlay').classList.remove('active');
  APP.sessionActive = false;
}

function renderSessionIntro() {
  const overlay = document.getElementById('session-overlay');
  const steps = APP.sessionSteps;
  const duration = Session.estimateDuration(steps);
  const dueCount = SM2.getDueCards(DATA.allCards, APP.progress).length;
  const newCount = Math.min(5, SM2.getNewCards(DATA.allCards, APP.progress).length);

  overlay.innerHTML = `
    <div class="session-intro">
      <div class="session-intro-icon">📚</div>
      <h2>Sessione di oggi</h2>
      <p class="session-duration">~${duration} minuti</p>

      <div class="session-plan">
        ${steps.filter(s => !s.skip).map(s => `
          <div class="session-plan-item">
            <span class="session-plan-icon">${getStepIcon(s.type)}</span>
            <span class="session-plan-label">${s.label}</span>
            ${s.items.length > 0 ? `<span class="session-plan-count">${s.items.length}</span>` : ''}
            ${s.optional ? '<span class="optional-badge">opzionale</span>' : ''}
          </div>
        `).join('')}
      </div>

      <div class="session-info">
        <span>📅 Giorno ${APP.dayNumber} di ${TOTAL_DAYS}</span>
        <span>🔥 Streak: ${APP.streak} giorni</span>
        ${dueCount > 0 ? `<span>🔄 ${dueCount} da rivedere</span>` : ''}
        ${newCount > 0 ? `<span>✨ ${newCount} nuove</span>` : ''}
      </div>

      <button class="btn-primary btn-start-session" onclick="beginSession()">Inizia sessione</button>
      <button class="btn-ghost" onclick="hideSessionOverlay(); switchTab('pronuncia')">Studia liberamente</button>
    </div>
  `;
  showSessionOverlay();
}

function getStepIcon(type) {
  const icons = { recap: '⚡', new: '✨', review: '🔄', phrases: '💬', complete: '✓' };
  return icons[type] || '•';
}

function beginSession() {
  advanceToNextValidStep();
}

function advanceToNextValidStep() {
  while (
    APP.sessionStepIndex < APP.sessionSteps.length &&
    APP.sessionSteps[APP.sessionStepIndex].skip
  ) {
    APP.sessionStepIndex++;
  }

  if (APP.sessionStepIndex >= APP.sessionSteps.length) {
    renderSessionComplete(false);
    return;
  }

  const step = APP.sessionSteps[APP.sessionStepIndex];
  if (step.type === 'complete') {
    renderSessionComplete(false);
    return;
  }

  Session.saveCheckpoint.call({
    CHECKPOINT_KEY: KEYS.sessionCheckpoint,
    _steps: APP.sessionSteps,
    _currentStep: APP.sessionStepIndex,
    _sessionStats: APP.sessionStats
  });

  renderSessionStep(step);
}

function renderSessionStep(step) {
  const overlay = document.getElementById('session-overlay');
  const totalActive = Session.activeStepCount(APP.sessionSteps);
  const currentActive = Session.activeStepNumber(APP.sessionSteps, APP.sessionStepIndex);
  const pct = Math.round((currentActive / totalActive) * 100);

  const itemIndex = step.currentIndex || 0;
  const totalItems = step.items.length;

  overlay.innerHTML = `
    <div class="session-step">
      <div class="session-progress-bar">
        <div class="session-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="session-step-header">
        <span class="session-step-label">Passo ${currentActive} di ${totalActive} · ${step.label}</span>
        ${totalItems > 0 ? `<span class="session-item-count">${itemIndex + 1} di ${totalItems}</span>` : ''}
        ${step.optional ? `<button class="btn-skip" onclick="skipCurrentStep()">Salta</button>` : ''}
      </div>
      <div class="session-step-content" id="session-step-content">
        ${renderStepContent(step)}
      </div>
    </div>
  `;
}

function renderStepContent(step) {
  const idx = step.currentIndex || 0;

  if (step.type === 'recap') {
    return renderRecapContent(step.items, idx);
  } else if (step.type === 'new') {
    return renderNewCardContent(step.items[idx]);
  } else if (step.type === 'review') {
    return renderReviewCardContent(step.items[idx]);
  } else if (step.type === 'phrases') {
    return renderPhraseContent(step.items[idx]);
  }
  return '';
}

function renderRecapContent(cards, idx) {
  if (idx >= cards.length) {
    completeCurrentStep();
    return '';
  }
  const card = cards[idx];
  return `
    <div class="recap-card">
      <div class="recap-label">Ricordi questa?</div>
      <div class="fc-transliteration">${card.tr}</div>
      <div class="fc-cyrillic">${card.ru}</div>
      <div class="fc-italian recap-answer">${card.it}</div>
      <div class="fc-context">${card.ctx}</div>
      <button class="btn-tts" onclick="TTS.speakRussian('${card.ru.replace(/'/g, "\\'")}', {button: this})">▶ Ascolta</button>
      <button class="btn-primary" onclick="nextRecapCard()">Avanti →</button>
    </div>
  `;
}

function nextRecapCard() {
  const step = APP.sessionSteps[APP.sessionStepIndex];
  step.currentIndex = (step.currentIndex || 0) + 1;
  if (step.currentIndex >= step.items.length) {
    completeCurrentStep();
  } else {
    renderSessionStep(step);
  }
}

function renderNewCardContent(card) {
  if (!card) { completeCurrentStep(); return ''; }
  return `
    <div class="new-card-wrapper">
      <div class="new-card-badge">Nuova carta</div>
      <div class="new-card">
        <div class="fc-transliteration">${card.tr}</div>
        <div class="fc-cyrillic">${card.ru}</div>
        <div class="fc-italian">${card.it}</div>
        <div class="fc-context">${card.ctx}</div>
        <button class="btn-tts" onclick="TTS.speakRussian('${card.ru.replace(/'/g, "\\'")}', {button: this})">▶ Ascolta</button>
      </div>
      <div class="new-card-actions">
        <p class="fc-rating-label">Hai capito?</p>
        <div class="fc-rating-buttons">
          <button class="btn-rating btn-wrong" onclick="sessionRateCard(1)">✗ Ancora</button>
          <button class="btn-rating btn-correct" onclick="sessionRateCard(5)">✓ Capito</button>
        </div>
      </div>
    </div>
  `;
}

function renderReviewCardContent(card) {
  if (!card) { completeCurrentStep(); return ''; }
  const step = APP.sessionSteps[APP.sessionStepIndex];
  const isFlipped = step._flipped;

  if (!isFlipped) {
    return `
      <div class="review-card-wrapper">
        <div class="review-card" onclick="flipSessionCard()">
          <div class="fc-transliteration">${card.tr}</div>
          <div class="fc-cyrillic">${card.ru}</div>
          <div class="fc-tap-hint">Tocca per vedere la traduzione</div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="review-card-wrapper">
        <div class="review-card flipped">
          <div class="fc-transliteration">${card.tr}</div>
          <div class="fc-cyrillic">${card.ru}</div>
          <div class="fc-italian">${card.it}</div>
          <div class="fc-context">${card.ctx}</div>
          <button class="btn-tts" onclick="TTS.speakRussian('${card.ru.replace(/'/g, "\\'")}', {button: this})">▶ Ascolta</button>
        </div>
        <p class="fc-rating-label">Come è andata?</p>
        <div class="fc-rating-buttons">
          <button class="btn-rating btn-wrong" onclick="sessionRateCard(1)">✗ Non sapevo</button>
          <button class="btn-rating btn-medium" onclick="sessionRateCard(3)">~ Difficile</button>
          <button class="btn-rating btn-correct" onclick="sessionRateCard(5)">✓ Sapevo bene</button>
        </div>
      </div>
    `;
  }
}

function flipSessionCard() {
  const step = APP.sessionSteps[APP.sessionStepIndex];
  step._flipped = true;
  renderSessionStep(step);
}

function sessionRateCard(rating) {
  const step = APP.sessionSteps[APP.sessionStepIndex];
  const card = step.items[step.currentIndex || 0];

  if (card) {
    const currentState = APP.progress[card.id] || SM2.defaultCardState();
    const isNew = !APP.progress[card.id];
    const newState = SM2.update(currentState, rating);
    APP.progress[card.id] = newState;
    Storage.set(KEYS.cardsProgress, APP.progress);

    APP.sessionStats.cardsReviewed++;
    if (isNew) APP.sessionStats.newCards++;
    if (rating >= 3) APP.sessionStats.correct++;
    APP.sessionStats.total++;
    logDailyActivity(1, 0);
    renderHeader();
  }

  step._flipped = false;
  step.currentIndex = (step.currentIndex || 0) + 1;

  if (step.currentIndex >= step.items.length) {
    completeCurrentStep();
  } else {
    renderSessionStep(step);
  }
}

function renderPhraseContent(phrase) {
  if (!phrase) { completeCurrentStep(); return ''; }
  const isStudied = APP.phrasesStudied.has(phrase.id);
  return `
    <div class="session-phrase">
      <div class="phrase-transliteration">${phrase.tr}</div>
      <div class="phrase-cyrillic">${phrase.ru}</div>
      <div class="phrase-italian">${phrase.it}</div>
      <div class="phrase-context">${phrase.ctx}</div>
      <button class="btn-tts" onclick="TTS.speakRussian('${phrase.ru.replace(/'/g, "\\'")}', {button: this})">▶ Ascolta</button>
      ${!isStudied ? `
        <button class="btn-primary" onclick="sessionMarkPhrase('${phrase.id}')">Segna come studiata →</button>
      ` : `
        <div class="already-studied">✓ Già studiata oggi</div>
        <button class="btn-primary" onclick="nextSessionPhrase()">Avanti →</button>
      `}
    </div>
  `;
}

function sessionMarkPhrase(phraseId) {
  markPhraseStudied(phraseId);
  APP.sessionStats.phrasesStudied = (APP.sessionStats.phrasesStudied || 0) + 1;
  logDailyActivity(0, 1);
  nextSessionPhrase();
}

function nextSessionPhrase() {
  const step = APP.sessionSteps[APP.sessionStepIndex];
  step.currentIndex = (step.currentIndex || 0) + 1;
  if (step.currentIndex >= step.items.length) {
    completeCurrentStep();
  } else {
    renderSessionStep(step);
  }
}

function completeCurrentStep() {
  APP.sessionSteps[APP.sessionStepIndex].completed = true;
  APP.sessionStepIndex++;
  advanceToNextValidStep();
}

function skipCurrentStep() {
  APP.sessionSteps[APP.sessionStepIndex].skip = true;
  APP.sessionStepIndex++;
  advanceToNextValidStep();
}

function renderSessionComplete(alreadyDone) {
  const overlay = document.getElementById('session-overlay');
  const stats = APP.sessionStats;
  const total = stats.total || 0;
  const correct = stats.correct || 0;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 100;

  let title, titleClass;
  if (alreadyDone) {
    title = 'Sessione completata';
    titleClass = 'good';
  } else if (pct === 100 && total > 0) {
    title = 'Sessione perfetta';
    titleClass = 'perfect';
  } else if (pct >= 70) {
    title = 'Ottimo lavoro';
    titleClass = 'good';
  } else {
    title = 'Fatto — domani meglio';
    titleClass = 'ok';
  }

  // Sottotitolo contestuale basato sui giorni al viaggio
  const daysLeft = Math.max(0, Math.ceil((TRAVEL_DATE - Date.now()) / 86400000));
  const subtitle = getContextualSubtitle(daysLeft);

  // Salva sessione completata
  if (!alreadyDone) {
    const log = Storage.get(KEYS.dailyLog) || {};
    const today = new Date().toLocaleDateString('it-IT');
    if (!log[today]) log[today] = {};
    log[today].sessionCompleted = true;
    Storage.set(KEYS.dailyLog, log);
    Session.clearCheckpoint.call({ CHECKPOINT_KEY: KEYS.sessionCheckpoint });
  }

  overlay.innerHTML = `
    <div class="complete-screen">
      <div class="complete-circle-wrapper">
        <svg class="complete-svg" viewBox="0 0 100 100" width="120" height="120">
          <circle class="circle-bg" cx="50" cy="50" r="45" fill="none" stroke="#e8e8e8" stroke-width="6"/>
          <circle class="circle-anim" cx="50" cy="50" r="45" fill="none" stroke="#1D9E75" stroke-width="6"
            stroke-dasharray="283" stroke-dashoffset="283" stroke-linecap="round"
            transform="rotate(-90 50 50)"/>
        </svg>
        <div class="complete-check">✓</div>
      </div>

      <h2 class="complete-title ${titleClass}">${title}</h2>
      <p class="complete-subtitle">${subtitle}</p>

      <div class="complete-stats">
        <div class="complete-stat">
          <div class="stat-value">${stats.cardsReviewed || 0}</div>
          <div class="stat-label">carte riviste</div>
        </div>
        <div class="complete-stat">
          <div class="stat-value">${stats.newCards || 0}</div>
          <div class="stat-label">nuove</div>
        </div>
        <div class="complete-stat">
          <div class="stat-value">${pct}%</div>
          <div class="stat-label">corrette</div>
        </div>
        <div class="complete-stat">
          <div class="stat-value">🔥 ${APP.streak}</div>
          <div class="stat-label">streak</div>
        </div>
      </div>

      <button class="btn-primary btn-close-session" onclick="hideSessionOverlay(); switchTab('pronuncia')">Chiudi</button>
      <button class="btn-ghost btn-continue-study" onclick="hideSessionOverlay(); switchTab('flashcard')">Continua a studiare</button>
    </div>
  `;

  showSessionOverlay();

  // Animazione cerchio
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const circle = overlay.querySelector('.circle-anim');
      if (circle) circle.style.strokeDashoffset = '0';
    });
  });
}

function getContextualSubtitle(daysLeft) {
  for (const sub of DATA.completionSubtitles) {
    const [min, max] = sub.daysFromTravel;
    if (daysLeft >= min && daysLeft <= max) {
      return sub.text.replace('{X}', daysLeft);
    }
  }
  if (daysLeft > 65) return `Tra ${daysLeft} giorni il grande viaggio`;
  return 'Il russo si impara un giorno alla volta';
}

// ─── Avvio ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
