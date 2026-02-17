#!/bin/bash
#
# Moltr + OpenClaw Installer
# Installs Node.js 22 and OpenClaw on a Linux system.
#
# Usage:
#   chmod +x install.sh
#   ./install.sh
#
# AGPL-3.0 — moltrHQ / Walter Troska 2026

set -e

echo "=== Moltr + OpenClaw Installer ==="
echo ""

# Root check
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (or with sudo)."
  exit 1
fi

# Check RAM
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
echo "RAM: ${TOTAL_RAM_MB} MB"

if [ "$TOTAL_RAM_MB" -lt 2500 ]; then
  echo ""
  echo "WARNING: Less than 2.5 GB RAM detected."

  # Check swap
  SWAP_TOTAL=$(free -m | awk '/Swap/ {print $2}')
  if [ "$SWAP_TOTAL" -lt 1024 ]; then
    echo "No sufficient swap found (${SWAP_TOTAL} MB)."
    echo ""
    read -p "Set up 2 GB swap? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "Setting up swap..."
      fallocate -l 2G /swapfile
      chmod 600 /swapfile
      mkswap /swapfile
      swapon /swapfile
      echo '/swapfile none swap sw 0 0' >> /etc/fstab
      echo "Swap configured (2 GB)."
    else
      echo "WARNING: Without swap, the installation may fail on low-RAM servers!"
    fi
  else
    echo "Swap available: ${SWAP_TOTAL} MB — OK."
  fi
fi

echo ""

# Check Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
  echo "Node.js found: $NODE_VERSION"

  if [ "$NODE_MAJOR" -lt 22 ]; then
    echo "Node.js $NODE_VERSION is too old. Installing v22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  fi
else
  echo "Node.js not found. Installing v22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "Node.js: $(node --version)"
echo ""

# Check git (required by some OpenClaw npm dependencies)
if ! command -v git &> /dev/null; then
  echo "Installing git (required by OpenClaw)..."
  apt-get install -y git
fi

# Install OpenClaw
if command -v openclaw &> /dev/null; then
  CURRENT_VERSION=$(openclaw --version 2>/dev/null || echo "unknown")
  echo "OpenClaw already installed: $CURRENT_VERSION"
  read -p "Reinstall/update? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipped."
  else
    echo "Installing OpenClaw..."
    npm install -g openclaw@latest
  fi
else
  echo "Installing OpenClaw..."
  npm install -g openclaw@latest
fi

echo ""
echo "OpenClaw: $(openclaw --version)"

# Base configuration
echo ""
echo "Running base configuration..."
openclaw config set gateway.mode local 2>/dev/null || true
openclaw doctor --fix 2>/dev/null | tail -3

echo ""
echo "=== Installation complete ==="
echo ""
echo "Next steps:"
echo "  1. Configure provider:  node scripts/setup-openclaw.js"
echo "  2. Start gateway:       openclaw gateway install && openclaw gateway start"
echo "  3. Test:                openclaw gateway health"
echo ""
