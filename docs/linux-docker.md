# Install OpenClaw in Docker

> Tested on Debian 12 with Docker 28.5.2.
> For users who want to run OpenClaw isolated in a container.

## Requirements

- Linux with Docker installed
- At least 2 GB RAM + 2 GB swap (4 GB RAM recommended)
- API key from a provider

## Important: RAM and swap

On servers with 2 GB RAM or less, swap **must** be configured
before starting Docker containers with OpenClaw:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

> Without swap, `npm install openclaw` in a container triggers an OOM kill
> that can crash the entire server (including SSH).

## Option A: Docker Compose (recommended)

```bash
cd docker/
# Create .env file (see instructions below)
cp .env.example .env
# Edit .env with your API key
docker compose up -d
```

See `docker/docker-compose.yml` and `docker/.env.example` for details.

## Option B: Manual setup

### Start container

```bash
docker run -d --name openclaw-agent ubuntu:24.04 sleep infinity
```

### Install dependencies

```bash
docker exec openclaw-agent bash -c "\
  apt-get update -qq && \
  apt-get install -y -qq curl git openssl && \
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
  apt-get install -y -qq nodejs"
```

> **Important:** `git` must be installed! Without git,
> `npm install openclaw` fails with "unknown git error".

### Install OpenClaw

```bash
docker exec openclaw-agent npm install -g openclaw@latest
```

### Configure

```bash
# Copy and run setup script
docker cp scripts/setup-openclaw.js openclaw-agent:/tmp/
docker exec openclaw-agent bash -c "\
  openclaw config set gateway.mode local && \
  openclaw doctor --fix && \
  node /tmp/setup-openclaw.js"
```

### Start gateway

Docker containers don't have systemd — therefore:

```bash
docker exec -d openclaw-agent bash -c "\
  openclaw gateway run --force > /tmp/gateway.log 2>&1"
```

> `gateway install` and `gateway start` do NOT work in containers
> because there is no systemd. Always use `gateway run`.

### Test

```bash
# Wait briefly for the gateway to start up
sleep 5

docker exec openclaw-agent openclaw gateway health
docker exec openclaw-agent openclaw agent --agent main \
  --session-id test --message "Hello!" --json
```

## Known differences from native Linux

| Aspect | Native | Docker |
|--------|--------|--------|
| systemd | Yes | No |
| Gateway daemon | systemd service | Foreground / nohup |
| Performance | 6.7s | 21.5s (with 2GB + swap) |
| git required | No (usually pre-installed) | Yes (must install) |
| Persistence | Stable | Container-dependent |

## Clean up container

```bash
docker rm -f openclaw-agent
```
