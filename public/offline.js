const OFFLINE_WORDS = {
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
    'Sanduhr','Periskop','Abakus','Tamburin','Kaleidoskop','Briefmarke','Dartscheibe',
    'Bubble-Wrap','Locher','Taschenrechner','Wasserpistole','Yo-Yo','Boomerang','Kazoo','Nähmaschine'
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

const OFFLINE_CAT_LABELS = {
  essen:'Essen & Trinken', orte:'Orte', berufe:'Berufe', tiere:'Tiere',
  gegenstaende:'Gegenstände', sport:'Sport', filme:'Filme', natur:'Natur', alle:'Alle'
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

function olPickWord(cat, customWords) {
  if (customWords && customWords.length > 0) {
    return { word: customWords[Math.floor(Math.random() * customWords.length)], category: 'custom' };
  }
  let pool = cat === 'alle'
    ? Object.entries(OFFLINE_WORDS).flatMap(([k,vs]) => vs.map(v=>({word:v,cat:k})))
    : (OFFLINE_WORDS[cat] || []).map(v=>({word:v,cat}));
  return pool[Math.floor(Math.random()*pool.length)];
}

function olEsc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

let offlineChatMessages = [];

function olAddChat(name, color, text, system=false) {
  offlineChatMessages.push({name,color,text,system});
  olRenderChat();
}

function olRenderChat() {
  const el = document.getElementById('ol-chat-messages');
  if (!el) return;
  el.innerHTML = offlineChatMessages.map(m =>
    m.system
      ? `<div class="chat-msg system">${olEsc(m.text)}</div>`
      : `<div class="chat-msg"><span class="chat-name" style="color:${m.color}">${olEsc(m.name)}:</span> ${olEsc(m.text)}</div>`
  ).join('');
  el.scrollTop = el.scrollHeight;
}

function olRender() {
  const wrap = document.getElementById('screen-offline');
  const s = oState;

  if (s.phase === 'setup') {
    const catOptions = [
      ['alle','Alle Kategorien'],['essen','Essen & Trinken'],['orte','Orte'],
      ['berufe','Berufe'],['tiere','Tiere'],['gegenstaende','Gegenstände'],
      ['sport','Sport'],['filme','Filme'],['natur','Natur']
    ].map(([v,l]) => `<option value="${v}" ${s.settings.category===v?'selected':''}>${l}</option>`).join('');

    const customList = (s.settings.customWords||[]).map(w =>
      `<div class="player-row" style="justify-content:space-between;">
        <span>${olEsc(w)}</span>
        <button onclick="olRemoveCustomWord('${olEsc(w)}')" style="width:auto;min-height:unset;padding:2px 8px;font-size:13px;border-color:#e07b6a;color:#e07b6a;">✕</button>
      </div>`
    ).join('');

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
          <select id="ol-cat">${catOptions}</select>
        </div>
        <div class="card">
          <label class="checkbox-row"><input type="checkbox" id="ol-hint" ${s.settings.useHints?'checked':''}><span>Imposter bekommen einen Tipp</span></label>
          <label class="checkbox-row" style="margin-top:10px"><input type="checkbox" id="ol-vote" ${s.settings.useVoting?'checked':''}><span>Abstimmung am Ende</span></label>
        </div>
        <div class="card">
          <p class="muted" style="margin-bottom:8px;">Eigene Wörter <span class="muted small">(überschreibt Standard-Liste)</span></p>
          <div style="display:flex;gap:8px;margin-bottom:10px;">
            <input type="text" id="ol-custom-input" placeholder="Wort eingeben…" maxlength="50" style="flex:1;">
            <button onclick="olAddCustomWord()" class="send-btn" style="width:48px;">+</button>
          </div>
          ${customList || '<p class="muted small" id="ol-custom-hint">Noch keine eigenen Wörter — Standard-Liste wird verwendet</p>'}
        </div>
        <button class="primary" onclick="olGoNames()">Weiter zu den Namen</button>
      </div>`;

    document.getElementById('ol-pc').oninput = function() {
      oState.settings.playerCount = +this.value;
      document.getElementById('ol-pc-out').textContent = this.value;
    };
    document.getElementById('ol-ic').oninput = function() {
      oState.settings.imposterCount = +this.value;
      document.getElementById('ol-ic-out').textContent = this.value;
    };
    document.getElementById('ol-custom-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') olAddCustomWord();
    });

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
    olRenderChat(); olBindChat();

  } else if (s.phase === 'reveal') {
    const p = s.players[s.currentIdx];
    const isImp = s.imposterIdxs.has(s.currentIdx);
    const color = PLAYER_COLORS[s.currentIdx % PLAYER_COLORS.length];
    const card = isImp
      ? `<div class="card center">
          <p class="muted small">${olEsc(s.secretCategory)}</p>
          <p class="big-word">Du bist der Imposter</p>
          <p class="muted small">${s.settings.useHints ? 'Finde heraus, was das Wort ist' : 'Finde heraus, was das Wort ist'}</p>
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
    olRenderChat(); olBindChat();

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
    olRenderChat(); olBindChat();

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
    olRenderChat(); olBindChat();

  } else if (s.phase === 'guess') {
    const imp = s.players[s.votedOutIdx];
    const color = PLAYER_COLORS[s.votedOutIdx % PLAYER_COLORS.length];
    wrap.innerHTML = `
      <div class="with-chat" style="flex:1;display:flex;flex-direction:column">
        <div class="game-area" style="flex:1">
          <div class="card center">
            <p class="muted small">wurde rausgewählt und war Imposter</p>
            <p style="font-weight:500;color:${color}">${olEsc(imp.name)}</p>
          </div>
          <input type="text" id="ol-guess" placeholder="Deine Vermutung">
          <button class="primary" style="margin-top:10px" onclick="olSubmitGuess()">Vermutung abgeben</button>
        </div>
        ${olChatHTML()}
      </div>`;
    olRenderChat(); olBindChat();

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
      const rows = Object.entries(s.voteCounts).sort((a,b)=>b[1]-a[1]).map(([idx,cnt]) => {
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
    olRenderChat(); olBindChat();
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
    olAddChat(name, PLAYER_COLORS[idx % PLAYER_COLORS.length], txt);
    input.value = '';
  }
  btn.onclick = send;
  input.onkeydown = e => { if (e.key === 'Enter') send(); };
}

function olAddCustomWord() {
  const input = document.getElementById('ol-custom-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  if (!oState.settings.customWords) oState.settings.customWords = [];
  if (!oState.settings.customWords.includes(val)) {
    oState.settings.customWords.push(val);
  }
  input.value = '';
  olRender();
}

function olRemoveCustomWord(word) {
  if (!oState.settings.customWords) return;
  oState.settings.customWords = oState.settings.customWords.filter(w => w !== word);
  olRender();
}

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
      useHints: hint ? hint.checked : false,
      useVoting: vote ? vote.checked : true,
      customWords: oState.settings ? (oState.settings.customWords || []) : []
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
  oState.players = Array.from({length: oState.settings.playerCount}, () => ({ name: '' }));
  oState.phase = 'names';
  olRender();
}

function olStartRound() {
  const fields = document.querySelectorAll('[id^="ol-name-"]');
  fields.forEach((f, i) => { oState.players[i].name = f.value.trim() || `Spieler ${i+1}`; });
  olBeginRound();
}

function olNewRound() { olBeginRound(); }

function olBeginRound() {
  const picked = olPickWord(oState.settings.category, oState.settings.customWords);
  oState.secretWord = picked.word;
  oState.secretCategory = picked.category === 'custom' ? 'Eigene Wörter' : (OFFLINE_CAT_LABELS[picked.cat] || OFFLINE_CAT_LABELS[picked.category] || 'Unbekannt');
  const n = oState.players.length;
  const allIdx = Array.from({length:n},(_,i)=>i);
  for (let i=allIdx.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [allIdx[i],allIdx[j]]=[allIdx[j],allIdx[i]]; }
  oState.imposterIdxs = new Set(allIdx.slice(0, Math.min(oState.settings.imposterCount, n-2)));
  oState.currentIdx = 0; oState.votes = {}; oState.voteCounts = null;
  oState.votedOutIdx = null; oState.voteIdx = 0; oState.guessOutcome = null;
  oState.phase = 'pass';
  olRender();
}

function olReveal() { oState.phase = 'reveal'; olRender(); }

function olNextPlayer() {
  oState.currentIdx++;
  if (oState.currentIdx >= oState.players.length) { oState.phase = 'discuss'; oState.currentIdx = 0; }
  else { oState.phase = 'pass'; }
  olRender();
}

function olStartVoting() {
  if (!oState.settings.useVoting) { olShowResults(); return; }
  oState.voteIdx = 0;
  oState.voteCounts = {};
  oState.players.forEach((_,i) => oState.voteCounts[i] = 0);
  oState.phase = 'voting'; olRender();
}

function olCastVote(targetIdx) {
  oState.voteCounts[targetIdx]++;
  oState.voteIdx++;
  if (oState.voteIdx >= oState.players.length) olTally();
  else { oState.phase = 'voting'; olRender(); }
}

function olTally() {
  const counts = oState.voteCounts;
  const maxV = Math.max(...Object.values(counts));
  const topIdxs = Object.keys(counts).filter(k => counts[k] === maxV).map(Number);
  if (maxV === 0 || topIdxs.length !== 1) { oState.votedOutIdx = null; olShowResults(); return; }
  oState.votedOutIdx = topIdxs[0];
  if (oState.imposterIdxs.has(oState.votedOutIdx)) { oState.phase = 'guess'; olRender(); }
  else olShowResults();
}

function olSubmitGuess() {
  const val = document.getElementById('ol-guess').value;
  oState.guessOutcome = olNormalize(val) === olNormalize(oState.secretWord) && val.trim().length > 0 ? 'correct' : 'wrong';
  olShowResults();
}

function olShowResults() { oState.phase = 'results'; olRender(); }

function startOfflineMode() {
  offlineChatMessages = [];
  oState = { phase: 'setup', settings: { playerCount:6, imposterCount:1, category:'alle', useHints:false, useVoting:true, customWords:[] } };
  olRender();
}
