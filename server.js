const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const WORDS = {
  essen: [
    'Pizza','Sushi','Schokolade','Erdbeere','Käse','Spaghetti','Honig','Popcorn',
    'Burger','Currywurst','Brezel','Tiramisu','Wassermelone','Donut','Ramen','Taco',
    'Croissant','Gulasch','Lasagne','Chips','Eis','Waffel','Pfannkuchen','Mozzarella',
    'Avocado','Hummus','Sauerkraut','Schnitzel','Fondue','Crepe'
  ],
  orte: [
    'Strand','Flughafen','Bücherei','Krankenhaus','Konzert','Friedhof','Schule','Gefängnis',
    'Supermarkt','Schwimmbad','Museum','Zirkus','Bahnhof','Zoo','Kirche','Casino',
    'Fabrik','U-Bahn','Burg','Leuchtturm','Sauna','Raumschiff','Unterwasser-Station',
    'Vulkan','Wüste','Iglu','Baumhaus','Höhle','Dschungel','Polarstation'
  ],
  berufe: [
    'Feuerwehrmann','Lehrer','Pilot','Zahnarzt','Koch','Friseur','Anwalt','Bauer',
    'Astronaut','Taucher','Zauberer','Detektiv','Tierarzt','Chirurg','Architekt',
    'Fotograf','Musiker','Schauspieler','Bestatter','Clown','Taxifahrer','Förster',
    'Vulkanologe','Hebamme','Sommelier','Stuntman','Puppenspieler','Eisverkäufer',
    'Sprengstoffexperte','U-Boot-Kapitän'
  ],
  tiere: [
    'Elefant','Pinguin','Hai','Eichhörnchen','Oktopus','Kamel','Fledermaus','Koala',
    'Axolotl','Qualle','Tapir','Mantarochen','Schnabeltier','Nacktmull','Erdmännchen',
    'Chamäleon','Ameisenbär','Beutelteufel','Wombat','Lama','Flamingo','Krokodil',
    'Polarfuchs','Seepferdchen','Tintenfisch','Nashorn','Gorilla','Leguan','Molch','Delfin'
  ],
  gegenstaende: [
    'Regenschirm','Kopfhörer','Wecker','Spiegel','Leiter','Kerze','Rucksack','Zahnbürste',
    'Kompass','Korkenzieher','Fernrohr','Trampolin','Schneeglobe','Lavalampe','Metronom',
    'Sanduhren','Periskop','Abakus','Tamburin','Kaleidoskop','Briefmarke','Dartscheibe',
    'Bubble-Wrap','Locher','Taschenrechner','Wasserpistole','Yo-Yo','Boomerang',
    'Kazoo','Nähmaschine'
  ],
  sport: [
    'Curling','Bogenschießen','Synchronschwimmen','Tischtennis','Fechten','Sumo',
    'Klettern','Drachenfliegen','Speedminton','Hornussen','Ringen','Bobfahren',
    'Breakdance','Kabaddi','Sepaktakraw','Unterwasserhockey','Eisstockschießen',
    'Polocrosse','Faustball','Footbag'
  ],
  filme: [
    'Titanic','Matrix','Inception','Jurassic Park','Der Pate','Casablanca',
    'Alien','Terminator','Rocky','Gladiator','Schindlers Liste','Forrest Gump',
    'Der König der Löwen','Pulp Fiction','Fight Club','Braveheart','Avatar',
    'Interstellar','Parasite','Joker'
  ],
  natur: [
    'Regenbogen','Vulkanausbruch','Nordlichter','Tsunami','Tornado','Sonnenfinsternis',
    'Ebbe','Wetterleuchten','Schneelawine','Geysir','Korallenriff','Sternschnuppe',
    'Sandsturm','Monsun','Permafrost','Fjord','Atoll','Delta','Stalagmit','Biolumineszenz'
  ]
};

const HINTS = {
  Pizza:'Man isst es oft in Dreiecken',Sushi:'Kommt ursprünglich aus Japan',
  Schokolade:'Schmilzt in der Sonne',Erdbeere:'Ist rot und hat kleine Samen außen',
  Käse:'Wird aus Milch gemacht',Spaghetti:'Lang und dünn',
  Honig:'Wird von Bienen gemacht',Popcorn:'Macht beim Erhitzen Geräusche',
  Strand:'Dort gibt es viel Sand',Flughafen:'Dort starten große Maschinen',
  Bücherei:'Dort muss man leise sein',Krankenhaus:'Dort arbeiten viele Ärzte',
  Konzert:'Dort wird Musik live gespielt',Friedhof:'Ein sehr ruhiger Ort',
  Schule:'Dort lernen Kinder',Gefängnis:'Ein Ort, den man nicht verlassen darf',
  Feuerwehrmann:'Trägt oft einen Helm bei der Arbeit',Lehrer:'Steht oft vor einer Tafel',
  Pilot:'Sitzt ganz vorne im Fahrzeug',Zahnarzt:'Schaut Menschen oft in den Mund',
  Koch:'Arbeitet oft mit einer Schürze',Friseur:'Arbeitet mit einer Schere nah am Kopf',
  Anwalt:'Kennt sich gut mit Regeln aus',Bauer:'Arbeitet oft draußen auf dem Feld',
  Elefant:'Hat sehr große Ohren',Pinguin:'Kann nicht fliegen, aber gut schwimmen',
  Hai:'Lebt im Wasser und hat scharfe Zähne',Eichhörnchen:'Sammelt gerne Nüsse',
  Oktopus:'Hat mehrere Arme',Kamel:'Hat einen oder zwei Höcker',
  Fledermaus:'Ist nachts unterwegs',Koala:'Lebt gerne auf Bäumen',
  Regenschirm:'Braucht man bei schlechtem Wetter',Kopfhörer:'Setzt man sich auf die Ohren',
  Wecker:'Macht morgens laute Geräusche',Spiegel:'Man sieht sich selbst darin',
  Leiter:'Hilft, hoch hinauf zu kommen',Kerze:'Brennt mit einer kleinen Flamme',
  Rucksack:'Trägt man auf dem Rücken',Zahnbürste:'Benutzt man morgens und abends'
};

const CATEGORY_LABELS = {
  essen:'Essen & Trinken', orte:'Orte', berufe:'Berufe', tiere:'Tiere',
  gegenstaende:'Gegenstände', sport:'Sport', filme:'Filme', natur:'Natur', alle:'Alle'
};

const PLAYER_COLORS = [
  '#5dcaa5','#e07b6a','#6a9ee0','#d4a843',
  '#a06ae0','#e0a06a','#6ae0c8','#e06aab',
  '#8ae06a','#6a6ae0','#e0d46a','#6ab8e0'
];

const lobbies = {};

function makeLobbyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (lobbies[code]);
  return code;
}

function normalize(s) {
  return s.trim().toLowerCase()
    .replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWord(categoryKey, customWords) {
  // Wenn eigene Wörter vorhanden: nur die benutzen
  if (customWords && customWords.length > 0) {
    return { word: customWords[Math.floor(Math.random() * customWords.length)], category: 'custom' };
  }
  let pool = categoryKey === 'alle'
    ? Object.entries(WORDS).flatMap(([k,vs]) => vs.map(v => ({word:v, category:k})))
    : (WORDS[categoryKey] || []).map(v => ({word:v, category:categoryKey}));
  return pool[Math.floor(Math.random() * pool.length)];
}

function publicPlayerList(lobby) {
  return lobby.players.map((p, i) => ({
    id: p.id, name: p.name, connected: p.connected,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length]
  }));
}

function connectedPlayers(lobby) {
  return lobby.players.filter(p => p.connected);
}

function broadcastLobbyState(lobby, extra = {}) {
  io.to(lobby.code).emit('lobby-state', {
    code: lobby.code, phase: lobby.phase,
    players: publicPlayerList(lobby), settings: lobby.settings,
    hostId: lobby.hostId,
    describeOrder: lobby.describeOrder || [],
    describeIdx: lobby.describeIdx || 0,
    submittedHints: lobby.submittedHints || {},
    allHintsHistory: lobby.allHintsHistory || [],
    customWords: lobby.customWords || [],
    ...extra
  });
}

function startRound(lobby) {
  const picked = pickWord(lobby.settings.category, lobby.customWords);
  lobby.secretWord = picked.word;
  lobby.secretCategory = picked.category === 'custom' ? 'Eigene Wörter' : (CATEGORY_LABELS[picked.category] || picked.category);

  const connected = connectedPlayers(lobby);
  const shuffled = shuffle(connected);
  const imposterCount = Math.min(lobby.settings.imposterCount, connected.length - 2);
  lobby.imposterIds = new Set(shuffled.slice(0, imposterCount).map(p => p.id));

  lobby.describeOrder = shuffle(connected).map(p => p.id);
  lobby.describeIdx = 0;
  lobby.submittedHints = {};
  lobby.allHintsHistory = [];

  lobby.phase = 'reveal';
  lobby.votes = {};
  lobby.readyPlayers = new Set();
  lobby.votedOutId = null;
  lobby.guessOutcome = null;
  lobby.lastVoteCounts = null;

  lobby.players.forEach(p => {
    if (!p.connected) return;
    const isImposter = lobby.imposterIds.has(p.id);
    io.to(p.socketId).emit('your-role', {
      isImposter,
      category: lobby.secretCategory,
      word: isImposter ? null : lobby.secretWord,
      hint: isImposter && lobby.settings.useHints ? (HINTS[lobby.secretWord] || null) : null
    });
  });

  broadcastLobbyState(lobby, { phase: 'reveal' });
}

function broadcastDescribeTurn(lobby) {
  io.to(lobby.code).emit('describe-turn', {
    currentId: lobby.describeOrder[lobby.describeIdx],
    describeOrder: lobby.describeOrder,
    describeIdx: lobby.describeIdx,
    submittedHints: lobby.submittedHints
  });
}

function startNewDescribeRound(lobby) {
  const connected = connectedPlayers(lobby);
  lobby.describeOrder = shuffle(connected).map(p => p.id);
  lobby.describeIdx = 0;
  lobby.submittedHints = {};
  lobby.phase = 'describe';
  broadcastDescribeTurn(lobby);
  broadcastLobbyState(lobby, { phase: 'describe' });
}

function tallyVotesAndProceed(lobby) {
  const counts = {};
  lobby.players.forEach(p => { counts[p.id] = 0; });
  Object.values(lobby.votes).forEach(targetId => {
    if (counts[targetId] !== undefined) counts[targetId]++;
  });
  const maxVotes = Math.max(...Object.values(counts));
  const topIds = Object.keys(counts).filter(id => counts[id] === maxVotes);
  lobby.lastVoteCounts = counts;

  if (maxVotes === 0 || topIds.length !== 1) {
    lobby.votedOutId = null; lobby.phase = 'results';
    broadcastResults(lobby); return;
  }
  lobby.votedOutId = topIds[0];
  if (lobby.imposterIds.has(lobby.votedOutId)) {
    lobby.phase = 'guess';
    broadcastLobbyState(lobby, { phase: 'guess', votedOutId: lobby.votedOutId, voteCounts: counts });
  } else {
    lobby.phase = 'results'; broadcastResults(lobby);
  }
}

function broadcastResults(lobby) {
  const imposterNames = lobby.players.filter(p => lobby.imposterIds.has(p.id)).map(p => p.name);
  io.to(lobby.code).emit('round-results', {
    word: lobby.secretWord, category: lobby.secretCategory,
    voteCounts: lobby.lastVoteCounts || null, votedOutId: lobby.votedOutId,
    imposterNames, guessOutcome: lobby.guessOutcome,
    allHintsHistory: lobby.allHintsHistory || []
  });
  broadcastLobbyState(lobby, { phase: 'results' });
}

io.on('connection', (socket) => {

  socket.on('create-lobby', ({ name, settings }, callback) => {
    const code = makeLobbyCode();
    const player = { id: socket.id, socketId: socket.id, name: name.trim().slice(0,16) || 'Spieler', connected: true };
    const lobby = {
      code, hostId: socket.id, players: [player],
      settings: {
        imposterCount: Math.max(1, Math.min(4, settings.imposterCount || 1)),
        category: settings.category || 'alle',
        useHints: !!settings.useHints, useVoting: settings.useVoting !== false
      },
      phase: 'lobby', secretWord: null, secretCategory: null,
      imposterIds: new Set(), votes: {}, readyPlayers: new Set(),
      describeOrder: [], describeIdx: 0, submittedHints: {}, allHintsHistory: [],
      customWords: [], votedOutId: null, guessOutcome: null, lastVoteCounts: null
    };
    lobbies[code] = lobby;
    socket.join(code);
    socket.data.lobbyCode = code;
    callback({ ok: true, code, playerId: socket.id });
    broadcastLobbyState(lobby);
  });

  socket.on('join-lobby', ({ name, code }, callback) => {
    const lobby = lobbies[(code || '').toUpperCase()];
    if (!lobby) { callback({ ok: false, error: 'Lobby nicht gefunden.' }); return; }
    if (lobby.phase !== 'lobby') { callback({ ok: false, error: 'Runde läuft schon.' }); return; }
    if (lobby.players.length >= 12) { callback({ ok: false, error: 'Lobby voll (max. 12).' }); return; }
    const player = { id: socket.id, socketId: socket.id, name: (name||'').trim().slice(0,16)||'Spieler', connected: true };
    lobby.players.push(player);
    socket.join(lobby.code);
    socket.data.lobbyCode = lobby.code;
    callback({ ok: true, code: lobby.code, playerId: socket.id });
    broadcastLobbyState(lobby);
  });

  socket.on('update-settings', (settings) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.hostId !== socket.id || lobby.phase !== 'lobby') return;
    lobby.settings = {
      imposterCount: Math.max(1, Math.min(4, settings.imposterCount || 1)),
      category: settings.category || 'alle',
      useHints: !!settings.useHints, useVoting: settings.useVoting !== false
    };
    broadcastLobbyState(lobby);
  });

  // Spieler schlägt ein Wort vor
  socket.on('add-custom-word', ({ word }) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.phase !== 'lobby') return;
    const w = (word || '').trim().slice(0, 50);
    if (!w) return;
    if (lobby.customWords.includes(w)) return; // kein Duplikat
    const player = lobby.players.find(p => p.id === socket.id);
    const idx = lobby.players.indexOf(player);
    lobby.customWords.push(w);
    // Allen mitteilen wer das Wort vorgeschlagen hat
    io.to(lobby.code).emit('custom-word-added', {
      word: w,
      byName: player ? player.name : '?',
      byColor: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      customWords: lobby.customWords
    });
  });

  // Nur Host kann Wörter löschen
  socket.on('remove-custom-word', ({ word }) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.hostId !== socket.id || lobby.phase !== 'lobby') return;
    lobby.customWords = lobby.customWords.filter(w => w !== word);
    io.to(lobby.code).emit('custom-word-removed', { word, customWords: lobby.customWords });
  });

  socket.on('start-round', () => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.hostId !== socket.id) return;
    if (connectedPlayers(lobby).length < 3) return;
    startRound(lobby);
  });

  socket.on('ready-for-voting', () => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.phase !== 'reveal') return;
    lobby.readyPlayers.add(socket.id);
    const connected = connectedPlayers(lobby);
    const readyCount = connected.filter(p => lobby.readyPlayers.has(p.id)).length;
    io.to(lobby.code).emit('ready-progress', { readyCount, totalCount: connected.length });
    if (readyCount < connected.length) return;
    lobby.phase = 'describe';
    broadcastDescribeTurn(lobby);
    broadcastLobbyState(lobby, { phase: 'describe' });
  });

  socket.on('submit-hint', ({ hint }) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.phase !== 'describe') return;
    if (lobby.describeOrder[lobby.describeIdx] !== socket.id) return;
    const text = (hint || '').trim().slice(0, 100);
    if (!text) return;
    const player = lobby.players.find(p => p.id === socket.id);
    lobby.submittedHints[socket.id] = { name: player ? player.name : '?', text };
    lobby.describeIdx++;
    if (lobby.describeIdx >= lobby.describeOrder.length) {
      lobby.allHintsHistory.push({ ...lobby.submittedHints });
      lobby.phase = 'describe-review';
      io.to(lobby.code).emit('describe-review', {
        submittedHints: lobby.submittedHints, allHintsHistory: lobby.allHintsHistory
      });
      broadcastLobbyState(lobby, { phase: 'describe-review' });
    } else {
      broadcastDescribeTurn(lobby);
      broadcastLobbyState(lobby, { phase: 'describe' });
    }
  });

  socket.on('host-vote-or-describe', ({ action }) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.hostId !== socket.id || lobby.phase !== 'describe-review') return;
    if (action === 'vote') {
      if (lobby.settings.useVoting) {
        lobby.phase = 'voting'; lobby.votes = {};
        broadcastLobbyState(lobby, { phase: 'voting' });
      } else { broadcastResults(lobby); }
    } else if (action === 'describe-again') {
      startNewDescribeRound(lobby);
    }
  });

  socket.on('cast-vote', ({ targetId }) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.phase !== 'voting') return;
    if (targetId === socket.id) return;
    lobby.votes[socket.id] = targetId;
    const connected = connectedPlayers(lobby);
    const votedCount = connected.filter(p => lobby.votes[p.id] !== undefined).length;
    io.to(lobby.code).emit('vote-progress', { votedCount, totalCount: connected.length });
    if (votedCount >= connected.length) tallyVotesAndProceed(lobby);
  });

  socket.on('submit-guess', ({ guess }) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.phase !== 'guess') return;
    if (socket.id !== lobby.votedOutId) return;
    const correct = normalize(guess || '') === normalize(lobby.secretWord) && (guess||'').trim().length > 0;
    lobby.guessOutcome = correct ? 'correct' : 'wrong';
    lobby.phase = 'results'; broadcastResults(lobby);
  });

  socket.on('next-round', () => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.hostId !== socket.id) return;
    if (connectedPlayers(lobby).length < 3) return;
    lobby.phase = 'lobby'; startRound(lobby);
  });

  socket.on('back-to-lobby', () => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.hostId !== socket.id) return;
    lobby.phase = 'lobby'; broadcastLobbyState(lobby);
  });

  socket.on('chat-message', ({ text }) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby) return;
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;
    const msg = (text || '').trim().slice(0, 200);
    if (!msg) return;
    const idx = lobby.players.indexOf(player);
    io.to(lobby.code).emit('chat-message', {
      name: player.name, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], text: msg
    });
  });

  socket.on('disconnect', () => {
    const code = socket.data.lobbyCode;
    const lobby = lobbies[code];
    if (!lobby) return;
    const player = lobby.players.find(p => p.id === socket.id);
    if (player) player.connected = false;
    if (!lobby.players.some(p => p.connected)) { delete lobbies[code]; return; }
    if (lobby.hostId === socket.id) {
      const newHost = lobby.players.find(p => p.connected);
      if (newHost) lobby.hostId = newHost.id;
    }
    if (lobby.phase === 'reveal') {
      const connected = connectedPlayers(lobby);
      const readyCount = connected.filter(p => lobby.readyPlayers.has(p.id)).length;
      if (connected.length > 0 && readyCount >= connected.length) {
        lobby.phase = 'describe'; broadcastDescribeTurn(lobby);
        broadcastLobbyState(lobby, { phase: 'describe' }); return;
      }
    } else if (lobby.phase === 'describe') {
      if (lobby.describeOrder[lobby.describeIdx] === socket.id) {
        lobby.describeIdx++;
        if (lobby.describeIdx >= lobby.describeOrder.length) {
          lobby.allHintsHistory.push({ ...lobby.submittedHints });
          lobby.phase = 'describe-review';
          io.to(lobby.code).emit('describe-review', { submittedHints: lobby.submittedHints, allHintsHistory: lobby.allHintsHistory });
          broadcastLobbyState(lobby, { phase: 'describe-review' }); return;
        }
        broadcastDescribeTurn(lobby);
      }
    } else if (lobby.phase === 'voting') {
      const connected = connectedPlayers(lobby);
      const votedCount = connected.filter(p => lobby.votes[p.id] !== undefined).length;
      if (connected.length > 0 && votedCount >= connected.length) { tallyVotesAndProceed(lobby); return; }
    } else if (lobby.phase === 'guess' && lobby.votedOutId === socket.id) {
      lobby.guessOutcome = 'wrong'; lobby.phase = 'results'; broadcastResults(lobby); return;
    }
    broadcastLobbyState(lobby);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
