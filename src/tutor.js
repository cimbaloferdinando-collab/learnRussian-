// ─── Tutor AI — proxy Anthropic ───────────────────────────────────────────────

const Tutor = {
  _messages: [],
  _loading: false,

  init() {
    this._messages = [];
  },

  // Invia un messaggio e riceve la risposta
  async send(userText) {
    if (this._loading || !userText.trim()) return null;
    this._loading = true;

    this._messages.push({ role: 'user', content: userText });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this._messages })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Errore di rete' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantText = data.content;

      this._messages.push({ role: 'assistant', content: assistantText });
      return assistantText;
    } catch (err) {
      // Rimuovi il messaggio utente se la chiamata fallisce
      this._messages.pop();
      throw err;
    } finally {
      this._loading = false;
    }
  },

  get isLoading() { return this._loading; },
  get history() { return [...this._messages]; }
};
