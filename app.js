const socket = io();
let myId = null, isHost = false, lobbyCode = null, currentPlayers = [];
let myColor = '#5dcaa5';

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  renderChatInAllPanels();
}

function nameOf(id) { const p = currentPlayers.find(p => p.id === id); return p ? p.name : '?'; }
function colorOf(id) { const p = currentPlayers.find(p => p.id === id); return p ? p.color : '#aaa'; }
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ---- Modus-Auswahl ----
function showModeSelect() { showScreen('screen-mode'); }
document.getElementById('onlineModeBtn').addEventListener('click', () => showScreen('screen-start'));
document.getElementById('offlineModeBtn').addEventListener('click', () => { showScreen('screen-offline'); startOfflineMode(); });
document.getElementById('backToModeBtn').addEventListener('click', showModeSelect);

// ---- URL ?join=CODE ----
const urlParams = new URLSearchParams(window.location.search);
const joinFromUrl = urlParams.get('join');
if (joinFromUrl) { document.getElementById('joinCodeInput').value = joinFromUrl.toUpperCase().slice(0,4); showScreen('screen-start'); }

// ---- Lobby erstellen ----
document.getElementById('createLobbyBtn').addEventListener('click', () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { document.getElementById('startError').textContent = 'Bitte zuerst Namen eingeben.'; return; }
  document.getElementById('startError').textContent = '';
  socket.emit('create-lobby', { name, settings: { imposterCount:1, category:'alle', useHints:false, useVoting:true } }, res => {
    if (!res.ok) { document.getElementById('startError').textContent = res.error || 'Fehler.'; return; }
    myId = res.playerId; lobbyCode = res.code; isHost = true;
    showScreen('screen-lobby'); showQrCode(res.code);
  });
});

function showQrCode(code) {
  const wrap = document.getElementById('qrCodeWrap');
  const target = document.getElementById('qrCode');
  if (typeof QRCode === 'undefined') { wrap.style.display = 'none'; return; }
  target.innerHTML = '';
  new QRCode(target, { text: window.location.origin + window.location.pathname + '?join=' + code, width:160, height:160, colorDark:'#1a1a1a', colorLight:'#ffffff' });
  wrap.style.display = 'block';
}

// ---- Beitreten ----
document.getElementById('joinLobbyBtn').addEventListener('click', () => {
  const name = document.getElementById('nameInput').value.trim();
  const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
  if (!name) { document.getElementById('startError').textContent = 'Bitte zuerst Namen eingeben.'; return; }
  if (code.length !== 4) { document.getElementById('startError').textContent = 'Code hat 4 Zeichen.'; return; }
  document.getElementById('startError').textContent = '';
  socket.emit('join-lobby', { name, code }, res => {
    if (!res.ok) { document.getElementById('startError').textContent = res.error || 'Fehler.'; return; }
    myId = res.playerId; lobbyCode = res.code; isHost = false;
    showScreen('screen-lobby');
  });
});

// ---- Einstellungen ----
const imposterCountInput = document.getElementById('imposterCount');
const imposterCountOut = document.getElementById('imposterCountOut');
const categorySelect = document.getElementById('category');
const hintToggle = document.getElementById('hintToggle');
const votingToggle = document.getElementById('votingToggle');

function sendSettings() {
  if (!isHost) return;
  socket.emit('update-settings', {
    imposterCount: +imposterCountInput.value, category: categorySelect.value,
    useHints: hintToggle.checked, useVoting: votingToggle.checked
  });
}
imposterCountInput.addEventListener('input', () => { imposterCountOut.textContent = imposterCountInput.value; sendSettings(); });
categorySelect.addEventListener('change', sendSettings);
hintToggle.addEventListener('change', sendSettings);
votingToggle.addEventListener('change', sendSettings);
document.getElementById('startRoundBtn').addEventListener('click', () => socket.emit('start-round'));

// ---- Reveal ----
document.getElementById('toVotingBtn').addEventListener('click', () => {
  document.getElementById('toVotingBtn').disabled = true;
  document.getElementById('waitingForOthers').style.display = 'block';
  socket.emit('ready-for-voting');
});

// ---- Describe ----
document.getElementById('submitHintBtn').addEventListener('click', submitHint);
document.getElementById('hintInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitHint(); });

function submitHint() {
  const val = document.getElementById('hintInput').value.trim();
  if (!val) return;
  socket.emit('submit-hint', { hint: val });
  document.getElementById('hintInput').value = '';
  document.getElementById('submitHintBtn').disabled = true;
  document.getElementById('hintInput').disabled = true;
}

function renderDescribeScreen(data) {
  const isMyTurn = data.currentId === myId;
  document.getElementById('describeMyTurn').style.display = isMyTurn ? 'block' : 'none';
  document.getElementById('describeWaiting').style.display = isMyTurn ? 'none' : 'block';

  if (isMyTurn) {
    document.getElementById('hintInput').disabled = false;
    document.getElementById('submitHintBtn').disabled = false;
    document.getElementById('hintInput').focus();
    const turnNum = (data.describeIdx + 1);
    const total = data.describeOrder.length;
    document.getElementById('describeTurnLabel').textContent = `Du bist dran (${turnNum} von ${total})`;
  } else {
    const name = nameOf(data.currentId);
    const color = colorOf(data.currentId);
    document.getElementById('describeCurrentName').innerHTML = `<span style="color:${color}">${escHtml(name)}</span>`;
  }

  // Liste der bereits eingereichten Hinweise
  const listEl = document.getElementById('describeSubmittedList');
  const hints = data.submittedHints || {};
  const entries = Object.entries(hints);
  if (entries.length === 0) {
    listEl.innerHTML = '<p class="muted small">Noch keine Hinweise eingegeben</p>';
  } else {
    listEl.innerHTML = entries.map(([id, h]) => {
      const color = colorOf(id);
      return `<div class="vote-results-row"><span style="color:${color};font-weight:500">${escHtml(h.name)}</span><span>${escHtml(h.text)}</span></div>`;
    }).join('');
  }

  showScreen('screen-describe');
}

// ---- Voting ----
function renderVoteOptions() {
  const wrap = document.getElementById('voteOptions');
  wrap.innerHTML = '';
  currentPlayers.forEach(p => {
    const btn = document.createElement('button');
    btn.textContent = p.name;
    if (p.id === myId) { btn.disabled = true; btn.style.opacity = '0.3'; }
    else btn.addEventListener('click', () => {
      socket.emit('cast-vote', { targetId: p.id });
      wrap.querySelectorAll('button').forEach(b => b.disabled = true);
      btn.style.borderColor = '#5dcaa5'; btn.style.color = '#5dcaa5';
    });
    wrap.appendChild(btn);
  });
}

// ---- Guess ----
document.getElementById('submitGuessBtn').addEventListener('click', () => {
  socket.emit('submit-guess', { guess: document.getElementById('guessInput').value });
  document.getElementById('submitGuessBtn').disabled = true;
});

// ---- Results ----
document.getElementById('nextRoundBtn').addEventListener('click', () => socket.emit('next-round'));
document.getElementById('backToSettingsBtn').addEventListener('click', () => socket.emit('back-to-lobby'));

// ---- Chat ----
let chatLog = [];

function addChatMsg(name, color, text, system = false) {
  chatLog.push({ name, color, text, system });
  renderChatInAllPanels();
}

function renderChatInAllPanels() {
  const html = chatLog.map(m =>
    m.system
      ? `<div class="chat-msg system">${escHtml(m.text)}</div>`
      : `<div class="chat-msg"><span class="chat-name" style="color:${m.color}">${escHtml(m.name)}:</span> ${escHtml(m.text)}</div>`
  ).join('');
  document.querySelectorAll('.chat-messages').forEach(el => {
    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;
  });
}

function bindAllChatInputs() {
  [
    ['chatInput','chatSendBtn'],
    ['chatInputReveal','chatSendBtnReveal'],
    ['chatInputDescribe','chatSendBtnDescribe'],
    ['chatInputVoting','chatSendBtnVoting'],
    ['chatInputGuess','chatSendBtnGuess'],
    ['chatInputResults','chatSendBtnResults'],
  ].forEach(([inputId, btnId]) => {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input || !btn) return;
    btn.onclick = () => sendChat(input);
    input.onkeydown = e => { if (e.key === 'Enter') sendChat(input); };
  });
}

function sendChat(input) {
  const txt = input.value.trim();
  if (!txt) return;
  socket.emit('chat-message', { text: txt });
  input.value = '';
}
bindAllChatInputs();

// ---- Server-Events ----

socket.on('lobby-state', state => {
  currentPlayers = state.players;
  lobbyCode = state.code;
  isHost = state.hostId === myId;
  const me = state.players.find(p => p.id === myId);
  if (me) myColor = me.color;

  document.getElementById('lobbyCodeDisplay').textContent = state.code;
  document.getElementById('playerCountLabel').textContent = state.players.length;

  const listEl = document.getElementById('playerList');
  listEl.innerHTML = '';
  state.players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'player-row' + (p.connected ? '' : ' disconnected');
    const dot = document.createElement('span');
    dot.className = 'player-name-dot'; dot.style.background = p.color;
    const nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'display:flex;align-items:center';
    nameSpan.appendChild(dot);
    nameSpan.appendChild(document.createTextNode(p.name + (p.connected ? '' : ' (getrennt)')));
    row.appendChild(nameSpan);
    if (p.id === state.hostId) {
      const badge = document.createElement('span');
      badge.className = 'host-badge'; badge.textContent = 'Host';
      row.appendChild(badge);
    }
    listEl.appendChild(row);
  });

  imposterCountInput.value = state.settings.imposterCount;
  imposterCountOut.textContent = state.settings.imposterCount;
  categorySelect.value = state.settings.category;
  hintToggle.checked = state.settings.useHints;
  votingToggle.checked = state.settings.useVoting;

  document.getElementById('hostSettings').style.display = isHost ? 'block' : 'none';
  document.getElementById('guestWaiting').style.display = isHost ? 'none' : 'block';
  document.getElementById('needMorePlayers').style.display = state.players.length < 3 ? 'block' : 'none';
  document.getElementById('startRoundBtn').disabled = state.players.length < 3;

  if (state.phase === 'lobby') showScreen('screen-lobby');
  else if (state.phase === 'voting') {
    document.getElementById('voteProgress').textContent = '';
    renderVoteOptions();
    showScreen('screen-voting');
  } else if (state.phase === 'guess' && state.votedOutId) {
    const isMe = state.votedOutId === myId;
    document.getElementById('guessCardSelf').style.display = isMe ? 'block' : 'none';
    document.getElementById('guessCardOthers').style.display = isMe ? 'none' : 'block';
    if (!isMe) document.getElementById('guessWaitingText').textContent = nameOf(state.votedOutId) + ' darf jetzt das Wort erraten…';
    else { document.getElementById('guessInput').value = ''; document.getElementById('submitGuessBtn').disabled = false; }
    showScreen('screen-guess');
  }
});

socket.on('your-role', data => {
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
  addChatMsg('', '', '🃏 Alle haben ihr Wort gesehen!', true);
  showScreen('screen-reveal');
});

socket.on('ready-progress', ({ readyCount, totalCount }) => {
  const el = document.getElementById('waitingForOthers');
  el.textContent = readyCount + ' von ' + totalCount + ' sind bereit…';
  el.style.display = 'block';
});

socket.on('describe-turn', data => {
  renderDescribeScreen(data);
  if (data.describeIdx === 0 && Object.keys(data.submittedHints || {}).length === 0) {
    addChatMsg('', '', '✏️ Beschreibungsrunde startet — jeder ist nacheinander dran!', true);
  }
});

socket.on('vote-progress', ({ votedCount, totalCount }) => {
  document.getElementById('voteProgress').textContent = votedCount + ' von ' + totalCount + ' haben abgestimmt';
});

socket.on('chat-message', ({ name, color, text }) => {
  addChatMsg(name, color, text);
});

socket.on('round-results', data => {
  const outcomeBox = document.getElementById('guessOutcomeBox');
  if (data.guessOutcome === 'correct') {
    outcomeBox.style.display = 'block';
    document.getElementById('guessOutcomeText').textContent = nameOf(data.votedOutId) + ' hat das Wort richtig erraten';
    document.getElementById('guessOutcomeSub').textContent = 'Die Imposter gewinnen trotzdem';
  } else if (data.guessOutcome === 'wrong') {
    outcomeBox.style.display = 'block';
    document.getElementById('guessOutcomeText').textContent = nameOf(data.votedOutId) + ' hat das Wort nicht erraten';
    document.getElementById('guessOutcomeSub').textContent = 'Die Gruppe gewinnt';
  } else { outcomeBox.style.display = 'none'; }

  document.getElementById('resultWord').textContent = data.word;

  const listEl = document.getElementById('voteResultsList');
  const card = document.getElementById('voteResultsCard');
  listEl.innerHTML = '';
  if (data.voteCounts) {
    card.style.display = 'block';
    const maxV = Math.max(...Object.values(data.voteCounts));
    Object.keys(data.voteCounts).sort((a,b)=>data.voteCounts[b]-data.voteCounts[a]).forEach(id => {
      const cnt = data.voteCounts[id];
      const isImp = data.imposterNames.includes(nameOf(id));
      const top = cnt === maxV && maxV > 0;
      const row = document.createElement('div');
      row.className = 'vote-results-row' + (top ? ' top' : '');
      row.innerHTML = `<span>${escHtml(nameOf(id))}${isImp?' <span class="imposter-tag">(Imposter)</span>':''}</span><span>${cnt} ${cnt===1?'Stimme':'Stimmen'}</span>`;
      listEl.appendChild(row);
    });
  } else { card.style.display = 'none'; }

  document.getElementById('resultImposters').textContent = data.imposterNames.join(', ');
  document.getElementById('hostResultActions').style.display = isHost ? 'block' : 'none';
  document.getElementById('guestResultWaiting').style.display = isHost ? 'none' : 'block';

  addChatMsg('', '', '🏁 Runde vorbei! Das Wort war: ' + data.word, true);
  showScreen('screen-results');
});

socket.on('disconnect', () => { document.getElementById('connError').style.display = 'block'; });
