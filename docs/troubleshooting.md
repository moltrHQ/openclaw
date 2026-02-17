# Troubleshooting

## Problem 1: Token Mismatch Deadlock (CRITICAL)

**Symptom:**
```
unauthorized: device token mismatch (rotate/reissue device token)
```

**Cause:** The gateway has a different token than the CLI config.
Every CLI command goes through the gateway — creating a deadlock.

**Solution:**
1. Stop gateway: `pkill -f 'openclaw.*gateway'`
   (or `openclaw gateway stop` if using systemd)
2. Set token directly in `~/.openclaw/openclaw.json`
3. Restart gateway

**Note:** On native Linux with correct setup, this problem does not occur.
It is primarily a WSL1 issue.

---

## Problem 2: OOM Kill on Low RAM Servers

**Symptom:** Server becomes unreachable after `npm install openclaw`

**Cause:** OpenClaw installation creates RAM spikes. On 2 GB servers
without swap, the OOM killer strikes and takes down SSH.

**Solution:** Set up swap (before installation!):
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**RAM recommendation:** 4 GB, minimum 2 GB + swap.

---

## Problem 3: `config set` Does Not Save Token (WSL1)

**Symptom:** `openclaw config set gateway.auth.token "my-token"`
reports success, but the value is empty in the JSON file.

**Affects:** WSL1 only. On native Linux, `config set` works correctly.

**Solution:** Edit JSON directly or use environment variable.

---

## Problem 4: npm install Fails in Docker

**Symptom:**
```
npm error enoent An unknown git error occurred
```

**Cause:** OpenClaw has dependencies loaded from git repos.
The Ubuntu Docker image does not have git pre-installed.

**Solution:**
```bash
apt-get install -y git   # BEFORE npm install
npm install -g openclaw@latest
```

---

## Problem 5: Gateway Won't Start (No systemd)

**Symptom:**
```
Gateway service: systemd not installed
```

**Affects:** WSL1, Docker containers, minimal Linux installations.

**Solution:** Use foreground mode instead of `gateway start`:
```bash
openclaw gateway run --force
```

For background operation:
```bash
nohup openclaw gateway run --force > /tmp/gateway.log 2>&1 &
```

---

## Problem 6: Outdated Community Commands

The following commands do NOT exist in current versions:
- `openclaw gateway probe --fix` — use `openclaw doctor --fix`
- `openclaw auth rotate-device-token` — use `openclaw devices rotate`

**Current correct commands:**
- `openclaw doctor --fix` — automatic repairs
- `openclaw devices rotate` — rotate device token
- `openclaw gateway probe` — test gateway connection (without --fix)
- `openclaw reset --scope full --yes --non-interactive` — full reset

---

## Problem 7: WSL2 Not Available on VPS

**Symptom:**
```
Wsl/Service/CreateVm/HCS/HCS_E_HYPERV_NOT_INSTALLED
```

**Cause:** VPS runs on QEMU/KVM. WSL2 requires nested virtualization,
which the provider must enable at the host level.

**Solution:**
- Contact VPS provider (request nested virtualization)
- Or: Use a Linux server (recommended)
- Or: Use WSL1 (with limitations)

---

## Diagnostic Commands

```bash
# General diagnostics
openclaw doctor

# Gateway status
openclaw gateway health
systemctl --user status openclaw-gateway.service

# Check models and auth
openclaw models list
openclaw models status

# Check devices
openclaw devices list

# Logs
cat /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log

# OpenClaw version
openclaw --version
```
