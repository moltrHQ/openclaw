# Moltr + OpenClaw

> Run AI agents with external APIs — protected by Moltr Security Shield.

## What is this?

This repo helps you set up [OpenClaw](https://openclaw.dev) with external API providers
(e.g. Minimax M2.5, OpenAI, DeepSeek) — secured by
[Moltr Security Shield](https://github.com/moltrHQ/moltr).

**Who is this for?**
- You **don't have an Anthropic subscription** but want AI agents with tool access
- You want to use **alternative providers** (cheaper, different models)
- You want to protect your agents with **Moltr Security**

## Quick Start (Linux)

```bash
# OpenClaw + Minimax in under 2 minutes
git clone https://github.com/moltrHQ/openclaw.git
cd openclaw
chmod +x scripts/install.sh
./scripts/install.sh
```

## Guides

| Platform | Recommendation | Guide |
|----------|---------------|-------|
| Linux native | Recommended | [docs/linux-native.md](docs/linux-native.md) |
| Docker on Linux | For isolation | [docs/linux-docker.md](docs/linux-docker.md) |
| Windows (WSL) | Last resort | [docs/windows-wsl.md](docs/windows-wsl.md) |

## Tested Providers

| Provider | Model | Status | Response time |
|----------|-------|--------|---------------|
| Minimax | M2.5 | Tested, working | 6-7s (Linux native) |
| OpenAI | GPT-4o | Template available | Not yet tested |
| DeepSeek | V3 | Template available | Not yet tested |

## Known Issues

See [docs/troubleshooting.md](docs/troubleshooting.md) for:
- Token mismatch deadlock (and how to fix it)
- OOM on servers with low RAM
- `config set` bug on WSL1
- Missing git dependency in Docker

## Requirements

- **Node.js** >= 22
- **Linux** with systemd (recommended) or Docker
- **API key** from a supported provider
- Optional: [Moltr Security Shield](https://github.com/moltrHQ/moltr) (Python 3.11+)

## RAM Recommendations

| Scenario | Minimum | Recommended |
|----------|---------|-------------|
| OpenClaw native | 2 GB + swap | 4 GB |
| OpenClaw in Docker | 2 GB + swap | 4 GB |
| OpenClaw + Moltr Security | 3 GB + swap | 4 GB |

## License

AGPL-3.0 — see [LICENSE](LICENSE)

Copyright 2026 Walter Troska / moltrHQ
https://www.moltr.tech
