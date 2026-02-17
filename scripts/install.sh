#!/bin/bash
#
# Moltr + OpenClaw Installer
# Installiert Node.js 22 und OpenClaw auf einem Linux-System.
#
# Nutzung:
#   chmod +x install.sh
#   ./install.sh
#
# AGPL-3.0 — moltrHQ / Walter Troska 2026

set -e

echo "=== Moltr + OpenClaw Installer ==="
echo ""

# Root-Check
if [ "$EUID" -ne 0 ]; then
  echo "Bitte als root ausfuehren (oder mit sudo)."
  exit 1
fi

# RAM pruefen
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
echo "RAM: ${TOTAL_RAM_MB} MB"

if [ "$TOTAL_RAM_MB" -lt 2500 ]; then
  echo ""
  echo "WARNUNG: Weniger als 2.5 GB RAM erkannt."

  # Swap pruefen
  SWAP_TOTAL=$(free -m | awk '/Swap/ {print $2}')
  if [ "$SWAP_TOTAL" -lt 1024 ]; then
    echo "Kein ausreichender Swap vorhanden (${SWAP_TOTAL} MB)."
    echo ""
    read -p "Soll 2 GB Swap eingerichtet werden? (j/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Jj]$ ]]; then
      echo "Richte Swap ein..."
      fallocate -l 2G /swapfile
      chmod 600 /swapfile
      mkswap /swapfile
      swapon /swapfile
      echo '/swapfile none swap sw 0 0' >> /etc/fstab
      echo "Swap eingerichtet (2 GB)."
    else
      echo "WARNUNG: Ohne Swap kann die Installation bei wenig RAM fehlschlagen!"
    fi
  else
    echo "Swap vorhanden: ${SWAP_TOTAL} MB — OK."
  fi
fi

echo ""

# Node.js pruefen
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
  echo "Node.js gefunden: $NODE_VERSION"

  if [ "$NODE_MAJOR" -lt 22 ]; then
    echo "Node.js $NODE_VERSION ist zu alt. Installiere v22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  fi
else
  echo "Node.js nicht gefunden. Installiere v22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "Node.js: $(node --version)"
echo ""

# Git pruefen (wird von npm fuer manche OpenClaw-Deps gebraucht)
if ! command -v git &> /dev/null; then
  echo "Installiere git (wird von OpenClaw benoetigt)..."
  apt-get install -y git
fi

# OpenClaw installieren
if command -v openclaw &> /dev/null; then
  CURRENT_VERSION=$(openclaw --version 2>/dev/null || echo "unbekannt")
  echo "OpenClaw bereits installiert: $CURRENT_VERSION"
  read -p "Neu installieren/aktualisieren? (j/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Jj]$ ]]; then
    echo "Uebersprungen."
  else
    echo "Installiere OpenClaw..."
    npm install -g openclaw@latest
  fi
else
  echo "Installiere OpenClaw..."
  npm install -g openclaw@latest
fi

echo ""
echo "OpenClaw: $(openclaw --version)"

# Grundkonfiguration
echo ""
echo "Fuehre Grundkonfiguration durch..."
openclaw config set gateway.mode local 2>/dev/null || true
openclaw doctor --fix 2>/dev/null | tail -3

echo ""
echo "=== Installation abgeschlossen ==="
echo ""
echo "Naechste Schritte:"
echo "  1. Provider konfigurieren:  node scripts/setup-openclaw.js"
echo "  2. Gateway starten:         openclaw gateway install && openclaw gateway start"
echo "  3. Testen:                  openclaw gateway health"
echo ""
