# Moltr + OpenClaw

> KI-Agenten mit externen APIs nutzen — geschuetzt durch Moltr Security Shield.

## Was ist das?

Dieses Repo hilft dir, [OpenClaw](https://openclaw.dev) mit externen API-Providern
(z.B. Minimax M2.5, OpenAI, DeepSeek) einzurichten — gesichert durch
[Moltr Security Shield](https://github.com/moltrHQ/moltr).

**Fuer wen?**
- Du hast **kein Anthropic-Abo** und willst trotzdem KI-Agenten mit Tool-Zugriff nutzen
- Du willst **alternative Provider** (guenstiger, andere Modelle)
- Du willst deine Agenten mit **Moltr Security** schuetzen

## Quick Start (Linux)

```bash
# OpenClaw + Minimax in unter 2 Minuten
git clone https://github.com/moltrHQ/openclaw.git
cd openclaw
chmod +x scripts/install.sh
./scripts/install.sh
```

## Anleitungen

| Plattform | Empfehlung | Anleitung |
|-----------|-----------|-----------|
| Linux nativ | Empfohlen | [docs/linux-native.md](docs/linux-native.md) |
| Docker auf Linux | Fuer Isolation | [docs/linux-docker.md](docs/linux-docker.md) |
| Windows (WSL) | Notloesung | [docs/windows-wsl.md](docs/windows-wsl.md) |

## Getestete Provider

| Provider | Modell | Status | Antwortzeit |
|----------|--------|--------|-------------|
| Minimax | M2.5 | Getestet, funktioniert | 6-7s (Linux nativ) |
| OpenAI | GPT-4o | Template vorhanden | Noch nicht getestet |
| DeepSeek | V3 | Template vorhanden | Noch nicht getestet |

## Bekannte Probleme

Siehe [docs/troubleshooting.md](docs/troubleshooting.md) fuer:
- Token-Mismatch Deadlock (und wie man ihn loest)
- OOM bei Servern mit wenig RAM
- `config set` Bug auf WSL1
- Fehlende git-Abhaengigkeit in Docker

## Voraussetzungen

- **Node.js** >= 22
- **Linux** mit systemd (empfohlen) oder Docker
- **API-Key** eines unterstuetzten Providers
- Optional: [Moltr Security Shield](https://github.com/moltrHQ/moltr) (Python 3.11+)

## RAM-Empfehlungen

| Szenario | Minimum | Empfohlen |
|----------|---------|-----------|
| OpenClaw nativ | 2 GB + Swap | 4 GB |
| OpenClaw in Docker | 2 GB + Swap | 4 GB |
| OpenClaw + Moltr Security | 3 GB + Swap | 4 GB |

## Lizenz

AGPL-3.0 — siehe [LICENSE](LICENSE)

Copyright 2026 Walter Troska / moltrHQ
https://www.moltr.tech
