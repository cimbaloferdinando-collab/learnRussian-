// ─── Sessione guidata giornaliera ─────────────────────────────────────────────
// Struttura fissa in 5 passi; riprende dal checkpoint se interrotta.
// Salva lo stato in localStorage['russo_session_checkpoint'].

const Session = {
  CHECKPOINT_KEY: 'russo_session_checkpoint',

  // Struttura: array di {type, items, currentIndex, completed}
  _steps: [],
  _currentStep: 0,
  _sessionStats: { cardsReviewed: 0, newCards: 0, correct: 0, total: 0 },
  _onComplete: null,

  // Costruisce una sessione fresca per oggi
  build(progress, phase) {
    const dueCards = SM2.getDueCards(DATA.allCards, progress).slice(0, 10);
    const newCards = SM2.getNewCards(DATA.allCards, progress).slice(0, 5);
    const phrases = phase.phrases.slice(0, 2);

    // Carte per il riepilogo rapido (già studiate, max 3)
    const reviewCards = DATA.allCards
      .filter(c => progress[c.id] && !SM2.isDue(progress[c.id]))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Se non ci sono carte in scadenza usa più carte nuove
    const finalDue = dueCards.length > 0 ? dueCards : SM2.getNewCards(DATA.allCards, progress).slice(5, 10);
    const finalNew = newCards.length > 0 ? newCards : SM2.getNewCards(DATA.allCards, progress).slice(0, 5);

    const steps = [
      { type: 'recap', label: 'Riepilogo rapido', optional: true, items: reviewCards, currentIndex: 0, completed: false },
      { type: 'new', label: 'Nuove carte', optional: false, items: finalNew, currentIndex: 0, completed: false },
      { type: 'review', label: 'Ripasso', optional: false, items: finalDue, currentIndex: 0, completed: false },
      { type: 'phrases', label: 'Frase del giorno', optional: true, items: phrases, currentIndex: 0, completed: false },
      { type: 'complete', label: 'Fine sessione', optional: false, items: [], currentIndex: 0, completed: false }
    ];

    // Salta passi senza contenuto
    steps[0].skip = reviewCards.length === 0;
    steps[1].skip = finalNew.length === 0;
    steps[2].skip = finalDue.length === 0;

    return steps;
  },

  // Calcola durata stimata in minuti
  estimateDuration(steps) {
    let minutes = 0;
    steps.forEach(s => {
      if (s.skip) return;
      if (s.type === 'recap') minutes += 0.5;
      if (s.type === 'new') minutes += s.items.length * 1;
      if (s.type === 'review') minutes += s.items.length * 0.8;
      if (s.type === 'phrases') minutes += s.items.length * 1;
    });
    return Math.round(minutes);
  },

  // Salva checkpoint
  saveCheckpoint() {
    try {
      Storage.set(this.CHECKPOINT_KEY, {
        steps: this._steps,
        currentStep: this._currentStep,
        stats: this._sessionStats,
        date: new Date().toDateString()
      });
    } catch (e) { /* localStorage non disponibile */ }
  },

  // Carica checkpoint se è della giornata corrente
  loadCheckpoint() {
    const cp = Storage.get(this.CHECKPOINT_KEY);
    if (!cp) return null;
    if (cp.date !== new Date().toDateString()) return null;
    return cp;
  },

  // Cancella checkpoint (sessione completata)
  clearCheckpoint() {
    Storage.remove(this.CHECKPOINT_KEY);
  },

  // Conta passi attivi totali
  activeStepCount(steps) {
    return steps.filter(s => !s.skip && s.type !== 'complete').length + 1; // +1 per complete
  },

  // Numero del passo corrente (1-based, escludendo skippati)
  activeStepNumber(steps, currentStep) {
    let count = 0;
    for (let i = 0; i <= currentStep; i++) {
      if (!steps[i].skip) count++;
    }
    return count;
  }
};

// ─── Storage helper ───────────────────────────────────────────────────────────
// Degrada gracefully se localStorage non è disponibile
const Storage = {
  _mem: {},
  _available: (() => {
    try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); return true; }
    catch (e) { return false; }
  })(),

  get(key) {
    try {
      const raw = this._available ? localStorage.getItem(key) : this._mem[key];
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },

  set(key, value) {
    try {
      const str = JSON.stringify(value);
      if (this._available) localStorage.setItem(key, str);
      else this._mem[key] = str;
    } catch (e) { /* quota exceeded o disabled */ }
  },

  remove(key) {
    try {
      if (this._available) localStorage.removeItem(key);
      else delete this._mem[key];
    } catch (e) { /* ignore */ }
  }
};
