// ─── Algoritmo SM-2 (SuperMemo 2) ────────────────────────────────────────────
//
// Implementazione fedele all'algoritmo originale di Piotr Wozniak (1987).
// Documentazione: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
//
// Ogni carta ha questi campi di stato:
//   interval     - giorni fino alla prossima revisione (default: 0)
//   repetition   - quante volte è stata risposta correttamente di fila (default: 0)
//   easeFactor   - fattore di facilità EF (default: 2.5, minimo: 1.3)
//   nextReview   - timestamp Unix della prossima revisione (default: ora)
//   isNew        - true se la carta non è mai stata studiata

const SM2 = {

  // Valori di default per una carta nuova
  defaultCardState() {
    return {
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      nextReview: Date.now(),
      isNew: true,
      totalReviews: 0,
      correctReviews: 0
    };
  },

  // Mappa le nostre 3 risposte alla scala SM-2 (0-5)
  // 1 = "Non sapevo"   → quality 1 (risposta sbagliata)
  // 3 = "Difficile"    → quality 3 (corretta con sforzo)
  // 5 = "Sapevo bene"  → quality 5 (perfetta)
  mapQuality(userRating) {
    const map = { 1: 1, 3: 3, 5: 5 };
    return map[userRating] ?? 3;
  },

  // Aggiorna lo stato SM-2 di una carta dopo una risposta.
  // Restituisce il nuovo stato della carta (non muta l'originale).
  update(card, userRating) {
    const quality = this.mapQuality(userRating);
    const state = { ...card };

    state.isNew = false;
    state.totalReviews = (state.totalReviews || 0) + 1;

    if (quality >= 3) {
      // ── Risposta corretta ──────────────────────────────────────────────────
      // Al primo ripasso: 1 giorno
      // Al secondo ripasso: 6 giorni
      // Dai successivi: interval * EF (arrotondato)
      if (state.repetition === 0) {
        state.interval = 1;
      } else if (state.repetition === 1) {
        state.interval = 6;
      } else {
        state.interval = Math.round(state.interval * state.easeFactor);
      }
      state.repetition += 1;
      state.correctReviews = (state.correctReviews || 0) + 1;
    } else {
      // ── Risposta sbagliata: si riparte dall'inizio ─────────────────────────
      state.repetition = 0;
      state.interval = 1;
    }

    // Aggiornamento del fattore di facilità EF
    // Formula: EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    state.easeFactor = Math.max(1.3, state.easeFactor + delta);

    // Calcola quando rivedere la carta (timestamp)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + state.interval);
    // Azzera l'orario per confrontare solo per data
    nextDate.setHours(0, 0, 0, 0);
    state.nextReview = nextDate.getTime();

    return state;
  },

  // Verifica se una carta è in scadenza oggi o nel passato
  isDue(card) {
    if (!card || card.isNew) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return card.nextReview <= today.getTime();
  },

  // Ritorna le carte in scadenza oggi, ordinate per data di scadenza
  getDueCards(allCards, progress) {
    return allCards
      .filter(card => {
        const state = progress[card.id];
        if (!state) return false; // non ancora studiata = "nuova", non "in scadenza"
        return this.isDue(state);
      })
      .sort((a, b) => {
        const stateA = progress[a.id];
        const stateB = progress[b.id];
        return stateA.nextReview - stateB.nextReview;
      });
  },

  // Ritorna le carte nuove (mai studiate)
  getNewCards(allCards, progress) {
    return allCards.filter(card => !progress[card.id]);
  },

  // Statistiche globali del progresso
  getStats(allCards, progress) {
    const total = allCards.length;
    const studied = Object.keys(progress).length;
    const due = this.getDueCards(allCards, progress).length;
    const newCount = total - studied;

    let totalCorrect = 0;
    let totalReviews = 0;
    Object.values(progress).forEach(state => {
      totalCorrect += state.correctReviews || 0;
      totalReviews += state.totalReviews || 0;
    });

    return {
      total,
      studied,
      newCount,
      due,
      accuracy: totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0
    };
  }
};
