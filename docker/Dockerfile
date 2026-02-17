FROM ubuntu:24.04

LABEL maintainer="moltrHQ <hello@moltr.tech>"
LABEL description="OpenClaw Gateway with Moltr Security"
LABEL license="AGPL-3.0"

# Install dependencies (git is REQUIRED for npm install)
RUN apt-get update -qq && \
    apt-get install -y -qq curl git openssl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y -qq nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install OpenClaw
RUN npm install -g openclaw@latest

# Base configuration
RUN openclaw config set gateway.mode local 2>/dev/null || true && \
    openclaw doctor --fix 2>/dev/null || true

# Copy entrypoint script
COPY setup-entrypoint.sh /setup-entrypoint.sh
RUN chmod +x /setup-entrypoint.sh

EXPOSE 18789

ENTRYPOINT ["/setup-entrypoint.sh"]
