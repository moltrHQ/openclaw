#!/bin/bash
#
# OpenClaw Docker Entrypoint
# Konfiguriert den Provider und startet den Gateway.
#
# Umgebungsvariablen:
#   PROVIDER_KEY     - Provider-Name (minimax, openai, deepseek)
#   PROVIDER_API_KEY - Der API-Key des Providers
#   GATEWAY_TOKEN    - Gateway-Auth-Token (wird generiert falls leer)

set -e

echo "=== OpenClaw Docker Entrypoint ==="

# Token generieren falls nicht gesetzt
if [ -z "$GATEWAY_TOKEN" ]; then
  GATEWAY_TOKEN=$(openssl rand -hex 24)
  echo "Gateway-Token generiert."
fi

export OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN"

# Setup-Script ausfuehren falls Provider konfiguriert
if [ -n "$PROVIDER_KEY" ] && [ -n "$PROVIDER_API_KEY" ]; then
  echo "Konfiguriere Provider: $PROVIDER_KEY"

  # setup-openclaw.js im Non-Interactive-Modus ausfuehren
  if [ -f /tmp/setup-openclaw.js ]; then
    echo "$PROVIDER_KEY" | node /tmp/setup-openclaw.js <<EOF
$PROVIDER_API_KEY
EOF
  fi
fi

echo "Starte Gateway..."
exec openclaw gateway run --force
