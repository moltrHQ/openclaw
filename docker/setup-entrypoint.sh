#!/bin/bash
#
# OpenClaw Docker Entrypoint
# Configures the provider and starts the gateway.
#
# Environment variables:
#   PROVIDER_KEY     - Provider name (minimax, openai, deepseek)
#   PROVIDER_API_KEY - The provider's API key
#   GATEWAY_TOKEN    - Gateway auth token (generated if empty)

set -e

echo "=== OpenClaw Docker Entrypoint ==="

# Generate token if not set
if [ -z "$GATEWAY_TOKEN" ]; then
  GATEWAY_TOKEN=$(openssl rand -hex 24)
  echo "Gateway token generated."
fi

export OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN"

# Run setup script if provider is configured
if [ -n "$PROVIDER_KEY" ] && [ -n "$PROVIDER_API_KEY" ]; then
  echo "Configuring provider: $PROVIDER_KEY"

  if [ -f /tmp/setup-openclaw.js ]; then
    echo "$PROVIDER_KEY" | node /tmp/setup-openclaw.js <<EOF
$PROVIDER_API_KEY
EOF
  fi
fi

echo "Starting gateway..."
exec openclaw gateway run --force
