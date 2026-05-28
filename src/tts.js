// ─── Text-to-Speech wrapper ───────────────────────────────────────────────────
// Usa Web Speech API (speechSynthesis) — nessuna dipendenza esterna.
// Lingua primaria: ru-RU per il russo
// Fallback ko-KR per kirghizo (non supportato nativamente)

const TTS = {
  supported: typeof speechSynthesis !== 'undefined',
  _voices: [],
  _ready: false,

  init() {
    if (!this.supported) return;

    const load = () => {
      this._voices = speechSynthesis.getVoices();
      this._ready = true;
    };

    // Chrome carica le voci in modo asincrono
    if (speechSynthesis.getVoices().length > 0) {
      load();
    } else {
      speechSynthesis.addEventListener('voiceschanged', load, { once: true });
    }
  },

  // Trova la voce migliore per una lingua
  _findVoice(lang) {
    const voices = speechSynthesis.getVoices();
    // Cerca prima voce esatta, poi per prefisso lingua
    return (
      voices.find(v => v.lang === lang) ||
      voices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
      null
    );
  },

  // Pronuncia un testo
  // lang: 'ru-RU' per russo, 'ko-KR' come fallback kirghizo
  speak(text, lang = 'ru-RU', options = {}) {
    if (!this.supported) {
      console.warn('TTS non supportato in questo browser');
      return;
    }

    // Cancella eventuali riproduzioni in corso
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = options.rate ?? 0.85;  // leggermente rallentato per studio
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    const voice = this._findVoice(lang);
    if (voice) utterance.voice = voice;

    // Feedback visivo sul bottone chiamante
    const btn = options.button;
    if (btn) {
      btn.classList.add('tts-playing');
      utterance.onend = () => btn.classList.remove('tts-playing');
      utterance.onerror = () => btn.classList.remove('tts-playing');
    }

    speechSynthesis.speak(utterance);
  },

  // Pronuncia russo (traslitterazione → testo cirillico per TTS)
  speakRussian(cyrillicText, options = {}) {
    this.speak(cyrillicText, 'ru-RU', options);
  },

  // Pronuncia kirghizo (usa ko-KR come fallback — avviso già nei dati)
  speakKyrgyz(text, options = {}) {
    this.speak(text, 'ko-KR', options);
  },

  // Crea un pulsante TTS standard
  createButton(cyrillicText, lang = 'ru-RU', label = '▶ Ascolta') {
    const btn = document.createElement('button');
    btn.className = 'btn-tts';
    btn.textContent = label;
    btn.setAttribute('aria-label', `Pronuncia: ${cyrillicText}`);
    btn.addEventListener('click', () => {
      this.speak(cyrillicText, lang, { button: btn });
    });
    return btn;
  },

  stop() {
    if (this.supported) speechSynthesis.cancel();
  }
};
