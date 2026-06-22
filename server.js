// server.js
// Das ist die "Spielleitung" — läuft dauerhaft auf einem Server und
// verbindet alle Handys/Computer miteinander, die im selben Spiel sind.

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statische Dateien (HTML, CSS, JS fürs Frontend) ausliefern
app.use(express.static(path.join(__dirname, 'public')));

// ---- Wortliste (gleiche Kategorien wie in der Offline-Version) ----
const WORDS = {
  essen: ['Pizza', 'Sushi', 'Schokolade', 'Erdbeere', 'Käse', 'Spaghetti', 'Honig', 'Popcorn'],
  orte: ['Strand', 'Flughafen', 'Bücherei', 'Krankenhaus', 'Konzert', 'Friedhof', 'Schule', 'Gefängnis'],
  berufe: ['Feuerwehrmann', 'Lehrer', 'Pilot', 'Zahnarzt', 'Koch', 'Friseur', 'Anwalt', 'Bauer'],
  tiere: ['Elefant', 'Pinguin', 'Hai', 'Eichhörnchen', 'Oktopus', 'Kamel', 'Fledermaus', 'Koala'],
  gegenstaende: ['Regenschirm', 'Kopfhörer', 'Wecker', 'Spiegel', 'Leiter', 'Kerze', 'Rucksack', 'Zahnbürste']
};

const HINTS = {
  Pizza: 'Man isst es oft in Dreiecken', Sushi: 'Kommt ursprünglich aus Japan', Schokolade: 'Schmilzt in der Sonne',
  Erdbeere: 'Ist rot und hat kleine Samen außen', Käse: 'Wird aus Milch gemacht', Spaghetti: 'Lang und dünn',
  Honig: 'Wird von Bienen gemacht', Popcorn: 'Macht beim Erhitzen Geräusche',
  Strand: 'Dort gibt es viel Sand', Flughafen: 'Dort starten große Maschinen', Bücherei: 'Dort muss man leise sein',
  Krankenhaus: 'Dort arbeiten viele Ärzte', Konzert: 'Dort wird Musik live gespielt', Friedhof: 'Ein sehr ruhiger Ort',
  Schule: 'Dort lernen Kinder', Gefängnis: 'Ein Ort, den man nicht verlassen darf',
  Feuerwehrmann: 'Trägt oft einen Helm bei der Arbeit', Lehrer: 'Steht oft vor einer Tafel', Pilot: 'Sitzt ganz vorne im Fahrzeug',
  Zahnarzt: 'Schaut Menschen oft in den Mund', Koch: 'Arbeitet oft mit einer Schürze', Friseur: 'Arbeitet mit einer Schere nah am Kopf',
  Anwalt: 'Kennt sich gut mit Regeln aus', Bauer: 'Arbeitet oft draußen auf dem Feld',
  Elefant: 'Hat sehr große Ohren', Pinguin: 'Kann nicht fliegen, aber gut schwimmen', Hai: 'Lebt im Wasser und hat scharfe Zähne',
  Eichhörnchen: 'Sammelt gerne Nüsse', Oktopus: 'Hat mehrere Arme', Kamel: 'Hat einen oder zwei Höcker',
  Fledermaus: 'Ist nachts unterwegs', Koala: 'Lebt gerne auf Bäumen',
  Regenschirm: 'Braucht man bei schlechtem Wetter', Kopfhörer: 'Setzt man sich auf die Ohren', Wecker: 'Macht morgens laute Geräusche',
  Spiegel: 'Man sieht sich selbst darin', Leiter: 'Hilft, hoch hinauf zu kommen', Kerze: 'Brennt mit einer kleinen Flamme',
  Rucksack: 'Trägt man auf dem Rücken', Zahnbürste: 'Benutzt man morgens und abends'
};

const CATEGORY_LABELS = {
  essen: 'Essen & Trinken', orte: 'Orte', berufe: 'Berufe', tiere: 'Tiere', gegenstaende: 'Gegenstände'
};

// ---- Spielzustand im Arbeitsspeicher ----
// In Produktion würde man bei vielen gleichzeitigen Lobbys evtl. eine
// Datenbank nutzen. Für ein Partyspiel mit wenigen gleichzeitigen Lobbys
// reicht ein einfaches Objekt im Speicher völlig aus.
const lobbies = {}; // lobbyCode -> lobbyState

function makeLobbyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // verwechselbare Zeichen weggelassen
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (lobbies[code]); // Kollision? Nochmal versuchen
  return code;
}

function normalize(s) {
  return s.trim().toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
}

function pickWord(categoryKey) {
  let pool;
  if (categoryKey === 'alle') {
    pool = [];
    for (const key in WORDS) WORDS[key].forEach(w => pool.push({ word: w, category: key }));
  } else {
    pool = WORDS[categoryKey].map(w => ({ word: w, category: categoryKey }));
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---- Feste Farben für Spieler-Namen im Chat ----
const PLAYER_COLORS = [
  '#5dcaa5', '#e07b6a', '#6a9ee0', '#d4a843',
  '#a06ae0', '#e0a06a', '#6ae0c8', '#e06aab',
  '#8ae06a', '#6a6ae0', '#e0d46a', '#6ab8e0'
];

function publicPlayerList(lobby) {
  return lobby.players.map((p, i) => ({
    id: p.id, name: p.name, connected: p.connected,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length]
  }));
}

function connectedPlayers(lobby) {
  // Wichtig für alle "haben alle reagiert?"-Prüfungen: wer die Verbindung
  // verloren hat, kann nicht mehr abstimmen oder "bereit" klicken — sonst
  // würde das Spiel ewig auf eine Antwort warten, die nie kommt.
  return lobby.players.filter(p => p.connected);
}

function startRound(lobby) {
  const picked = pickWord(lobby.settings.category);
  lobby.secretWord = picked.word;
  lobby.secretCategory = CATEGORY_LABELS[picked.category];

  const indices = lobby.players.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const imposterCount = Math.min(lobby.settings.imposterCount, lobby.players.length - 2);
  lobby.imposterIds = new Set(indices.slice(0, imposterCount).map(i => lobby.players[i].id));

  lobby.phase = 'reveal';
  lobby.votes = {};
  lobby.readyPlayers = new Set();
  lobby.votedOutId = null;
  lobby.guessOutcome = null;

  // Jedem Spieler EINZELN sein eigenes Wort schicken (privat, über seine eigene Verbindung)
  lobby.players.forEach(p => {
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

function broadcastLobbyState(lobby, extra = {}) {
  io.to(lobby.code).emit('lobby-state', {
    code: lobby.code,
    phase: lobby.phase,
    players: publicPlayerList(lobby),
    settings: lobby.settings,
    hostId: lobby.hostId,
    ...extra
  });
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
    lobby.votedOutId = null;
    lobby.phase = 'results';
    broadcastResults(lobby);
    return;
  }

  lobby.votedOutId = topIds[0];

  if (lobby.imposterIds.has(lobby.votedOutId)) {
    lobby.phase = 'guess';
    broadcastLobbyState(lobby, { phase: 'guess', votedOutId: lobby.votedOutId, voteCounts: counts });
  } else {
    lobby.phase = 'results';
    broadcastResults(lobby);
  }
}

function broadcastResults(lobby) {
  const imposterNames = lobby.players
    .filter(p => lobby.imposterIds.has(p.id))
    .map(p => p.name);

  io.to(lobby.code).emit('round-results', {
    word: lobby.secretWord,
    category: lobby.secretCategory,
    voteCounts: lobby.lastVoteCounts || null,
    votedOutId: lobby.votedOutId,
    imposterNames,
    guessOutcome: lobby.guessOutcome
  });
  broadcastLobbyState(lobby, { phase: 'results' });
}

io.on('connection', (socket) => {

  socket.on('create-lobby', ({ name, settings }, callback) => {
    const code = makeLobbyCode();
    const player = { id: socket.id, socketId: socket.id, name: name.trim().slice(0, 16) || 'Spieler', connected: true };
    const lobby = {
      code,
      hostId: socket.id,
      players: [player],
      settings: {
        imposterCount: Math.max(1, Math.min(4, settings.imposterCount || 1)),
        category: settings.category || 'alle',
        useHints: !!settings.useHints,
        useVoting: settings.useVoting !== false
      },
      phase: 'lobby',
      secretWord: null,
      secretCategory: null,
      imposterIds: new Set(),
      votes: {},
      readyPlayers: new Set(),
      votedOutId: null,
      guessOutcome: null,
      lastVoteCounts: null
    };
    lobbies[code] = lobby;
    socket.join(code);
    socket.data.lobbyCode = code;
    callback({ ok: true, code, playerId: socket.id });
    broadcastLobbyState(lobby);
  });

  socket.on('join-lobby', ({ name, code }, callback) => {
    const lobby = lobbies[(code || '').toUpperCase()];
    if (!lobby) {
      callback({ ok: false, error: 'Diese Lobby gibt es nicht. Code prüfen?' });
      return;
    }
    if (lobby.phase !== 'lobby') {
      callback({ ok: false, error: 'Diese Runde läuft schon. Warte auf die nächste Runde.' });
      return;
    }
    if (lobby.players.length >= 12) {
      callback({ ok: false, error: 'Die Lobby ist voll (max. 12 Spieler).' });
      return;
    }
    const player = { id: socket.id, socketId: socket.id, name: (name || '').trim().slice(0, 16) || 'Spieler', connected: true };
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
      useHints: !!settings.useHints,
      useVoting: settings.useVoting !== false
    };
    broadcastLobbyState(lobby);
  });

  socket.on('start-round', () => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.hostId !== socket.id) return;
    if (lobby.players.length < 3) return;
    startRound(lobby);
  });

  socket.on('ready-for-voting', () => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.phase !== 'reveal') return;

    lobby.readyPlayers.add(socket.id);

    const connected = connectedPlayers(lobby);
    const readyCount = connected.filter(p => lobby.readyPlayers.has(p.id)).length;

    io.to(lobby.code).emit('ready-progress', { readyCount, totalCount: connected.length });

    // Erst weiter, wenn WIRKLICH ALLE verbundenen Spieler bereit sind —
    // nicht nur der erste, der klickt.
    if (readyCount < connected.length) return;

    lobby.phase = lobby.settings.useVoting ? 'voting' : 'results';
    lobby.votes = {};
    if (lobby.phase === 'results') {
      lobby.votedOutId = null;
      lobby.guessOutcome = null;
      broadcastResults(lobby);
    } else {
      broadcastLobbyState(lobby, { phase: 'voting' });
    }
  });

  socket.on('cast-vote', ({ targetId }) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.phase !== 'voting') return;
    if (targetId === socket.id) return; // keine Selbstwahl
    lobby.votes[socket.id] = targetId;

    const connected = connectedPlayers(lobby);
    const votedCount = connected.filter(p => lobby.votes[p.id] !== undefined).length;
    io.to(lobby.code).emit('vote-progress', { votedCount, totalCount: connected.length });

    if (votedCount >= connected.length) {
      tallyVotesAndProceed(lobby);
    }
  });

  socket.on('submit-guess', ({ guess }) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.phase !== 'guess') return;
    if (socket.id !== lobby.votedOutId) return; // nur der rausgewählte Imposter darf raten
    const correct = normalize(guess || '') === normalize(lobby.secretWord) && (guess || '').trim().length > 0;
    lobby.guessOutcome = correct ? 'correct' : 'wrong';
    lobby.phase = 'results';
    broadcastResults(lobby);
  });

  socket.on('next-round', () => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.hostId !== socket.id) return;
    if (lobby.players.length < 3) return;
    lobby.phase = 'lobby';
    startRound(lobby);
  });

  socket.on('back-to-lobby', () => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby || lobby.hostId !== socket.id) return;
    lobby.phase = 'lobby';
    broadcastLobbyState(lobby);
  });

  socket.on('chat-message', ({ text }) => {
    const lobby = lobbies[socket.data.lobbyCode];
    if (!lobby) return;
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;
    const msg = (text || '').trim().slice(0, 200);
    if (!msg) return;
    const idx = lobby.players.indexOf(player);
    const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
    // Nachricht an alle in der Lobby senden
    io.to(lobby.code).emit('chat-message', {
      name: player.name,
      color,
      text: msg,
      ts: Date.now()
    });
  });

  socket.on('disconnect', () => {
    const code = socket.data.lobbyCode;
    const lobby = lobbies[code];
    if (!lobby) return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (player) player.connected = false;

    // Lobby nur entfernen, wenn wirklich niemand mehr verbunden ist
    const anyoneConnected = lobby.players.some(p => p.connected);
    if (!anyoneConnected) {
      delete lobbies[code];
      return;
    }

    // Falls der Host die Verbindung verliert, Host-Rolle weitergeben
    if (lobby.hostId === socket.id) {
      const newHost = lobby.players.find(p => p.connected);
      if (newHost) lobby.hostId = newHost.id;
    }

    // Falls der Verbindungsverlust mitten in einer Warte-Phase passiert,
    // prüfen ob die übrigen, verbundenen Spieler jetzt vollständig sind —
    // sonst bleibt das Spiel für alle anderen für immer hängen.
    if (lobby.phase === 'reveal') {
      const connected = connectedPlayers(lobby);
      const readyCount = connected.filter(p => lobby.readyPlayers.has(p.id)).length;
      if (connected.length > 0 && readyCount >= connected.length) {
        lobby.phase = lobby.settings.useVoting ? 'voting' : 'results';
        lobby.votes = {};
        if (lobby.phase === 'results') {
          lobby.votedOutId = null;
          lobby.guessOutcome = null;
          broadcastResults(lobby);
          return;
        }
      }
    } else if (lobby.phase === 'voting') {
      const connected = connectedPlayers(lobby);
      const votedCount = connected.filter(p => lobby.votes[p.id] !== undefined).length;
      if (connected.length > 0 && votedCount >= connected.length) {
        tallyVotesAndProceed(lobby);
        return;
      }
    } else if (lobby.phase === 'guess' && lobby.votedOutId === socket.id) {
      // Die Person, die raten sollte, ist weg — werten als falsch geraten und weiter
      lobby.guessOutcome = 'wrong';
      lobby.phase = 'results';
      broadcastResults(lobby);
      return;
    }

    broadcastLobbyState(lobby);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
