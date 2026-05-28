// Tutti i contenuti dell'app: flashcard, frasi, pronuncia, sezione nomade

const DATA = {

  // ─── PRONUNCIA ───────────────────────────────────────────────────────────

  sounds: [
    {
      id: 'kh',
      label: 'КХ — suono gutturale',
      symbol: 'КХ',
      description: 'Come in "Bach" tedesco o nel dialetto siciliano "chiù". La lingua si solleva verso il palato morbido, l\'aria passa raschiando. NON è la "k" italiana.',
      tip: 'Immagina di voler togliere un capello dalla lingua — quel suono è KH.',
      examples: [
        { ru: 'Хорошо', tr: 'khoroSHO', it: 'Bene / OK' },
        { ru: 'Хлеб', tr: 'KHLEB', it: 'Pane' },
        { ru: 'Плохо', tr: 'PLOkho', it: 'Male' }
      ]
    },
    {
      id: 'sh',
      label: 'Ш — SH duro',
      symbol: 'Ш',
      description: 'Come "sc" in "sciare" ma con la lingua più indietro, appiattita contro il palato. Il suono è più pesante e "scuro" dello SH inglese.',
      tip: 'Metti la lingua a cucchiaio e tienila ferma mentre butti l\'aria.',
      examples: [
        { ru: 'Хорошо', tr: 'khoroSHO', it: 'Bene' },
        { ru: 'Школа', tr: 'SHKOla', it: 'Scuola' },
        { ru: 'Ещё', tr: 'yeshCHYO', it: 'Ancora' }
      ]
    },
    {
      id: 'shch',
      label: 'Щ — SHCH morbido',
      symbol: 'Щ',
      description: 'Combinazione di SH + CH prolungato, tutto morbido. Simile al nostro "sci" ma più lungo e stridente. In pratica: tieni la posizione di SH e aggiungi un pizzico di "ch".',
      tip: 'Di\' "sci-ci" velocemente, senza staccare la lingua dal palato.',
      examples: [
        { ru: 'Ещё', tr: 'yeshCHYO', it: 'Ancora / Di più' },
        { ru: 'Щи', tr: 'SHCHI', it: 'Zuppa di cavolo' },
        { ru: 'Борщ', tr: 'BORSHCH', it: 'Borscht (zuppa barbabietola)' }
      ]
    },
    {
      id: 'y',
      label: 'Й — Y breve',
      symbol: 'Й',
      description: 'La "i" italiana brevissima, quasi consonante. Come la "y" in "yogurt" inglese. Dura pochissimo, è una scivolata veloce.',
      tip: 'Di\' "iai" rapidissimo — il suono di mezzo è la Й.',
      examples: [
        { ru: 'Чай', tr: 'CHAY', it: 'Tè' },
        { ru: 'Мой', tr: 'MOY', it: 'Mio' },
        { ru: 'Трамвай', tr: 'tramVAY', it: 'Tram' }
      ]
    },
    {
      id: 'yeru',
      label: 'Ы — vocale dura',
      symbol: 'Ы',
      description: 'Non esiste in italiano. È una "i" pronunciata con la bocca semi-aperta e la lingua tirata indietro. Suona come la vocale in "hmm" inglese ma più scura.',
      tip: 'Di\' "i" e spingi la lingua indietro come se qualcuno ti desse un pugno nello stomaco.',
      examples: [
        { ru: 'Вы', tr: 'VY', it: 'Voi / Lei (formale)' },
        { ru: 'Рыба', tr: 'RYba', it: 'Pesce' },
        { ru: 'Выход', tr: 'VYkhod', it: 'Uscita' }
      ]
    },
    {
      id: 'r',
      label: 'Р — R vibrante',
      symbol: 'Р',
      description: 'La "r" russa è sempre vibrante, come quella meridionale italiana o spagnola. MAI la "r" uvulare francese. Sempre con la punta della lingua che vibra sul palato.',
      tip: 'Di\' "drrrr" come il suono di un motorino — è esattamente quella vibrazione.',
      examples: [
        { ru: 'Рубль', tr: 'RUBL\'', it: 'Rublo' },
        { ru: 'Рынок', tr: 'RYnok', it: 'Mercato' },
        { ru: 'Хорошо', tr: 'khoroSHO', it: 'Bene' }
      ]
    }
  ],

  rules: [
    {
      title: 'Accento tonico — tutto dipende da lui',
      text: 'Ogni parola russa ha UN sillaba tonica. Quella sillaba va pronunciata più lunga e forte. Nelle traslitterazioni dell\'app, la sillaba tonica è in MAIUSCOLO. Esempio: spa-SI-bo (il SI è più lungo e forte).',
      example: 'spaSIbo · pozhaLUYsta · khoroSHO'
    },
    {
      title: 'La O atona diventa A',
      text: 'Quando la lettera О non è sotto accento, si pronuncia come A. Questo vale quasi sempre. Non preoccuparti — col tempo viene naturale. Per ora, cerca di memorizzare le parole come suonano, non come si scrivono.',
      example: 'хорошо = kha-ra-SHO (non kho-ro-SHO)'
    },
    {
      title: 'Consonanti morbide (il segno ь)',
      text: 'Il segno ь (segno molle) dopo una consonante la "addolcisce" — aggiungi una mini-Y dopo la consonante. Byt\' = BYT\' (essere), la T finale è morbida. Non è cruciale per capire, ma migliora molto la pronuncia.',
      example: 'сталь = STAL\' (acciaio) · пить = PIT\' (bere)'
    },
    {
      title: 'La E dopo consonante',
      text: 'Dopo le consonanti "dure" SH, ZH, TS, la E suona come una E normale. Dopo consonanti morbide suona con una Y davanti (ye). Per un viaggiatore: non farti ingannare dallo scritto, fidati di come suona.',
      example: 'это = Eta (questo) · есть = YEst\' (c\'è / mangiare)'
    }
  ],

  signalWords: [
    { ru: 'АПТЕКА', tr: 'apTEka', it: 'Farmacia', note: 'Insegna rossa o verde — identica in tutto il post-URSS' },
    { ru: 'КАФЕ', tr: 'kaFE', it: 'Bar / Caffè', note: 'Lo trovi scritto così su qualsiasi locale' },
    { ru: 'ТАКСИ', tr: 'takSI', it: 'Taxi', note: 'Di solito giallo o con striscia a scacchi' },
    { ru: 'ВЫХОД', tr: 'VYkhod', it: 'Uscita', note: 'Fondamentale in stazioni e mercati coperti' },
    { ru: 'ВОДА', tr: 'voDA', it: 'Acqua', note: 'Sulle bottiglie — cerca anche "питьевая" (potabile)' }
  ],

  // ─── FLASHCARD ────────────────────────────────────────────────────────────

  decks: {
    saluti: {
      name: 'Saluti',
      icon: '👋',
      cards: [
        { id: 's1', tr: 'zdravSTVUYte', ru: 'Здравствуйте', it: 'Buongiorno / Salve (formale)', ctx: 'Usalo SEMPRE con adulti sconosciuti. È il modo sicuro in ogni situazione.' },
        { id: 's2', tr: 'priVET', ru: 'Привет', it: 'Ciao (informale)', ctx: 'Con i giovani o persone già incontrate prima.' },
        { id: 's3', tr: 'kak deLAR?', ru: 'Как дела?', it: 'Come stai?', ctx: 'Risposta attesa: "Horosho, spasibo" — quasi automatica.' },
        { id: 's4', tr: 'khoroSHO, spaSIbo', ru: 'Хорошо, спасибо', it: 'Bene, grazie', ctx: 'La risposta standard a "kak dela?" — impara questa frase intera.' },
        { id: 's5', tr: 'kak vas zoVUT?', ru: 'Как вас зовут?', it: 'Come si chiama? (formale)', ctx: 'Forma di rispetto con adulti. Prepara subito la tua risposta.' },
        { id: 's6', tr: 'meNYA zoVUT...', ru: 'Меня зовут...', it: 'Mi chiamo...', ctx: 'Completa con il tuo nome. Gli italiani vengono ricordati facilmente.' },
        { id: 's7', tr: 'do sviDANiya', ru: 'До свидания', it: 'Arrivederci (formale)', ctx: 'All\'uscita da negozi, guesthouse, taxi. Sempre apprezzato.' },
        { id: 's8', tr: 'POka', ru: 'Пока', it: 'Ciao ciao (informale)', ctx: 'Solo con persone già conosciute. Col proprietario della guesthouse dopo qualche giorno.' }
      ]
    },
    orientarsi: {
      name: 'Orientarsi',
      icon: '🗺️',
      cards: [
        { id: 'o1', tr: 'GDE...?', ru: 'Где...?', it: 'Dov\'è...?', ctx: 'La parola più utile in assoluto. "Gde apteka?" "Gde vokzal?" — funziona sempre.' },
        { id: 'o2', tr: 'kak proyTI k...?', ru: 'Как пройти к...?', it: 'Come si arriva a...? (a piedi)', ctx: 'Per chiedere indicazioni stradali. Poi ascolta se dicono "pryamo" o "nalevo/napravo".' },
        { id: 'o3', tr: 'PRYamo', ru: 'Прямо', it: 'Dritto', ctx: 'La risposta più comune alle domande di direzione. Spesso ripetuta due volte.' },
        { id: 'o4', tr: 'nаLEvo', ru: 'Налево', it: 'A sinistra', ctx: 'Di solito accompagnato da un gesto — fidati del gesto!' },
        { id: 'o5', tr: 'naPRAvo', ru: 'Направо', it: 'A destra', ctx: 'Come sopra — gesto + parola.' },
        { id: 'o6', tr: 'ya zabluDILsya', ru: 'Я заблудился', it: 'Mi sono perso', ctx: 'Maschile: zabluDILsya. Femminile: zabluDIlas\'. Mostri poi la mappa sul telefono.' },
        { id: 'o7', tr: 'napiSHIte, pozhaLUYsta', ru: 'Напишите, пожалуйста', it: 'Scrivete, per favore', ctx: 'Chiedi di scrivere il nome del posto. Poi mostri il foglio al prossimo taxi.' },
        { id: 'o8', tr: 'ostanoVIte ZDES\', pozhaLUYsta', ru: 'Остановите здесь, пожалуйста', it: 'Si fermi qui, per favore', ctx: 'Per scendere da taxi o marshrutka. Puoi anche bussare sul vetro.' }
      ]
    },
    cibo: {
      name: 'Cibo & Bazaar',
      icon: '🥙',
      cards: [
        { id: 'c1', tr: 'SKOL\'ko STOit?', ru: 'Сколько стоит?', it: 'Quanto costa?', ctx: 'Prima domanda al bazaar. Anche solo questo basta per iniziare la trattativa.' },
        { id: 'c2', tr: 'DOkago!', ru: 'Дорого!', it: 'Troppo caro!', ctx: 'Dillo con espressione e allontanati — fa parte del rito. Il venditore ti richiamerà.' },
        { id: 'c3', tr: 'pokaZHIte, pozhaLUYsta', ru: 'Покажите, пожалуйста', it: 'Fammi vedere, per favore', ctx: 'Al bancone del bazaar per frutta, spezie, tessuti. Gesto + parola.' },
        { id: 'c4', tr: 'neMNOZHko', ru: 'Немножко', it: 'Un po\' / Un altro po\'', ctx: '"Nemnozhko ryby" = un po\' di pesce. "Yeshchyo nemnozhko" = ancora un po\'.' },
        { id: 'c5', tr: 'ya khoTSHU', ru: 'Я хочу', it: 'Voglio / Vorrei', ctx: 'Seguito da qualsiasi parola-cibo. "Ya khotchu chay" = voglio il tè.' },
        { id: 'c6', tr: 'BEZ myasa', ru: 'Без мяса', it: 'Senza carne', ctx: 'Essenziale per vegetariani — il menu dell\'Asia centrale è quasi tutto carne.' },
        { id: 'c7', tr: 'voDA', ru: 'Вода', it: 'Acqua', ctx: '"Mineralnaya voda" = acqua minerale. "Pitevaya" = potabile. Specifica sempre.' },
        { id: 'c8', tr: 'CHAY', ru: 'Чай', it: 'Tè', ctx: 'Offerto ovunque — accettarlo è segno di rispetto. Verde (ZYOleny) o nero (CHYOrny).' },
        { id: 'c9', tr: 'SCHYOT, pozhaLUYsta', ru: 'Счёт, пожалуйста', it: 'Il conto, per favore', ctx: 'In ristoranti e caffè. Scrivi "счёт?" in cirillico sul telefono come backup.' },
        { id: 'c10', tr: 'OCHen\' VKUSno!', ru: 'Очень вкусно!', it: 'Buonissimo!', ctx: 'Dillo sempre dopo aver mangiato — fa felici i cuochi di guesthouse e le famiglie nomadi.' }
      ]
    },
    trasporti: {
      name: 'Trasporti',
      icon: '🚌',
      cards: [
        { id: 't1', tr: 'takSI', ru: 'Такси', it: 'Taxi', ctx: 'Negozia SEMPRE il prezzo prima di salire. Mostra la destinazione sul telefono.' },
        { id: 't2', tr: 'marshRUTka', ru: 'Маршрутка', it: 'Marshrutka (minibus condiviso)', ctx: 'Mezzo più economico. Si paga all\'autista o al bigliettaio. Dì la destinazione ad alta voce.' },
        { id: 't3', tr: 'okZAL', ru: 'Вокзал', it: 'Stazione (treni/autobus)', ctx: '"Avtobus" + vokzal = stazione autobus. "Zheleznodorozhny" + vokzal = stazione ferroviaria.' },
        { id: 't4', tr: 'biLET', ru: 'Билет', it: 'Biglietto', ctx: '"Odin bilet do..." = un biglietto per... Tieni pronti soldi contanti.' },
        { id: 't5', tr: 'DO...', ru: 'До...', it: 'Fino a... / Per...', ctx: '"Do Samarkanda" = per Samarcanda. La preposizione più utile per i trasporti.' },
        { id: 't6', tr: 'SKOL\'ko yekhat\'?', ru: 'Сколько ехать?', it: 'Quanto ci vuole? (di viaggio)', ctx: 'Per capire durata del tragitto. La risposta sarà un numero + "chasov/minut" (ore/minuti).' },
        { id: 't7', tr: 'ostanoVItes\' ZDES\'', ru: 'Остановитесь здесь', it: 'Si fermi qui', ctx: 'Per far fermare il taxi o la marshrutka. Puoi bussare sul vetro se non sentono.' },
        { id: 't8', tr: 'poYOdyom', ru: 'Поедем', it: 'Andiamo! (segnale al conducente)', ctx: 'Quando sei salito e sei pronto. Segnala che puoi partire.' }
      ]
    },
    guesthouse: {
      name: 'Guesthouse',
      icon: '🏠',
      cards: [
        { id: 'g1', tr: 'u vas yest\' svoboDNye noMEra?', ru: 'У вас есть свободные номера?', it: 'Avete camere libere?', ctx: 'All\'arrivo senza prenotazione. Molto comune nelle guesthouse locali.' },
        { id: 'g2', tr: 'SKOL\'ko STOit noMER?', ru: 'Сколько стоит номер?', it: 'Quanto costa la camera?', ctx: 'Chiedi sempre prima di accettare. Poi dì "dorogo!" se è caro.' },
        { id: 'g3', tr: 'ya khoTSHU zabroniROvat\'', ru: 'Я хочу забронировать', it: 'Voglio prenotare', ctx: 'Al telefono o di persona. Poi mostra le date sul calendario del telefono.' },
        { id: 'g4', tr: 'yest\' li goryaCHAya voDA?', ru: 'Есть ли горячая вода?', it: 'C\'è l\'acqua calda?', ctx: 'Fondamentale nelle guesthouse economiche — spesso non c\'è o c\'è solo a certe ore.' },
        { id: 'g5', tr: 'yest\' li WI-FI?', ru: 'Есть ли wifi?', it: 'C\'è il wifi?', ctx: 'Chiedilo sempre — spesso esiste ma non è pubblicizzato. "Parol\'" = password.' },
        { id: 'g6', tr: 'ZAVtrak vkhoDYOT?', ru: 'Завтрак входит?', it: 'La colazione è inclusa?', ctx: 'Spesso sì nelle guesthouse locali. Se la risposta è "da", è un ottimo segnale.' },
        { id: 'g7', tr: 'MOZHno ostaVIt\' baGAZH?', ru: 'Можно оставить багаж?', it: 'Posso lasciare i bagagli?', ctx: 'Per il giorno della partenza, quando hai ancora ore prima del bus/treno.' },
        { id: 'g8', tr: 'kogDA naDO uyTI?', ru: 'Когда надо уйти?', it: 'Quando devo fare il check-out?', ctx: 'Chiedi la sera prima. Di solito risponderanno con un orario — ascolta il numero.' }
      ]
    },
    nomade: {
      name: 'Vita Nomade',
      icon: '⛺',
      cards: [
        { id: 'n1', tr: 'MOZHno voyTI?', ru: 'Можно войти?', it: 'Posso entrare?', ctx: 'Bussi SEMPRE prima di entrare nella yurta. È una regola di rispetto fondamentale.' },
        { id: 'n2', tr: 'spaSIbo za gostepriIMstvo', ru: 'Спасибо за гостеприимство', it: 'Grazie per l\'ospitalità', ctx: 'Dillo la sera prima di dormire — fa un effetto enorme. Vale tutta la fatica della pronuncia.' },
        { id: 'n3', tr: 'OCHen\' VKUSno!', ru: 'Очень вкусно!', it: 'Buonissimo!', ctx: 'Dopo ogni pasto con i nomadi. Il miglior complimento che puoi fare.' },
        { id: 'n4', tr: 'SHTO Eto?', ru: 'Что это?', it: 'Cos\'è questo?', ctx: 'Per i piatti sconosciuti — kumis, beshbarmak, kurt. Mostra curiosità genuina.' },
        { id: 'n5', tr: 'ya ne yem MYAso', ru: 'Я не ем мясо', it: 'Non mangio carne', ctx: 'Importante per vegetariani — il menù nomade è quasi tutto carne. Dillo subito all\'arrivo.' },
        { id: 'n6', tr: 'MOZHno yeshCHYO?', ru: 'Можно ещё?', it: 'Posso averne ancora?', ctx: 'Il miglior complimento per il cibo di una famiglia nomade. Usalo liberamente.' },
        { id: 'n7', tr: 'KHOladno', ru: 'Холодно', it: 'Fa freddo', ctx: 'Le yurte di notte in quota (oltre 2000m) possono essere gelide. Non vergognarti di dirlo.' },
        { id: 'n8', tr: 'u meNYA yest\' spalNY MEShok', ru: 'У меня есть спальный мешок', it: 'Ho il sacco a pelo', ctx: 'Rassicura l\'ospite che non ha bisogno di darti coperte extra.' },
        { id: 'n9', tr: 'kogDA vykhoIT\'?', ru: 'Когда выходить?', it: 'A che ora si parte?', ctx: 'Per organizzare la mattina con la guida. Fondamentale se si fa trekking o escursioni.' },
        { id: 'n10', tr: 'MOZHno zaryadIT\' teleFON?', ru: 'Можно зарядить телефон?', it: 'Posso caricare il telefono?', ctx: 'Raramente disponibile nelle yurte remote — chiedere è comunque apprezzato e non offende.' },
        { id: 'n11', tr: 'ZHARko', ru: 'Жарко', it: 'Fa caldo', ctx: 'Per le yurte di giorno al sole. Anche "zhara" = il caldo / l\'afa.' },
        { id: 'n12', tr: 'TEPlo', ru: 'Тепло', it: 'È caldo (temperatura giusta)', ctx: 'Per dire che la temperatura è perfetta — dopo che hanno acceso il fuoco nella yurta.' }
      ]
    },
    emergenze: {
      name: 'Emergenze',
      icon: '🆘',
      cards: [
        { id: 'e1', tr: 'pomoGIte!', ru: 'Помогите!', it: 'Aiuto!', ctx: 'In caso di pericolo immediato. Urla forte.' },
        { id: 'e2', tr: 'mne PLOkho', ru: 'Мне плохо', it: 'Sto male', ctx: 'Per problemi di salute. Puoi aggiungere "zdes\'" (qui) indicando il punto che fa male.' },
        { id: 'e3', tr: 'apTEka', ru: 'Аптека', it: 'Farmacia', ctx: 'Insegna rossa o verde — identica in tutto il post-URSS. La parola che ti salva.' },
        { id: 'e4', tr: 'vrach', ru: 'Врач', it: 'Medico / Dottore', ctx: '"Mne nuzhen vrach" = ho bisogno di un medico. Indicalo anche su Maps.' },
        { id: 'e5', tr: 'poLItsiya', ru: 'Полиция', it: 'Polizia', ctx: 'Per emergenze di sicurezza. Tieni il numero dell\'ambasciata italiana nel telefono.' },
        { id: 'e6', tr: 'bol\'NITsa', ru: 'Больница', it: 'Ospedale', ctx: '"Gde bol\'nitsa?" = dov\'è l\'ospedale? Mostra la scritta in cirillico sul telefono.' },
        { id: 'e7', tr: 'ukRAli', ru: 'Украли', it: 'Mi hanno rubato / L\'hanno rubato', ctx: '"Ukrali moy koshelyok" = mi hanno rubato il portafoglio. Alla polizia + per assicurazione.' },
        { id: 'e8', tr: 'ne poniMAyu', ru: 'Не понимаю', it: 'Non capisco', ctx: 'Frase salvavita quando sei perso. Poi mostra il telefono con Google Translate aperto.' }
      ]
    }
  },

  // ─── FRASI DEL GIORNO ─────────────────────────────────────────────────────

  phases: [
    {
      id: 1,
      name: 'Fase 1 — Fonetica & Saluti',
      days: '1-14',
      description: 'Imposta la pronuncia di base, i saluti fondamentali e l\'orientamento nello spazio.',
      phrases: [
        { id: 'p1_1', tr: 'zdravSTVUYte!', ru: 'Здравствуйте!', it: 'Salve! (formale)', ctx: 'L\'apertura universale in Russia e Asia Centrale. Con chiunque non conosci.' },
        { id: 'p1_2', tr: 'meNYA zoVUT... ya iz ItaLii', ru: 'Меня зовут... Я из Италии', it: 'Mi chiamo... Sono italiano/a', ctx: 'Presentarsi bene è il primo passo. Gli italiani sono benvoluti — usalo a tuo vantaggio.' },
        { id: 'p1_3', tr: 'khoroSHO, spaSIbo', ru: 'Хорошо, спасибо', it: 'Bene, grazie', ctx: 'La risposta più versatile in russo. Funziona a qualsiasi domanda generica.' },
        { id: 'p1_4', tr: 'GDE apTEka?', ru: 'Где аптека?', it: 'Dov\'è la farmacia?', ctx: 'Esercita la struttura Gde + luogo. Poi sostituisci con: vokzal, kafe, taksi...' },
        { id: 'p1_5', tr: 'pozhaLUYsta', ru: 'Пожалуйста', it: 'Per favore / Prego', ctx: 'Doppio uso: "per favore" nelle richieste e "prego" come risposta a grazie.' },
        { id: 'p1_6', tr: 'izviNIte', ru: 'Извините', it: 'Scusi / Mi scusi', ctx: 'Per attirare l\'attenzione in modo educato. Prima di qualsiasi domanda a uno sconosciuto.' }
      ]
    },
    {
      id: 2,
      name: 'Fase 2 — Bazaar, Trasporti & Guesthouse',
      days: '15-40',
      description: 'Le situazioni pratiche del viaggio: comprare, spostarsi, dormire.',
      phrases: [
        { id: 'p2_1', tr: 'SKOL\'ko STOit? Dorogol! MOZHno deshevLEYe?', ru: 'Сколько стоит? Дорого! Можно дешевле?', it: 'Quanto costa? Caro! Si può a meno?', ctx: 'La sequenza completa della trattativa al bazaar. Imparala come una frase unica.' },
        { id: 'p2_2', tr: 'odin biLET do SamarKANda, pozhaLUYsta', ru: 'Один билет до Самарканды, пожалуйста', it: 'Un biglietto per Samarcanda, per favore', ctx: 'Alla stazione degli autobus. Sostituisci la destinazione: Buchara, Tashkent, Osh...' },
        { id: 'p2_3', tr: 'yest\' li svoboDNye mesTa?', ru: 'Есть ли свободные места?', it: 'Ci sono posti liberi?', ctx: 'Nella marshrutka o al ristorante. "Mesta" = posti. Risposta: da/nyet.' },
        { id: 'p2_4', tr: 'ya ne yem myaso. bez myasa, pozhaLUYsta', ru: 'Я не ем мясо. Без мяса, пожалуйста', it: 'Non mangio carne. Senza carne, per favore', ctx: 'Al ristorante o in guesthouse. Dì "ovoshchi" (verdure) per indicare cosa vuoi invece.' },
        { id: 'p2_5', tr: 'mozhno sfoTOgrafiROvat\'?', ru: 'Можно сфотографировать?', it: 'Posso fare una foto?', ctx: 'Chiedi SEMPRE prima di fotografare persone. "Vas" alla fine = foto a te.' },
        { id: 'p2_6', tr: 'ostanoVIte ZDES\', pozhaLUYsta — ya vyhozhu', ru: 'Остановите здесь, пожалуйста — я выхожу', it: 'Si fermi qui — scendo', ctx: 'Per taxi e marshrutka. "Ya vyhozhu" = sto scendendo. Busta con la mano verso il basso.' }
      ]
    },
    {
      id: 3,
      name: 'Fase 3 — Conversazione & Vita Nomade',
      days: '41-65',
      description: 'Situazioni complesse, trattative, vita nelle yurte e conversazione libera.',
      phrases: [
        { id: 'p3_1', tr: 'spaSIbo za gostepriIMstvo! u vas OCHen\' kRASivo', ru: 'Спасибо за гостеприимство! У вас очень красиво', it: 'Grazie per l\'ospitalità! È molto bello qui', ctx: 'Nella yurta la sera. Questo da solo ti farà conquistare la famiglia nomade.' },
        { id: 'p3_2', tr: 'ya pervY raz v zhizNI vizhu YUrtu', ru: 'Я первый раз в жизни вижу юрту', it: 'È la prima volta in vita mia che vedo una yurta', ctx: 'Esprime meraviglia genuina. "V zhizni" (nella vita) aggiunge enfasi.' },
        { id: 'p3_3', tr: 'mozhno li mne kuPIt\' chto-nibuT\' na pamyat\'?', ru: 'Можно ли мне купить что-нибудь на память?', it: 'Posso comprare qualcosa come ricordo?', ctx: 'Per comprare artigianato locale. Spesso le famiglie vendono feltro, gioielli tradizionali.' },
        { id: 'p3_4', tr: 'ya plokho poniMAyu. mozhno pomeDLENnee?', ru: 'Я плохо понимаю. Можно помедленнее?', it: 'Capisco poco. Può parlare più lentamente?', ctx: 'Fondamentale. La maggior parte delle persone rallenta e semplifica se lo chiedi.' },
        { id: 'p3_5', tr: 'chto vy rekomenDUyete?', ru: 'Что вы рекомендуете?', it: 'Cosa raccomanda?', ctx: 'Al ristorante o per attività. Ti porta sempre al piatto migliore della casa.' },
        { id: 'p3_6', tr: 'ETo byLO neVEroYAtno!', ru: 'Это было невероятно!', it: 'È stato incredibile!', ctx: 'Per concludere un\'esperienza — gita in montagna, pasto nomade, visita al bazaar.' }
      ]
    }
  ],

  // ─── SEZIONE VITA NOMADE ──────────────────────────────────────────────────

  nomadeSection: {
    intro: 'Passerai 4 giorni nelle montagne kirghize ospite di famiglie nomadi, dormendo in yurte. Il russo è la lingua franca con le guide — il kirghizo non è necessario ma alcune parole locali faranno molto piacere.',

    bloccoA: {
      title: 'Arrivare e sistemarsi',
      subtitle: 'Russo — le frasi essenziali per i primi momenti nella yurta',
      items: [
        { tr: 'MOZHno voyTI?', ru: 'Можно войти?', it: 'Posso entrare?', ctx: 'Bussi SEMPRE prima di entrare nella yurta. È una regola fondamentale di rispetto.' },
        { tr: 'spaSIbo za gostepriIMstvo', ru: 'Спасибо за гостеприимство', it: 'Grazie per l\'ospitalità', ctx: 'Dillo la sera prima di dormire — farà un effetto enorme.' },
        { tr: 'GDE MOZHno spat\'?', ru: 'Где можно спать?', it: 'Dove posso dormire?', ctx: 'Se non è chiaro dove ti sistemano. Di solito ti indicano con un gesto.' },
        { tr: 'MOZHno voDY?', ru: 'Можно воды?', it: 'Posso avere dell\'acqua?', ctx: 'L\'acqua nelle yurte remote viene da sorgenti di montagna — fresca e pulita.' },
        { tr: 'KHOlodno / ZHARko / TEPlo', ru: 'Холодно / Жарко / Тепло', it: 'Fa freddo / Fa caldo / Temperatura giusta', ctx: 'Le yurte di notte in quota oltre 2000m possono essere gelide. Non aver timore di dirlo.' },
        { tr: 'u meNYA yest\' spalNY MEShok', ru: 'У меня есть спальный мешок', it: 'Ho il sacco a pelo', ctx: 'Rassicura l\'ospite che non ha bisogno di fornire coperte extra.' },
        { tr: 'kogDA vykhoIT\'?', ru: 'Когда выходить?', it: 'A che ora si parte?', ctx: 'Per sapere quando alzarsi. La risposta sarà un numero — ascolta attentamente.' },
        { tr: 'MOZHno zaryadIT\' teleFON?', ru: 'Можно зарядить телефон?', it: 'Posso caricare il telefono?', ctx: 'Raramente disponibile. Chiedere è comunque apprezzato e non offende mai.' }
      ]
    },

    bloccoB: {
      title: 'A tavola con i nomadi',
      subtitle: 'Russo — mangiare è il momento più importante del soggiorno',
      items: [
        { tr: 'OCHen\' VKUSno!', ru: 'Очень вкусно!', it: 'Buonissimo!', ctx: 'Dillo sempre dopo il primo boccone. È il miglior complimento che puoi fare.' },
        { tr: 'SHTO Eto?', ru: 'Что это?', it: 'Cos\'è questo?', ctx: 'Per i piatti sconosciuti: kumis, beshbarmak, kurt. Mostra curiosità genuina — piace molto.' },
        { tr: 'ya ne yem MYAso', ru: 'Я не ем мясо', it: 'Non mangio carne', ctx: 'Importante per vegetariani — il menù nomade è quasi tutto carne. Dì subito all\'arrivo.' },
        { tr: 'MOZHno yeshCHYO?', ru: 'Можно ещё?', it: 'Posso averne ancora?', ctx: 'Il più bel complimento per il cibo di una famiglia nomade. Usalo liberamente.' },
        { tr: 'kuMYS', ru: 'Кумыс', it: 'Kumis — latte di giumenta fermentato', ctx: 'Offerto sempre, rifiutare è scortese. Accetta almeno un sorso e sorridi.' },
        { tr: 'KURT', ru: 'Курт', it: 'Kurt — palline di formaggio secco salato', ctx: 'Molto salato e acido. Assaggia — è una delle cose più particolari che mangerai in vita tua.' },
        { tr: 'beshbarMAK', ru: 'Бешбармак', it: 'Beshbarmak — piatto principale di carne e pasta', ctx: 'Il piatto nomade per eccellenza. Il nome significa "cinque dita" — si mangia con le mani.' }
      ]
    },

    bloccoC: {
      title: 'Parole kirghize di cortesia',
      subtitle: 'Non sono russo — sono kirghizo. Non devi impararle, ma usarle farà sorridere i tuoi ospiti.',
      warning: 'Queste non sono russo — sono kirghizo. Pronuncia approssimativa con TTS: usa ko-KR come fallback poiché il kirghizo non è supportato nativamente dai browser.',
      items: [
        { tr: 'RAHmat', ky: 'Рахмат', it: 'Grazie', ctx: 'La parola più facile e utile. Usala ogni volta che puoi.' },
        { tr: 'salamatsyzBY', ky: 'Саламатсызбы', it: 'Buongiorno / Salve (formale)', ctx: 'Con adulti e anziani. Ti guarderanno stupiti e poi sorrideranno.' },
        { tr: 'JAKshyby', ky: 'Жакшыбы', it: 'Stai bene? / Come va?', ctx: 'Saluto informale con i giovani della famiglia.' },
        { tr: 'JAKshi', ky: 'Жакши', it: 'Bene (risposta)', ctx: 'Risposta a jakshyby. Breve e semplice — funziona sempre.' },
        { tr: 'kandaySYZ?', ky: 'Кандайсыз?', it: 'Come stai? (informale)', ctx: 'Alternativa a jakshyby. Usala con le guide e i giovani.' }
      ]
    }
  },

  // ─── TUTOR AI — DOMANDE RAPIDE ────────────────────────────────────────────

  quickQuestions: [
    'Come si pronuncia Пожалуйста passo per passo?',
    'Come si tratta il prezzo al bazaar di Samarcanda?',
    'Come si chiede un posto in taxi condiviso o marshrutka?',
    'Come si dicono i numeri da 1 a 10 in russo?',
    'Come si ordina da mangiare senza menu in italiano?',
    'Come si rifiuta educatamente il kumis senza offendere i nomadi?',
    'Come si fanno i complimenti per il cibo a una famiglia nomade kirghiza?',
    'Cosa fare se non capisco la risposta di qualcuno?'
  ],

  // ─── SOTTOTITOLI CONTESTUALI (schermata completamento) ───────────────────

  completionSubtitles: [
    { daysFromTravel: [60, 65], text: 'Tra {X} giorni inizia il viaggio della vita' },
    { daysFromTravel: [45, 59], text: 'Tra {X} giorni sarai al bazaar di Samarcanda' },
    { daysFromTravel: [30, 44], text: 'Tra {X} giorni dormirai in una yurta nelle Tian Shan' },
    { daysFromTravel: [20, 29], text: 'Tra {X} giorni assaggerai il kumis per la prima volta' },
    { daysFromTravel: [10, 19], text: 'Tra {X} giorni le montagne kirghize ti aspettano' },
    { daysFromTravel: [3, 9], text: 'Tra {X} giorni sei in viaggio — sei quasi pronto' },
    { daysFromTravel: [1, 2], text: 'Domani si parte — tutto quello che hai studiato servirà' },
    { daysFromTravel: [0, 0], text: 'Oggi è il giorno — in bocca al lupo!' }
  ]
};

// Costruisce lista piatta di tutte le carte (per SM-2 e sessione)
DATA.allCards = Object.entries(DATA.decks).flatMap(([deckId, deck]) =>
  deck.cards.map(card => ({ ...card, deckId, deckName: deck.name }))
);
