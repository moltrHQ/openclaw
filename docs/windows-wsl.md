# OpenClaw auf Windows (WSL) installieren

> Getestet auf Windows Server 2022 mit WSL1 + Ubuntu 24.04.
> **NICHT EMPFOHLEN** — nutze wenn moeglich einen Linux-Server.

## Warnung

WSL1 hat erhebliche Einschraenkungen fuer OpenClaw:
- Kein systemd → Gateway kann nicht als Daemon laufen
- `config set gateway.auth.token` ist buggy (speichert leere Werte)
- Hintergrundprozesse sterben wenn die WSL-Session endet
- Token-Mismatch Deadlock tritt haeufiger auf
- 2.5x langsamere Agent-Antwortzeiten

**Empfehlung:** Nutze einen Linux-Server (siehe [linux-native.md](linux-native.md)).

## WSL1 vs. WSL2

- **WSL2** braucht Nested Virtualization — auf vielen VPS nicht verfuegbar
- **WSL1** funktioniert, aber mit obigen Einschraenkungen
- Pruefen: `wsl --status` zeigt die aktuelle Version

## Installation

```bash
# In WSL Ubuntu:
npm install -g openclaw@latest
openclaw config set gateway.mode local
openclaw doctor --fix
```

## Token setzen (ACHTUNG: Bug!)

`openclaw config set gateway.auth.token` speichert auf WSL1 leere Werte!

**Workaround:** JSON direkt editieren:

```bash
# Token generieren
TOKEN=$(openssl rand -hex 24)

# Direkt in JSON schreiben (nicht config set verwenden!)
node -e "
const fs = require('fs');
const p = process.env.HOME + '/.openclaw/openclaw.json';
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
c.gateway.auth = c.gateway.auth || {};
c.gateway.auth.mode = 'token';
c.gateway.auth.token = '$TOKEN';
fs.writeFileSync(p, JSON.stringify(c, null, 2));
console.log('Token gesetzt');
"
```

## Gateway starten

```bash
# NICHT gateway start (braucht systemd)
# Stattdessen:
openclaw gateway run --force
```

Der Gateway laeuft im Vordergrund. Fuer persistenten Betrieb:
- `tmux` oder `screen` nutzen
- Oder: In einer zweiten WSL-Session arbeiten

## Token-Mismatch loesen

Wenn "unauthorized: device token mismatch" erscheint:

1. Gateway stoppen: `pkill -f 'openclaw.*gateway'`
2. Token in JSON direkt setzen (siehe oben)
3. Gateway neu starten: `openclaw gateway run --force`

> Dieses Problem tritt auf WSL1 haeufig auf.
> Auf nativem Linux tritt es bei korrekter Einrichtung nicht auf.

## Vergleich

| Metrik | WSL1 | Linux nativ |
|--------|------|-------------|
| Installation | 6 Min | 49s |
| Agent-Antwort | 17s | 6.7s |
| Stabilitaet | Niedrig | Hoch |
| Token-Bug | Ja | Nein |
| systemd | Nein | Ja |
