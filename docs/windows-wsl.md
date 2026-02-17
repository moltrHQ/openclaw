# Install OpenClaw on Windows (WSL)

> Tested on Windows Server 2022 with WSL1 + Ubuntu 24.04.
> **NOT RECOMMENDED** — use a Linux server if possible.

## Warning

WSL1 has significant limitations for OpenClaw:
- No systemd — gateway cannot run as a daemon
- `config set gateway.auth.token` is buggy (saves empty values)
- Background processes die when the WSL session ends
- Token mismatch deadlock occurs more frequently
- 2.5x slower agent response times

**Recommendation:** Use a Linux server instead (see [linux-native.md](linux-native.md)).

## WSL1 vs. WSL2

- **WSL2** requires nested virtualization — not available on many VPS providers
- **WSL1** works, but with the limitations listed above
- Check: `wsl --status` shows the current version

## Installation

```bash
# In WSL Ubuntu:
npm install -g openclaw@latest
openclaw config set gateway.mode local
openclaw doctor --fix
```

## Set token (WARNING: Bug!)

`openclaw config set gateway.auth.token` saves empty values on WSL1!

**Workaround:** Edit JSON directly:

```bash
# Generate token
TOKEN=$(openssl rand -hex 24)

# Write directly to JSON (do NOT use config set!)
node -e "
const fs = require('fs');
const p = process.env.HOME + '/.openclaw/openclaw.json';
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
c.gateway.auth = c.gateway.auth || {};
c.gateway.auth.mode = 'token';
c.gateway.auth.token = '$TOKEN';
fs.writeFileSync(p, JSON.stringify(c, null, 2));
console.log('Token set');
"
```

## Start gateway

```bash
# NOT gateway start (requires systemd)
# Instead:
openclaw gateway run --force
```

The gateway runs in the foreground. For persistent operation:
- Use `tmux` or `screen`
- Or: Work in a second WSL session

## Fix token mismatch

If you see "unauthorized: device token mismatch":

1. Stop gateway: `pkill -f 'openclaw.*gateway'`
2. Set token directly in JSON (see above)
3. Restart gateway: `openclaw gateway run --force`

> This problem occurs frequently on WSL1.
> On native Linux with correct setup, it does not occur.

## Comparison

| Metric | WSL1 | Linux native |
|--------|------|-------------|
| Installation | 6 min | 49s |
| Agent response | 17s | 6.7s |
| Stability | Low | High |
| Token bug | Yes | No |
| systemd | No | Yes |
