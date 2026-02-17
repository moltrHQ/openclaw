# Troubleshooting

## Problem 1: Token-Mismatch Deadlock (KRITISCH)

**Symptom:**
```
unauthorized: device token mismatch (rotate/reissue device token)
```

**Ursache:** Der Gateway hat einen anderen Token als die CLI-Config.
Jeder CLI-Befehl geht ueber den Gateway → Teufelskreis.

**Loesung:**
1. Gateway stoppen: `pkill -f 'openclaw.*gateway'`
   (oder `openclaw gateway stop` falls systemd)
2. Token in `~/.openclaw/openclaw.json` direkt setzen
3. Gateway neu starten

**Hinweis:** Auf nativem Linux tritt dieses Problem bei korrekter
Einrichtung nicht auf. Es ist primaer ein WSL1-Problem.

---

## Problem 2: OOM-Kill bei wenig RAM

**Symptom:** Server nicht mehr erreichbar nach `npm install openclaw`

**Ursache:** OpenClaw-Installation braucht RAM-Spitzen. Bei 2 GB RAM
ohne Swap kann der OOM-Killer zuschlagen und SSH mitnehmen.

**Loesung:** Swap einrichten (vor der Installation!):
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**RAM-Empfehlung:** 4 GB, mindestens 2 GB + Swap.

---

## Problem 3: `config set` speichert Token nicht (WSL1)

**Symptom:** `openclaw config set gateway.auth.token "mein-token"`
meldet Erfolg, aber der Wert ist leer in der JSON-Datei.

**Betrifft:** Nur WSL1. Auf nativem Linux funktioniert `config set` korrekt.

**Loesung:** JSON direkt editieren oder Umgebungsvariable nutzen.

---

## Problem 4: npm install schlaegt fehl in Docker

**Symptom:**
```
npm error enoent An unknown git error occurred
```

**Ursache:** OpenClaw hat Abhaengigkeiten die aus Git-Repos geladen werden.
Das Ubuntu-Docker-Image hat kein git vorinstalliert.

**Loesung:**
```bash
apt-get install -y git   # VOR npm install
npm install -g openclaw@latest
```

---

## Problem 5: Gateway startet nicht (kein systemd)

**Symptom:**
```
Gateway service: systemd not installed
```

**Betrifft:** WSL1, Docker-Container, minimale Linux-Installationen.

**Loesung:** Statt `gateway start` den Vordergrund-Modus nutzen:
```bash
openclaw gateway run --force
```

Fuer Hintergrund-Betrieb:
```bash
nohup openclaw gateway run --force > /tmp/gateway.log 2>&1 &
```

---

## Problem 6: Veraltete Community-Befehle

Folgende Befehle existieren in aktuellen Versionen NICHT mehr:
- `openclaw gateway probe --fix` → nutze `openclaw doctor --fix`
- `openclaw auth rotate-device-token` → nutze `openclaw devices rotate`

**Aktuelle korrekte Befehle:**
- `openclaw doctor --fix` — automatische Reparaturen
- `openclaw devices rotate` — Device-Token erneuern
- `openclaw gateway probe` — Gateway-Verbindung pruefen (ohne --fix)
- `openclaw reset --scope full --yes --non-interactive` — Komplett-Reset

---

## Problem 7: WSL2 auf VPS nicht moeglich

**Symptom:**
```
Wsl/Service/CreateVm/HCS/HCS_E_HYPERV_NOT_INSTALLED
```

**Ursache:** VPS laeuft auf QEMU/KVM. Fuer WSL2 braucht man
Nested Virtualization, die der Provider auf Host-Ebene aktivieren muss.

**Loesung:**
- VPS-Provider kontaktieren (Nested Virtualization aktivieren)
- Oder: Linux-Server nutzen (empfohlen)
- Oder: WSL1 verwenden (mit Einschraenkungen)

---

## Diagnose-Befehle

```bash
# Allgemeine Diagnose
openclaw doctor

# Gateway-Status
openclaw gateway health
systemctl --user status openclaw-gateway.service

# Modelle und Auth pruefen
openclaw models list
openclaw models status

# Devices pruefen
openclaw devices list

# Logs
cat /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log

# OpenClaw-Version
openclaw --version
```
