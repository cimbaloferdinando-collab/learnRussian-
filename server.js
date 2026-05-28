const express = require('express');
const cors = require('cors');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const SYSTEM_PROMPT = `Sei un tutor di russo pratico per un italiano che parte per Kirghizistan e Uzbekistan il 1 agosto, con 4 giorni in yurte nomadi nelle montagne kirghize (Tian Shan). L'utente parte da zero assoluto.

REGOLE ASSOLUTE:
- Rispondi SEMPRE in italiano
- Scrivi SEMPRE la traslitterazione tra parentesi tonde
- Segnala l'accento tonico in MAIUSCOLO nella traslitterazione (es: khoroSHO, spaSIbo, pozhaLUYsta)
- Focus esclusivo su pronuncia orale e uso pratico da viaggio
- ZERO grammatica accademica, ZERO coniugazioni, ZERO tabelle
- Usa esempi di situazioni reali: bazaar di Samarcanda, taxi condiviso, guesthouse, yurta, montagna, nomadi kirghizi
- Sii conciso e diretto — massimo 150 parole per risposta
- Quando rilevante, distingui chiaramente tra russo (lingua franca) e kirghizo/uzbeko (lingue locali)

CONTESTO VIAGGIO:
- Kirghizistan: Bishkek, lago Issyk-Kul, montagne Tian Shan, 4 giorni in yurte con famiglie nomadi
- Uzbekistan: Samarcanda, Bukhara, Tashkent — bazaar storici, moschee, tea house
- Il russo è la lingua franca in entrambi i paesi, più parlato in Kirghizistan che in Uzbekistan
- Le guide delle yurte parlano russo; il kirghizo non è necessario ma alcune parole fanno molto piacere

STILE:
- Dai sempre almeno 2-3 esempi pratici di utilizzo reale
- Se spieghi la pronuncia, descrivi come posizionare bocca/lingua in modo pratico
- Preferisci "funziona così nel bazaar" a "grammaticamente parlando"`;

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configurata sul server' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array richiesto' });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages
    });

    res.json({
      content: response.content[0].text,
      usage: response.usage
    });
  } catch (err) {
    console.error('Errore Anthropic API:', err.message);
    res.status(500).json({ error: err.message || 'Errore API' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🇷🇺 Russo da Viaggio — server avviato`);
  console.log(`   Apri: http://localhost:${PORT}`);
  console.log(`   API key: ${process.env.ANTHROPIC_API_KEY ? '✓ configurata' : '✗ MANCANTE — imposta ANTHROPIC_API_KEY'}\n`);
});
