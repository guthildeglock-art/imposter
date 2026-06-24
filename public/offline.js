// offline.js — Das komplette Offline-Spiel für ein einzelnes Gerät.
// Läuft völlig unabhängig vom Server, keine Netzwerkverbindung nötig.

const OFFLINE_WORDS = {
  essen: ['Pizza','Sushi','Schokolade','Erdbeere','Käse','Spaghetti','Honig','Popcorn'],
  orte: ['Strand','Flughafen','Bücherei','Krankenhaus','Konzert','Friedhof','Schule','Gefängnis'],
  berufe: ['Feuerwehrmann','Lehrer','Pilot','Zahnarzt','Koch','Friseur','Anwalt','Bauer'],
  tiere: ['Elefant','Pinguin','Hai','Eichhörnchen','Oktopus','Kamel','Fledermaus','Koala'],
  gegenstaende: ['Regenschirm','Kopfhörer','Wecker','Spiegel','Leiter','Kerze','Rucksack','Zahnbürste']
};
const OFFLINE_HINTS = {
  Pizza:'Man isst es oft in Dreiecken',Sushi:'Kommt ursprünglich aus Japan',Schokolade:'Schmilzt in der Sonne',
  Erdbeere:'Ist rot und hat kleine Samen außen',Käse:'Wird aus Milch gemacht',Spaghetti:'Lang und dünn',
  Honig:'Wird von Bienen gemacht',Popcorn:'Macht beim Erhitzen Geräusche',
  Strand:'Dort gibt es viel Sand',Flughafen:'Dort starten große Maschinen',Bücherei:'Dort muss man leise sein',
  Krankenhaus:'Dort arbeiten viele Ärzte',Konzert:'Dort wird Musik live gespielt',Friedhof:'Ein sehr ruhiger Ort',
  Schule:'Dort lernen Kinder',Gefängnis:'Ein Ort, den man nicht verlassen darf',
  Feuerwehrmann:'Trägt oft einen Helm bei der Arbeit',Lehrer:'Steht oft vor einer Tafel',Pilot:'Sitzt ganz vorne im Fahrzeug',
  Zahnarzt:'Schaut Menschen oft in den Mund',Koch:'Arbeitet oft mit einer Schürze',Friseur:'Arbeitet mit einer Schere nah am Kopf',
  Anwalt:'Kennt sich gut mit Regeln aus',Bauer:'Arbeitet oft draußen auf dem Feld',
  Elefant:'Hat sehr große Ohren',Pinguin:'Kann nicht fliegen, aber gut schwimmen',Hai:'Lebt im Wasser und hat scharfe Zähne',
  Eichhörnchen:'Sammelt gerne Nüsse',Oktopus:'Hat mehrere Arme',Kamel:'Hat einen oder zwei Höcker',
  Fledermaus:'Ist nachts unterwegs',Koala:'Lebt gerne auf Bäumen',
  Regenschirm:'Braucht man bei schlechtem Wetter',Kopfhörer:'Setzt man sich auf die Ohren',Wecker:'Macht morgens laute Geräusche',
  Spiegel:'Man sieht sich selbst darin',Leiter:'Hilft, hoch hinauf zu kommen',Kerze:'Brennt mit einer kleinen Flamme',
  Rucksack:'Trägt man auf dem Rücken',Zahnbürste:'Benutzt man morgens und abends'
};
const OFFLINE_CAT_LABELS = {
  essen:'Essen & Trinken',orte:'Orte',berufe:'Berufe',tiere:'Tiere',gegenstaende:'Gegenstände'
};
const PLAYER_COLORS = [
  '#5dcaa5','#e07b6a','#6a9ee0','#d4a843',
  '#a06ae0','#e0a06a','#6ae0c8','#e06aab',
  '#8ae06a','#6a6ae0','#e0d46a','#6ab8e0'
];

let oState = {};

function olNormalize(s) {
  return s.trim().toLowerCase()
    .replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss');
}

function olPickWord(cat) {
  let pool = cat === 'alle'
    ? Object.entries(OFFLINE_WORDS).flatMap(([k,vs]) => vs.map(v=>({word:v,cat:k})))
    : OFFLINE_WORDS[cat].map(v=>({word:v,cat}));
  return pool[Math.floor(Math.random()*pool.length)];
}

function olEsc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

// ---- Chat (lokal, nur auf diesem Gerät) ----
let offlineChatMessages = [];

function olAddChat(name, color, text, system=false) {
  offlineChatMessages.push({name, color, text, system});
  olRenderChat();
}

function olRenderChat() {
  const el = document.getElementById('ol-chat-messages');
  if (!el) return;
  el.innerHTML = offlineChatMessages.map(m => {
    if (m.system) return `<div class="chat-msg system">${olEsc(m.text)}</div>`;
    return `<div class="chat-msg"><span class="chat-name" style="color:${m.color}">${olEsc(m.name)}:</span>${olEsc(m.text)}</div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

// ---- Haupt-Render-Funktion ---- 
function olRender() {
  const wrap = document.getElementById('screen-offline');
  const s = oState;

  if (s.phase === 'setup') {
    wrap.innerHTML = `
      <div class="topbar"><button onclick="showModeSelect()" class="back-btn">← Zurück</button><h2>Offline spielen</h2></div>
      <div class="game-area">
        <div class="card">
          <label>Anzahl Spieler</label>
          <div class="row"><input type="range" min="3" max="12" value="${s.settings.playerCount}" step="1" id="ol-pc" style="flex:1"><span id="ol-pc-out" class="num">${s.settings.playerCount}</span></div>
        </div>
        <div class="card">
          <label>Anzahl Imposter</label>
          <div class="row"><input type="range" min="1" max="4" value="${s.settings.imposterCount}" step="1" id="ol-ic" style="flex:1"><span id="ol-ic-out" class="num">${s.settings.imposterCount}</span></div>
        </div>
        <div class="card">
          <label>Kategorie</label>
          <select id="ol-cat">
            <option value="alle" ${s.settings.category==='alle'?'selected':''}>Alle Kategorien</option>
            <option value="essen" ${s.settings.category==='essen'?'selected':''}>Essen &amp; Trinken</option>
            <option value="orte" ${s.settings.category==='orte'?'selected':''}>Orte</option>
            <option value="berufe" ${s.settings.category==='berufe'?'selected':''}>Berufe</option>
            <option value="tiere" ${s.settings.category==='tiere'?'selected':''}>Tiere</option>
            <option value="gegenstaende" ${s.settings.category==='gegenstaende'?'selected':''}>Gegenstände</option>
          </select>
        </div>
        <div class="card">
          <label class="checkbox-row"><input type="checkbox" id="ol-hint" ${s.settings.useHints?'checked':''}><span>Imposter bekommen einen Tipp</span></label>
          <label class="checkbox-row" style="margin-top:10px"><input type="checkbox" id="ol-vote" ${s.settings.useVoting?'checked':''}><span>Abstimmung am Ende</span></label>
        </div>
        <button class="primary" onclick="olGoNames()">Weiter zu den Namen</button>
      </div>`;
    document.getElementById('ol-pc').oninput = function() {
      oState.settings.playerCount = +this.value;
      document.getElementById('ol-pc-out').textContent = this.value;
      const max = Math.max(1, oState.settings.playerCount - 2);
      if (oState.settings.imposterCount > max) oState.settings.imposterCount = max;
    };
    document.getElementById('ol-ic').oninput = function() {
      oState.settings.imposterCount = +this.value;
      document.getElementById('ol-ic-out').textContent = this.value;
    };

  } else if (s.phase === 'names') {
    const inputs = s.players.map((p,i) =>
      `<input type="text" id="ol-name-${i}" placeholder="Spieler ${i+1}" maxlength="16" value="${olEsc(p.name)}" style="margin-bottom:8px">`
    ).join('');
    wrap.innerHTML = `
      <div class="topbar"><button onclick="olGoSetup()" class="back-btn">← Zurück</button><h2>Namen eingeben</h2></div>
      <div class="game-area">
        <p class="muted small" style="margin-bottom:12px">Jeder Spieler trägt seinen Namen ein</p>
        ${inputs}
        <button class="primary" style="margin-top:8px" onclick="olStartRound()">Spiel starten</button>
      </div>`;

  } else if (s.phase === 'pass') {
    const p = s.players[s.currentIdx];
    const color = PLAYER_COLORS[s.currentIdx % PLAYER_COLORS.length];
    wrap.innerHTML = `
      <div class="with-chat" style="flex:1;display:flex;flex-direction:column">
        <div class="game-area" style="flex:1">
          <div class="card center">
            <p class="muted small">Gib das Gerät an</p>
            <p class="big-word" style="color:${color}">${olEsc(p.name)}</p>
          </div>
          <button class="primary" onclick="olReveal()">Wort anzeigen</button>
        </div>
        ${olChatHTML()}
      </div>`;
    olRenderChat();
    olBindChat();

  } else if (s.phase === 'reveal') {
    const p = s.players[s.currentIdx];
    const isImp = s.imposterIdxs.has(s.currentIdx);
    const color = PLAYER_COLORS[s.currentIdx % PLAYER_COLORS.length];
    const card = isImp
      ? `<div class="card center">
          <p class="muted small">${olEsc(s.secretCategory)}</p>
          <p class="big-word">Du bist der Imposter</p>
          <p class="muted small">${s.settings.useHints && OFFLINE_HINTS[s.secretWord] ? 'Tipp: '+OFFLINE_HINTS[s.secretWord] : 'Finde heraus, was das Wort ist'}</p>
         </div>`
      : `<div class="card center">
          <p class="muted small">${olEsc(s.secretCategory)}</p>
          <p class="big-word">${olEsc(s.secretWord)}</p>
         </div>`;
    wrap.innerHTML = `
      <div class="with-chat" style="flex:1;display:flex;flex-direction:column">
        <div class="game-area" style="flex:1">
          <p class="muted small center-text" style="margin-bottom:8px">Nur für <span style="color:${color};font-weight:500">${olEsc(p.name)}</span></p>
          ${card}
          <button class="primary" onclick="olNextPlayer()">Weitergeben</button>
        </div>
        ${olChatHTML()}
      </div>`;
    olRenderChat();
    olBindChat();

  } else if (s.phase === 'discuss') {
    wrap.innerHTML = `
      <div class="with-chat" style="flex:1;display:flex;flex-direction:column">
        <div class="game-area" style="flex:1">
          <div class="card center">
            <p style="font-size:18px;font-weight:500;margin:0">Alle haben ihr Wort gesehen</p>
            <p class="muted small" style="margin-top:8px">${s.settings.useVoting ? 'Diskutiert — dann geht es zur Abstimmung.' : 'Diskutiert — wer ist der Imposter?'}</p>
          </div>
          <button class="primary" onclick="olStartVoting()">${s.settings.useVoting ? 'Zur Abstimmung' : 'Auflösung'}</button>
        </div>
        ${olChatHTML()}
      </div>`;
    olRenderChat();
    olBindChat();

  } else if (s.phase === 'voting') {
    const vIdx = s.voteIdx;
    const voter = s.players[vIdx];
    const color = PLAYER_COLORS[vIdx % PLAYER_COLORS.length];
    const options = s.players.map((p,i) => i === vIdx
      ? `<button disabled style="opacity:0.3">${olEsc(p.name)}</button>`
      : `<button onclick="olCastVote(${i})">${olEsc(p.name)}</button>`
    ).join('');
    wrap.innerHTML = `
      <div class="with-chat" style="flex:1;display:flex;flex-direction:column">
        <div class="game-area" style="flex:1">
          <div class="card center">
            <p class="muted small">Abstimmung</p>
            <p style="font-weight:500;color:${color}">${olEsc(voter.name)}</p>
          </div>
          <p class="muted center-text" style="margin-bottom:10px">Wer ist deiner Meinung nach der Imposter?</p>
          <div class="vote-list">${options}</div>
        </div>
        ${olChatHTML()}
      </div>`;
    olRenderChat();
    olBindChat();

  } else if (s.phase === 'guess') {
    const imp = s.players[s.votedOutIdx];
    const color = PLAYER_COLORS[s.votedOutIdx % PLAYER_COLORS.length];
    wrap.innerHTML = `
      <div class="with-chat" style="flex:1;display:flex;flex-direction:column">
        <div class="game-area" style="flex:1">
          <div class="card center">
            <p class="muted small">wurde rausgewählt und war Imposter</p>
            <p style="font-weight:500;color:${color}">${olEsc(imp.name)}</p>
            <p class="muted small" style="margin-top:6px">Gib das Gerät an diese Person</p>
          </div>
          <p class="muted center-text" style="margin-bottom:10px">Letzte Chance: Was ist das geheime Wort?</p>
          <input type="text" id="ol-guess" placeholder="Deine Vermutung">
          <button class="primary" style="margin-top:10px" onclick="olSubmitGuess()">Vermutung abgeben</button>
        </div>
        ${olChatHTML()}
      </div>`;
    olRenderChat();
    olBindChat();

  } else if (s.phase === 'results') {
    const impNames = s.players.filter((_,i)=>s.imposterIdxs.has(i)).map(p=>p.name).join(', ');
    let outcomeHtml = '';
    if (s.guessOutcome === 'correct') {
      outcomeHtml = `<div class="card center"><p style="font-weight:500">${olEsc(s.players[s.votedOutIdx].name)} hat das Wort richtig erraten</p><p class="muted small">Die Imposter gewinnen trotzdem</p></div>`;
    } else if (s.guessOutcome === 'wrong') {
      outcomeHtml = `<div class="card center"><p style="font-weight:500">${olEsc(s.players[s.votedOutIdx].name)} hat das Wort nicht erraten</p><p class="muted small">Die Gruppe gewinnt</p></div>`;
    }
    let voteHtml = '';
    if (s.settings.useVoting && s.voteCounts) {
      const maxV = Math.max(...Object.values(s.voteCounts));
      const rows = Object.entries(s.voteCounts)
        .sort((a,b)=>b[1]-a[1])
        .map(([idx,cnt]) => {
          const pi = s.players[+idx];
          const isImp = s.imposterIdxs.has(+idx);
          const top = cnt === maxV && maxV > 0;
          return `<div class="vote-results-row${top?' top':''}"><span>${olEsc(pi.name)}${isImp?' <span class="imposter-tag">(Imposter)</span>':''}</span><span>${cnt} ${cnt===1?'Stimme':'Stimmen'}</span></div>`;
        }).join('');
      voteHtml = `<div class="card"><p class="muted small" style="margin-bottom:8px">Stimmen</p>${rows}</div>`;
    }
    wrap.innerHTML = `
      <div class="with-chat" style="flex:1;display:flex;flex-direction:column">
        <div class="game-area" style="flex:1">
          ${outcomeHtml}
          <div class="card center"><p class="muted small">Das Wort war</p><p class="big-word">${olEsc(s.secretWord)}</p></div>
          ${voteHtml}
          <div class="card center"><p class="muted small">Die Imposter waren</p><p style="font-weight:500">${olEsc(impNames)}</p></div>
          <button class="primary" onclick="olNewRound()">Noch eine Runde</button>
          <button style="margin-top:8px" onclick="olGoSetup()">Einstellungen ändern</button>
        </div>
        ${olChatHTML()}
      </div>`;
    olRenderChat();
    olBindChat();
  }
}

function olChatHTML() {
  return `<div class="chat-panel">
    <div class="chat-messages" id="ol-chat-messages"></div>
    <div class="chat-input-row">
      <input type="text" id="ol-chat-input" placeholder="Nachricht…" maxlength="200">
      <button class="send-btn" id="ol-chat-send">➤</button>
    </div>
  </div>`;
}

function olBindChat() {
  const input = document.getElementById('ol-chat-input');
  const btn = document.getElementById('ol-chat-send');
  if (!input || !btn) return;
  function send() {
    const txt = input.value.trim();
    if (!txt) return;
    const currentPlayer = oState.currentIdx !== undefined ? oState.players[oState.currentIdx] : null;
    const name = currentPlayer ? currentPlayer.name : 'Alle';
    const idx = currentPlayer ? oState.currentIdx : 0;
    const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
    olAddChat(name, color, txt);
    input.value = '';
  }
  btn.onclick = send;
  input.onkeydown = e => { if (e.key === 'Enter') send(); };
}

// ---- Aktionen ----

function olGoSetup() {
  const cat = document.getElementById('ol-cat');
  const hint = document.getElementById('ol-hint');
  const vote = document.getElementById('ol-vote');
  oState = {
    phase: 'setup',
    settings: {
      playerCount: oState.settings ? oState.settings.playerCount : 6,
      imposterCount: oState.settings ? oState.settings.imposterCount : 1,
      category: cat ? cat.value : (oState.settings ? oState.settings.category : 'alle'),
      useHints: hint ? hint.checked : (oState.settings ? oState.settings.useHints : false),
      useVoting: vote ? vote.checked : (oState.settings ? oState.settings.useVoting : true)
    }
  };
  olRender();
}

function olGoNames() {
  const cat = document.getElementById('ol-cat').value;
  const hint = document.getElementById('ol-hint').checked;
  const vote = document.getElementById('ol-vote').checked;
  oState.settings.category = cat;
  oState.settings.useHints = hint;
  oState.settings.useVoting = vote;
  oState.players = Array.from({length: oState.settings.playerCount}, (_,i) => ({ name: '' }));
  oState.phase = 'names';
  olRender();
}

function olStartRound() {
  const fields = document.querySelectorAll('[id^="ol-name-"]');
  fields.forEach((f, i) => {
    oState.players[i].name = f.value.trim() || `Spieler ${i+1}`;
  });
  olBeginRound();
}

function olNewRound() {
  olBeginRound();
}

function olBeginRound() {
  const picked = olPickWord(oState.settings.category);
  oState.secretWord = picked.word;
  oState.secretCategory = OFFLINE_CAT_LABELS[picked.cat];
  const n = oState.players.length;
  const allIdx = Array.from({length:n},(_,i)=>i);
  for (let i=allIdx.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [allIdx[i],allIdx[j]]=[allIdx[j],allIdx[i]]; }
  const impCnt = Math.min(oState.settings.imposterCount, n-2);
  oState.imposterIdxs = new Set(allIdx.slice(0, impCnt));
  oState.currentIdx = 0;
  oState.votes = {};
  oState.voteCounts = null;
  oState.votedOutIdx = null;
  oState.voteIdx = 0;
  oState.guessOutcome = null;
  oState.phase = 'pass';
  olRender();
}

function olReveal() {
  oState.phase = 'reveal';
  olRender();
}

function olNextPlayer() {
  oState.currentIdx++;
  if (oState.currentIdx >= oState.players.length) {
    oState.phase = 'discuss';
    oState.currentIdx = 0;
  } else {
    oState.phase = 'pass';
  }
  olRender();
}

function olStartVoting() {
  if (!oState.settings.useVoting) { olShowResults(); return; }
  oState.voteIdx = 0;
  oState.voteCounts = {};
  oState.players.forEach((_,i) => oState.voteCounts[i] = 0);
  oState.phase = 'voting';
  olRender();
}

function olCastVote(targetIdx) {
  oState.voteCounts[targetIdx]++;
  oState.voteIdx++;
  if (oState.voteIdx >= oState.players.length) {
    olTally();
  } else {
    oState.phase = 'voting';
    olRender();
  }
}

function olTally() {
  const counts = oState.voteCounts;
  const maxV = Math.max(...Object.values(counts));
  const topIdxs = Object.keys(counts).filter(k => counts[k] === maxV).map(Number);
  if (maxV === 0 || topIdxs.length !== 1) {
    oState.votedOutIdx = null;
    olShowResults();
    return;
  }
  oState.votedOutIdx = topIdxs[0];
  if (oState.imposterIdxs.has(oState.votedOutIdx)) {
    oState.phase = 'guess';
    olRender();
  } else {
    olShowResults();
  }
}

function olSubmitGuess() {
  const val = document.getElementById('ol-guess').value;
  oState.guessOutcome = olNormalize(val) === olNormalize(oState.secretWord) && val.trim().length > 0 ? 'correct' : 'wrong';
  olShowResults();
}

function olShowResults() {
  oState.phase = 'results';
  olRender();
}

// ---- Einstiegspunkt ----
function startOfflineMode() {
  offlineChatMessages = [];
  oState = {
    phase: 'setup',
    settings: { playerCount: 6, imposterCount: 1, category: 'alle', useHints: false, useVoting: true }
  };
  olRender();
}
