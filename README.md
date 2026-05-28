# 🇷🇺 Russo da Viaggio

App per imparare il russo orale da viaggiatore — ottimizzata per Kirghizistan e Uzbekistan.
Sessioni da 15-20 minuti al giorno. Partenza da zero assoluto.

## Requisiti

- Node.js 18+
- npm 8+
- Chrome (consigliato) per TTS con voce russa nativa

## Installazione

```bash
npm install
```

## Configurare la chiave API Anthropic

Il Tutor AI usa Claude via Anthropic API. Imposta la variabile d'ambiente prima di avviare:

**Linux / macOS:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-..."
```

Ottieni la chiave su [console.anthropic.com](https://console.anthropic.com).

> Le sezioni Pronuncia, Flashcard, Frasi e Vita Nomade funzionano senza chiave API.
> Solo il Tutor AI richiede la connessione a Anthropic.

## Avviare l'app

```bash
npm start
```

Il server si avvia su `http://localhost:3000`.

## Aprire nel browser

Apri **Chrome** (o Chromium) e vai su:

```
http://localhost:3000
```

Chrome è consigliato perché ha la voce `ru-RU` per il text-to-speech nativa.

## Note sul TTS (Text-to-Speech)

- **Chrome desktop/mobile**: supporto completo voce `ru-RU` — esperienza migliore
- **Safari iOS**: voce russa disponibile se installata nelle impostazioni sistema
- **Firefox**: supporto TTS variabile — alcune voci potrebbero non essere disponibili
- **Sezione Kirghizo**: il kirghizo non è supportato dai browser; viene usata una voce `ko-KR` come approssimazione fonetica — l'avviso è visibile nell'app

Per abilitare la voce russa su iOS: Impostazioni → Accessibilità → Contenuto parlato → Voci → Russo → scarica la voce.

## Struttura del progetto

```
russo-da-viaggio/
├── index.html          # App principale (single-page)
├── server.js           # Proxy Express per Anthropic API
├── package.json
├── README.md
└── src/
    ├── style.css       # Tutti gli stili (mobile-first)
    ├── data.js         # Contenuti: flashcard, frasi, pronuncia, nomade
    ├── sm2.js          # Algoritmo SM-2 (spaced repetition)
    ├── tts.js          # Web Speech API wrapper
    ├── session.js      # Sessione guidata + Storage helper
    ├── tutor.js        # Client Tutor AI
    └── app.js          # Logica principale dell'app
```

## Piano di studio — 65 giorni

| Fase | Giorni | Focus |
|------|--------|-------|
| 1 | 1–14 | Fonetica, saluti, orientarsi |
| 2 | 15–40 | Cibo, bazaar, trasporti, guesthouse |
| 3 | 41–65 | Conversazione, trattative, vita nomade, emergenze |

## Dati salvati (localStorage)

| Chiave | Contenuto |
|--------|-----------|
| `russo_start_date` | Data di inizio studio |
| `russo_cards_progress` | Stato SM-2 per ogni flashcard |
| `russo_daily_log` | Attività giornaliera |
| `russo_streak` | Giorni consecutivi di studio |
| `russo_session_checkpoint` | Stato sessione in corso |
| `russo_phrases_studied` | Frasi segnate come studiate |

## Mazzi flashcard

- 👋 Saluti (8 carte)
- 🗺️ Orientarsi (8 carte)
- 🥙 Cibo & Bazaar (10 carte)
- 🚌 Trasporti (8 carte)
- 🏠 Guesthouse (8 carte)
- ⛺ Vita Nomade & Yurte (12 carte)
- 🆘 Emergenze (8 carte)

**Totale: 62 carte**
