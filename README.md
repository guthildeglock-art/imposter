# Imposter Online

Eine Mehrspieler-Version des Imposter-Partyspiels. Jeder Spieler nutzt sein
eigenes Gerät (Handy, Laptop, ...) und verbindet sich über einen 4-stelligen
Lobby-Code mit den anderen — egal ob ihr im selben Raum sitzt oder über
verschiedene Städte verteilt seid.

## Wie es aufgebaut ist

```
imposter-online/
  server.js          ← der Server: verwaltet Lobbys, Wörter, Imposter, Abstimmungen
  package.json        ← Liste der benötigten Pakete
  public/
    index.html         ← die Seite, die jeder Spieler im Browser sieht
    style.css          ← Aussehen
    app.js              ← Logik im Browser: spricht mit dem Server per Socket.io
```

**Das Grundprinzip:** `server.js` läuft dauerhaft auf einem Server und ist die
einzige Stelle, die das geheime Wort und die Imposter-Rollen kennt. Jedes
Gerät verbindet sich per **Socket.io** (Echtzeit-Verbindung über das Internet)
mit dem Server. Wenn eine Runde startet, schickt der Server **jedem Spieler
einzeln und privat** sein eigenes Wort bzw. seine Imposter-Rolle — niemand
sonst sieht das, weil es nur über die eigene Verbindung dieses einen Geräts
verschickt wird.

## Lokal testen (auf deinem eigenen Computer)

Du brauchst [Node.js](https://nodejs.org) (Version 18 oder neuer).

```bash
cd imposter-online
npm install
npm start
```

Dann im Browser `http://localhost:3000` öffnen. Für einen Test mit "mehreren
Geräten" kannst du einfach mehrere Browser-Tabs öffnen — jeder Tab verhält
sich wie ein eigener Spieler.

## Online stellen, damit andere mitspielen können

Dein eigener Computer ist normalerweise nicht dauerhaft und öffentlich übers
Internet erreichbar — dafür brauchst du einen Hosting-Anbieter, der den
Server für dich laufen lässt. Zwei kostenlose, einfache Optionen:

### Render.com (empfohlen für den Einstieg)

1. Lade dein Projekt zu GitHub hoch (gleicher Ablauf wie beim Pong-Spiel:
   Account erstellen, neues Repository, Dateien hochladen)
2. Geh auf [render.com](https://render.com) und erstelle einen kostenlosen
   Account
3. Klicke auf **New → Web Service** und verbinde dein GitHub-Repository
4. Bei den Einstellungen:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Klicke auf **Create Web Service**

Nach ein paar Minuten bekommst du eine URL wie
`https://dein-spiel.onrender.com` — die kannst du an alle Mitspieler
schicken, egal wo sie sind.

Ein Hinweis zur kostenlosen Stufe: Der Server "schläft" nach einer Weile
Inaktivität ein und braucht beim ersten Aufruf danach ein paar Sekunden zum
Aufwachen. Für ein Partyspiel ist das meist kein Problem.

### Railway.app (Alternative)

Funktioniert sehr ähnlich: GitHub-Repository verbinden, Railway erkennt
automatisch, dass es ein Node.js-Projekt ist, und deployed es automatisch.

## Wie die Lobby-Auswahl am Anfang funktioniert

Beim Öffnen der Seite sieht jeder zuerst den Start-Bildschirm mit zwei
Möglichkeiten:

- **Neue Lobby erstellen** — der Server erzeugt einen zufälligen 4-stelligen
  Code (z.B. `K7QX`) und macht diese Person automatisch zum Host
- **Einer Lobby beitreten** — Code eingeben, der vom Host geteilt wurde

Der Host sieht im Warteraum zusätzlich die Spieleinstellungen (Anzahl
Imposter, Kategorie, Tipps, Abstimmung an/aus) und einen "Spiel starten"
Button. Alle anderen sehen nur "Warte, bis der Host startet".

## Mögliche nächste Schritte

- Eigene Wörter/Kategorien hinzufügen (in `server.js`, ganz oben bei `WORDS`)
- Eine Bestenliste über mehrere Runden hinweg
- Einen Timer für die Diskussionsphase
- Reconnect-Logik verbessern, falls jemand kurz die Verbindung verliert
  (Grundgerüst dafür ist schon da: Spieler werden nicht sofort entfernt,
  sondern nur als "getrennt" markiert)
