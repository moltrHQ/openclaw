# Install OpenClaw on Linux (native)

> Tested on Debian 12 (bookworm). Should work identically on Ubuntu 22.04+
> and other systemd-based distributions.

## Requirements

- Linux with systemd
- Root access or sudo
- Internet connection
- API key from a provider (e.g. Minimax)

## Step 1: Set up swap (if 2 GB RAM or less)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

> Without swap, `npm install` can trigger an OOM kill on low-RAM servers,
> which may also kill the SSH daemon. Then only a reboot via the
> provider console helps.

## Step 2: Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version  # expected: v22.x.x
```

## Step 3: Install OpenClaw

```bash
npm install -g openclaw@latest
openclaw --version  # expected: 2026.2.15 or newer
```

Installation time: approx. 50 seconds on a typical VPS.

## Step 4: Base configuration

```bash
openclaw config set gateway.mode local
openclaw doctor --fix
```

## Step 5: Set gateway token

```bash
# Generate token
TOKEN=$(openssl rand -hex 24)
echo "Your token: $TOKEN"

# Set token (works correctly on native Linux!)
openclaw config set gateway.auth.mode token
openclaw config set gateway.auth.token "$TOKEN"
```

> On WSL1, `config set` for tokens is buggy — you must edit the
> JSON file directly there. On native Linux it works fine.

## Step 6: Configure provider

Use the setup script from this repo:

```bash
# Copy provider config into OpenClaw config
node scripts/setup-openclaw.js
```

The script will ask for your API key and configure the provider.

**Or manually:** Edit `~/.openclaw/openclaw.json` and insert
the provider block from `examples/providers/`.

## Step 7: Start gateway as systemd service

```bash
openclaw gateway install
openclaw gateway start
```

This is the big advantage of native Linux over WSL1:
- Gateway runs as a systemd daemon
- Survives server reboot
- Automatic restart on crash
- Clean start/stop

## Step 8: Verify

```bash
openclaw gateway health           # expected: OK
openclaw models list              # expected: your provider/model
openclaw models status            # expected: auth correct
openclaw devices list             # expected: 1 device paired
```

## Step 9: Test

```bash
openclaw agent --agent main --session-id test \
  --message "Hello! Who are you?" --json
```

Expected response time with Minimax M2.5: approx. 6-7 seconds.
24 tools should be available (read, write, exec, browser, etc.).

## Performance comparison

| Metric | Linux native | WSL1 | Docker |
|--------|-------------|------|--------|
| Installation | 49s | 6 min | 22s |
| Agent response | 6.7s | 17s | 21.5s |
| Gateway start | systemd | manual | manual |
| Stability | High | Low | Medium |

## Uninstall

```bash
openclaw gateway stop
systemctl --user disable openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
npm uninstall -g openclaw
rm -rf ~/.openclaw
```
