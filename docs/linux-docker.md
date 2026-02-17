# OpenClaw in Docker installieren

> Getestet auf Debian 12 mit Docker 28.5.2.
> Fuer User die OpenClaw isoliert in einem Container betreiben wollen.

## Voraussetzungen

- Linux mit Docker installiert
- Mindestens 2 GB RAM + 2 GB Swap (4 GB RAM empfohlen)
- API-Key eines Providers

## Wichtig: RAM und Swap

Bei Servern mit 2 GB RAM oder weniger **muss** Swap eingerichtet werden,
bevor Docker-Container mit OpenClaw gestartet werden:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

> Ohne Swap fuehrt `npm install openclaw` im Container zu einem OOM-Kill,
> der den gesamten Server lahmlegen kann (inkl. SSH).

## Option A: Docker-Compose (empfohlen)

```bash
cd docker/
# .env Datei erstellen (siehe Anleitung unten)
docker compose up -d
```

Siehe `docker/docker-compose.yml` und `docker/.env.example` fuer Details.

## Option B: Manuell

### Container starten

```bash
docker run -d --name openclaw-agent ubuntu:24.04 sleep infinity
```

### Abhaengigkeiten installieren

```bash
docker exec openclaw-agent bash -c "\
  apt-get update -qq && \
  apt-get install -y -qq curl git openssl && \
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
  apt-get install -y -qq nodejs"
```

> **Wichtig:** `git` muss installiert sein! Ohne git schlaegt
> `npm install openclaw` fehl mit "unknown git error".

### OpenClaw installieren

```bash
docker exec openclaw-agent npm install -g openclaw@latest
```

### Konfigurieren

```bash
# Setup-Script reinkopieren und ausfuehren
docker cp scripts/setup-openclaw.js openclaw-agent:/tmp/
docker exec openclaw-agent bash -c "\
  openclaw config set gateway.mode local && \
  openclaw doctor --fix && \
  node /tmp/setup-openclaw.js"
```

### Gateway starten

Docker-Container haben kein systemd — deshalb:

```bash
docker exec -d openclaw-agent bash -c "\
  openclaw gateway run --force > /tmp/gateway.log 2>&1"
```

> `gateway install` und `gateway start` funktionieren im Container NICHT,
> weil kein systemd vorhanden ist. Nutze immer `gateway run`.

### Testen

```bash
# Kurz warten bis der Gateway hochgefahren ist
sleep 5

docker exec openclaw-agent openclaw gateway health
docker exec openclaw-agent openclaw agent --agent main \
  --session-id test --message "Hallo!" --json
```

## Bekannte Unterschiede zu nativem Linux

| Aspekt | Nativ | Docker |
|--------|-------|--------|
| systemd | Ja | Nein |
| Gateway-Daemon | systemd-Service | Vordergrund / nohup |
| Performance | 6.7s | 21.5s (bei 2GB + Swap) |
| git noetig | Nein (meist vorinstalliert) | Ja (muss installiert werden) |
| Persistenz | Stabil | Container-abhaengig |

## Container aufraumen

```bash
docker rm -f openclaw-agent
```
