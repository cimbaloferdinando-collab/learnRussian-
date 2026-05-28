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
  Tutor.init();

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
  renderTutorTab();
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
// TAB 5 — TUTOR AI
// ═══════════════════════════════════════════════════════════════════════════════

function renderTutorTab() {
  const container = document.getElementById('tab-tutor');

  const quickQHtml = DATA.quickQuestions.map((q, i) => `
    <button class="quick-q-btn" onclick="askQuickQuestion(${i})">${q}</button>
  `).join('');

  container.innerHTML = `
    <div class="section-header">
      <h2>Tutor AI</h2>
      <p class="section-subtitle">Fai domande in italiano — risposte con traslitterazione e accento</p>
    </div>

    <div class="quick-questions">
      <p class="quick-q-label">Domande rapide:</p>
      <div class="quick-q-grid">${quickQHtml}</div>
    </div>

    <div class="chat-container" id="chat-container">
      <div class="chat-messages" id="chat-messages">
        <div class="chat-welcome">
          <p>Ciao! Sono il tuo tutor di russo per il viaggio in Kirghizistan e Uzbekistan.</p>
          <p>Chiedimi qualsiasi cosa — pronuncia, frasi utili, come comportarsi nelle yurte, come trattare al bazaar.</p>
          <p><em>Scrivo sempre con traslitterazione e accento in MAIUSCOLO.</em></p>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <textarea id="chat-input" class="chat-input" placeholder="Scrivi la tua domanda in italiano..." rows="2"></textarea>
      <button class="btn-primary btn-send" id="btn-send" onclick="sendTutorMessage()">Chiedi</button>
    </div>
  `;

  // Enter per inviare (Shift+Enter per newline)
  const input = document.getElementById('chat-input');
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTutorMessage();
    }
  });
}

function askQuickQuestion(index) {
  const question = DATA.quickQuestions[index];
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = question;
    sendTutorMessage();
  }
}

async function sendTutorMessage() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  const sendBtn = document.getElementById('btn-send');
  if (!input || !messages) return;

  const text = input.value.trim();
  if (!text || Tutor.isLoading) return;

  input.value = '';
  sendBtn.disabled = true;
  sendBtn.textContent = '...';

  // Aggiungi messaggio utente
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user-msg';
  userDiv.textContent = text;
  messages.appendChild(userDiv);
  messages.scrollTop = messages.scrollHeight;

  // Indicatore di caricamento
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'chat-msg ai-msg loading-msg';
  loadingDiv.textContent = '...';
  messages.appendChild(loadingDiv);
  messages.scrollTop = messages.scrollHeight;

  try {
    const response = await Tutor.send(text);
    loadingDiv.classList.remove('loading-msg');
    loadingDiv.innerHTML = formatTutorResponse(response);
  } catch (err) {
    loadingDiv.classList.remove('loading-msg');
    loadingDiv.classList.add('error-msg');
    loadingDiv.textContent = `Errore: ${err.message}. Controlla che il server sia avviato e ANTHROPIC_API_KEY sia configurata.`;
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Chiedi';
    messages.scrollTop = messages.scrollHeight;
  }
}

function formatTutorResponse(text) {
  // Formatta la risposta: parole in MAIUSCOLO → evidenziate come accento tonico
  return text
    .split('\n')
    .map(line => `<p>${line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
    }</p>`)
    .join('');
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
