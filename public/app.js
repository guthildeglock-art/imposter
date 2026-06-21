// app.js — läuft im Browser jedes einzelnen Spielers.
// Kommuniziert per Socket.io in Echtzeit mit dem Server (server.js).

const socket = io();

let myId = null;
let isHost = false;
let lobbyCode = null;
let currentPlayers = [];

// ---- Hilfsfunktion: zwischen Bildschirmen wechseln ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function nameOf(id) {
  const p = currentPlayers.find(p => p.id === id);
  return p ? p.name : '?';
}

// ============ START-BILDSCHIRM ============
const nameInput = document.getElementById('nameInput');
const joinCodeInput = document.getElementById('joinCodeInput');
const startError = document.getElementById('startError');

document.getElementById('createLobbyBtn').addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) { startError.textContent = 'Bitte gib zuerst deinen Namen ein.'; return; }
  startError.textContent = '';

  socket.emit('create-lobby', {
    name,
    settings: { imposterCount: 1, category: 'alle', useHints: false, useVoting: true }
  }, (res) => {
    if (!res.ok) { startError.textContent = res.error || 'Konnte Lobby nicht erstellen.'; return; }
    myId = res.playerId;
    lobbyCode = res.code;
    isHost = true;
    showScreen('screen-lobby');
  });
});

document.getElementById('joinLobbyBtn').addEventListener('click', () => {
  const name = nameInput.value.trim();
  const code = joinCodeInput.value.trim().toUpperCase();
  if (!name) { startError.textContent = 'Bitte gib zuerst deinen Namen ein.'; return; }
  if (code.length !== 4) { startError.textContent = 'Der Code hat 4 Zeichen.'; return; }
  startError.textContent = '';

  socket.emit('join-lobby', { name, code }, (res) => {
    if (!res.ok) { startError.textContent = res.error || 'Beitritt fehlgeschlagen.'; return; }
    myId = res.playerId;
    lobbyCode = res.code;
    isHost = false;
    showScreen('screen-lobby');
  });
});

// ============ WARTERAUM ============
const imposterCountInput = document.getElementById('imposterCount');
const imposterCountOut = document.getElementById('imposterCountOut');
const categorySelect = document.getElementById('category');
const hintToggle = document.getElementById('hintToggle');
const votingToggle = document.getElementById('votingToggle');

function sendSettingsUpdate() {
  if (!isHost) return;
  socket.emit('update-settings', {
    imposterCount: parseInt(imposterCountInput.value, 10),
    category: categorySelect.value,
    useHints: hintToggle.checked,
    useVoting: votingToggle.checked
  });
}

imposterCountInput.addEventListener('input', () => {
  imposterCountOut.textContent = imposterCountInput.value;
  sendSettingsUpdate();
});
categorySelect.addEventListener('change', sendSettingsUpdate);
hintToggle.addEventListener('change', sendSettingsUpdate);
votingToggle.addEventListener('change', sendSettingsUpdate);

document.getElementById('startRoundBtn').addEventListener('click', () => {
  socket.emit('start-round');
});

// ============ REVEAL ============
document.getElementById('toVotingBtn').addEventListener('click', () => {
  document.getElementById('toVotingBtn').disabled = true;
  document.getElementById('waitingForOthers').style.display = 'block';
  socket.emit('ready-for-voting');
});

// ============ VOTING ============
function renderVoteOptions() {
  const wrap = document.getElementById('voteOptions');
  wrap.innerHTML = '';
  currentPlayers.forEach(p => {
    const btn = document.createElement('button');
    btn.textContent = p.name;
    if (p.id === myId) {
      btn.disabled = true;
      btn.style.opacity = '0.3';
    } else {
      btn.addEventListener('click', () => {
        socket.emit('cast-vote', { targetId: p.id });
        wrap.querySelectorAll('button').forEach(b => b.disabled = true);
        btn.style.borderColor = '#5dcaa5';
        btn.style.color = '#5dcaa5';
      });
    }
    wrap.appendChild(btn);
  });
}

// ============ GUESS ============
document.getElementById('submitGuessBtn').addEventListener('click', () => {
  const guess = document.getElementById('guessInput').value;
  socket.emit('submit-guess', { guess });
  document.getElementById('submitGuessBtn').disabled = true;
});

// ============ RESULTS ============
document.getElementById('nextRoundBtn').addEventListener('click', () => {
  socket.emit('next-round');
});
document.getElementById('backToSettingsBtn').addEventListener('click', () => {
  socket.emit('back-to-lobby');
});

// ============ SERVER-EVENTS EMPFANGEN ============

socket.on('lobby-state', (state) => {
  currentPlayers = state.players;
  lobbyCode = state.code;
  isHost = state.hostId === myId;

  // Warteraum-Anzeige aktualisieren, egal in welcher Phase wir gerade sind
  document.getElementById('lobbyCodeDisplay').textContent = state.code;
  document.getElementById('playerCountLabel').textContent = state.players.length;

  const listEl = document.getElementById('playerList');
  listEl.innerHTML = '';
  state.players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'player-row' + (p.connected ? '' : ' disconnected');
    row.innerHTML = '<span></span>';
    row.querySelector('span').textContent = p.name + (p.connected ? '' : ' (getrennt)');
    if (p.id === state.hostId) {
      const badge = document.createElement('span');
      badge.className = 'host-badge';
      badge.textContent = 'Host';
      row.appendChild(badge);
    }
    listEl.appendChild(row);
  });

  // Einstellungen mit Serverstand synchron halten (für alle sichtbar, nur Host kann ändern)
  imposterCountInput.value = state.settings.imposterCount;
  imposterCountOut.textContent = state.settings.imposterCount;
  categorySelect.value = state.settings.category;
  hintToggle.checked = state.settings.useHints;
  votingToggle.checked = state.settings.useVoting;

  document.getElementById('hostSettings').style.display = isHost ? 'block' : 'none';
  document.getElementById('guestWaiting').style.display = isHost ? 'none' : 'block';
  document.getElementById('needMorePlayers').style.display = state.players.length < 3 ? 'block' : 'none';
  document.getElementById('startRoundBtn').disabled = state.players.length < 3;

  if (state.phase === 'lobby') {
    showScreen('screen-lobby');
  } else if (state.phase === 'voting') {
    document.getElementById('voteProgress').textContent = '';
    renderVoteOptions();
    showScreen('screen-voting');
  } else if (state.phase === 'guess' && state.votedOutId) {
    const isMe = state.votedOutId === myId;
    document.getElementById('guessCardSelf').style.display = isMe ? 'block' : 'none';
    document.getElementById('guessCardOthers').style.display = isMe ? 'none' : 'block';
    if (!isMe) {
      document.getElementById('guessWaitingText').textContent = nameOf(state.votedOutId) + ' wurde rausgewählt und war Imposter';
    } else {
      document.getElementById('guessInput').value = '';
      document.getElementById('submitGuessBtn').disabled = false;
    }
    showScreen('screen-guess');
  }
});

// Eigenes, privates Wort (nur an mich geschickt, niemand sonst sieht das Event)
socket.on('your-role', (data) => {
  document.getElementById('toVotingBtn').disabled = false;
  document.getElementById('waitingForOthers').style.display = 'none';

  document.getElementById('roleCardNormal').style.display = data.isImposter ? 'none' : 'block';
  document.getElementById('roleCardImposter').style.display = data.isImposter ? 'block' : 'none';

  if (!data.isImposter) {
    document.getElementById('revealCategory').textContent = data.category;
    document.getElementById('revealWord').textContent = data.word;
  } else {
    document.getElementById('revealCategoryImp').textContent = data.category;
    document.getElementById('revealHint').textContent = data.hint ? ('Tipp: ' + data.hint) : 'Finde heraus, was das Wort ist';
  }

  showScreen('screen-reveal');
});

socket.on('vote-progress', ({ votedCount, totalCount }) => {
  document.getElementById('voteProgress').textContent = votedCount + ' von ' + totalCount + ' haben abgestimmt';
});

socket.on('round-results', (data) => {
  const outcomeBox = document.getElementById('guessOutcomeBox');
  if (data.guessOutcome === 'correct') {
    outcomeBox.style.display = 'block';
    document.getElementById('guessOutcomeText').textContent = nameOf(data.votedOutId) + ' hat das Wort richtig erraten';
    document.getElementById('guessOutcomeSub').textContent = 'Die Imposter gewinnen trotzdem';
  } else if (data.guessOutcome === 'wrong') {
    outcomeBox.style.display = 'block';
    document.getElementById('guessOutcomeText').textContent = nameOf(data.votedOutId) + ' hat das Wort nicht erraten';
    document.getElementById('guessOutcomeSub').textContent = 'Die Gruppe gewinnt';
  } else {
    outcomeBox.style.display = 'none';
  }

  document.getElementById('resultWord').textContent = data.word;

  const listEl = document.getElementById('voteResultsList');
  const resultsCard = document.getElementById('voteResultsCard');
  listEl.innerHTML = '';

  if (data.voteCounts) {
    resultsCard.style.display = 'block';
    const maxVotes = Math.max(...Object.values(data.voteCounts));
    const sortedIds = Object.keys(data.voteCounts).sort((a, b) => data.voteCounts[b] - data.voteCounts[a]);
    sortedIds.forEach(id => {
      const count = data.voteCounts[id];
      const isTop = count === maxVotes && maxVotes > 0;
      const isImp = data.imposterNames.includes(nameOf(id));
      const row = document.createElement('div');
      row.className = 'vote-results-row' + (isTop ? ' top' : '');
      row.innerHTML = '<span>' + escapeHtml(nameOf(id)) + (isImp ? ' <span class="imposter-tag">(Imposter)</span>' : '') + '</span><span>' + count + ' ' + (count === 1 ? 'Stimme' : 'Stimmen') + '</span>';
      listEl.appendChild(row);
    });
  } else {
    resultsCard.style.display = 'none';
  }

  document.getElementById('resultImposters').textContent = data.imposterNames.join(', ');

  document.getElementById('hostResultActions').style.display = isHost ? 'block' : 'none';
  document.getElementById('guestResultWaiting').style.display = isHost ? 'none' : 'block';

  showScreen('screen-results');
});

socket.on('disconnect', () => {
  document.getElementById('connError').style.display = 'block';
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
