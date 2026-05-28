# 🇷🇺 Russo da Viaggio

App **statica** per imparare il russo orale da viaggiatore — ottimizzata per Kirghizistan e Uzbekistan.
Sessioni da 15-20 minuti al giorno. Partenza da zero assoluto.

**Nessun server. Nessuna API key. Nessuna installazione.**

## Aprire in locale

Apri direttamente `index.html` nel browser — funziona subito.

Per un'esperienza migliore (TTS russo, nessun problema di path):

**Con VS Code:**
```
Installa estensione "Live Server" → tasto destro su index.html → "Open with Live Server"
```

**Con Python (se ce l'hai):**
```bash
python3 -m http.server 8080
# poi apri http://localhost:8080
```

**Con Node.js (se ce l'hai):**
```bash
npx serve .
```

## Deploy su Vercel (gratuito, 5 minuti)

1. **Push su GitHub** — se non l'hai ancora fatto:
   ```bash
   git add .
   git commit -m "primo commit"
   git push
   ```

2. **Vai su [vercel.com](https://vercel.com)** → "Add New Project"

3. **Importa il repo GitHub** — Vercel lo rileva automaticamente come sito statico

4. **Clicca Deploy** — nessuna configurazione necessaria

5. **Apri l'URL** che Vercel ti dà — funziona su qualsiasi dispositivo, ovunque nel mondo

Ogni volta che fai `git push`, Vercel rideploya automaticamente.

## Note sul TTS (Text-to-Speech)

- **Chrome** (desktop e mobile): supporto completo voce `ru-RU` — esperienza migliore
- **Safari iOS**: voce russa disponibile se installata in Impostazioni → Accessibilità → Contenuto parlato → Voci → Russo
- **Firefox**: supporto variabile
- **Sezione Kirghizo**: il kirghizo non è supportato dai browser — viene usata una voce di fallback con avviso visibile

## Struttura del progetto

```
russo-da-viaggio/
├── index.html          # App principale (single-page, tutto qui)
├── vercel.json         # Config deploy Vercel (sito statico)
├── README.md
└── src/
    ├── style.css       # Tutti gli stili (mobile-first)
    ├── data.js         # Contenuti: flashcard, frasi, pronuncia, nomade
    ├── sm2.js          # Algoritmo SM-2 (spaced repetition)
    ├── tts.js          # Web Speech API wrapper
    ├── session.js      # Sessione guidata + Storage helper
    └── app.js          # Logica principale dell'app
```

## Piano di studio — 65 giorni

| Fase | Giorni | Focus |
|------|--------|-------|
| 1 | 1–14 | Fonetica, saluti, orientarsi |
| 2 | 15–40 | Cibo, bazaar, trasporti, guesthouse |
| 3 | 41–65 | Conversazione, trattative, vita nomade, emergenze |

## 5 sezioni dell'app

1. **Pronuncia** — 6 suoni difficili per italiani + 4 regole + 5 parole segnale in cirillico
2. **Flashcard** — 62 carte in 7 mazzi con algoritmo SM-2 (spaced repetition)
3. **Frasi del giorno** — 6 frasi per fase con TTS e tracciamento progresso
4. **Vita Nomade** — sezione dedicata con russo + parole kirghize (layout ambra)
5. **Aiuto & Suggerimenti** — guide pre-scritte: pronuncia approfondita, dialoghi reali, numeri/prezzi, cultura e galateo
