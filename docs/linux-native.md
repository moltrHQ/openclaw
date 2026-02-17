# OpenClaw auf Linux nativ installieren

> Getestet auf Debian 12 (bookworm). Sollte auf Ubuntu 22.04+ und
> anderen systemd-basierten Distributionen identisch funktionieren.

## Voraussetzungen

- Linux mit systemd
- Root-Zugang oder sudo
- Internetverbindung
- API-Key eines Providers (z.B. Minimax)

## Schritt 1: Swap einrichten (bei 2 GB RAM oder weniger)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

> Ohne Swap kann `npm install` bei wenig RAM einen OOM-Kill ausloesen,
> der auch den SSH-Daemon mitnimmt. Dann hilft nur noch ein Reboot
> ueber die Provider-Konsole.

## Schritt 2: Node.js 22 installieren

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version  # erwartet: v22.x.x
```

## Schritt 3: OpenClaw installieren

```bash
npm install -g openclaw@latest
openclaw --version  # erwartet: 2026.2.15 oder neuer
```

Installationszeit: ca. 50 Sekunden auf einem typischen VPS.

## Schritt 4: Grundkonfiguration

```bash
openclaw config set gateway.mode local
openclaw doctor --fix
```

## Schritt 5: Gateway-Token setzen

```bash
# Token generieren
TOKEN=$(openssl rand -hex 24)
echo "Dein Token: $TOKEN"

# Token setzen (funktioniert auf nativem Linux korrekt!)
openclaw config set gateway.auth.mode token
openclaw config set gateway.auth.token "$TOKEN"
```

> Auf WSL1 ist `config set` fuer Token buggy — dort muss man die
> JSON-Datei direkt editieren. Auf nativem Linux funktioniert es.

## Schritt 6: Provider konfigurieren

Nutze das Setup-Script aus diesem Repo:

```bash
# Kopiere die Provider-Config in die OpenClaw-Config
node scripts/setup-openclaw.js
```

Das Script fragt nach deinem API-Key und konfiguriert den Provider.

**Oder manuell:** Bearbeite `~/.openclaw/openclaw.json` und fuege
den Provider-Block aus `examples/providers/` ein.

## Schritt 7: Gateway als systemd-Service starten

```bash
openclaw gateway install
openclaw gateway start
```

Das ist der grosse Vorteil von nativem Linux gegenueber WSL1:
- Gateway laeuft als systemd-Daemon
- Ueberlebt Server-Neustart
- Automatischer Restart bei Crash
- Sauberes Start/Stop

## Schritt 8: Verifizierung

```bash
openclaw gateway health           # erwartet: OK
openclaw models list              # erwartet: dein Provider/Modell
openclaw models status            # erwartet: Auth korrekt
openclaw devices list             # erwartet: 1 Device gepairt
```

## Schritt 9: Test

```bash
openclaw agent --agent main --session-id test \
  --message "Hallo! Wer bist du?" --json
```

Erwartete Antwortzeit mit Minimax M2.5: ca. 6-7 Sekunden.
24 Tools sollten verfuegbar sein (read, write, exec, browser, etc.).

## Performance-Vergleich

| Metrik | Linux nativ | WSL1 | Docker |
|--------|-------------|------|--------|
| Installation | 49s | 6 Min | 22s |
| Agent-Antwort | 6.7s | 17s | 21.5s |
| Gateway-Start | systemd | manuell | manuell |
| Stabilitaet | Hoch | Niedrig | Mittel |

## Deinstallation

```bash
openclaw gateway stop
systemctl --user disable openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
npm uninstall -g openclaw
rm -rf ~/.openclaw
```
