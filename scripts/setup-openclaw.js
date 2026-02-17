#!/usr/bin/env node

/**
 * OpenClaw Provider Setup Script
 * Konfiguriert einen API-Provider in der OpenClaw-Config.
 *
 * Nutzung:
 *   node setup-openclaw.js
 *
 * Das Script liest die bestehende Config, fuegt den Provider hinzu
 * und generiert einen Gateway-Token falls keiner vorhanden ist.
 *
 * AGPL-3.0 — moltrHQ / Walter Troska 2026
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const HOME = process.env.HOME || process.env.USERPROFILE;
const CFG_PATH = path.join(HOME, ".openclaw", "openclaw.json");

// Provider-Definitionen
const PROVIDERS = {
  minimax: {
    name: "Minimax M2.5",
    baseUrl: "https://api.minimax.io/anthropic",
    api: "anthropic-messages",
    envVar: "MINIMAX_API_KEY",
    model: {
      id: "MiniMax-M2.5",
      name: "MiniMax M2.5",
      reasoning: false,
      input: ["text"],
      cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
      contextWindow: 200000,
      maxTokens: 8192
    },
    defaultModel: "minimax/MiniMax-M2.5"
  },
  openai: {
    name: "OpenAI GPT-4o",
    baseUrl: "https://api.openai.com/v1",
    api: "openai-chat",
    envVar: "OPENAI_API_KEY",
    model: {
      id: "gpt-4o",
      name: "GPT-4o",
      reasoning: false,
      input: ["text", "image"],
      cost: { input: 5, output: 15, cacheRead: 2.5, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384
    },
    defaultModel: "openai/gpt-4o"
  },
  deepseek: {
    name: "DeepSeek V3",
    baseUrl: "https://api.deepseek.com/v1",
    api: "openai-chat",
    envVar: "DEEPSEEK_API_KEY",
    model: {
      id: "deepseek-chat",
      name: "DeepSeek V3",
      reasoning: false,
      input: ["text"],
      cost: { input: 0.27, output: 1.1, cacheRead: 0.07, cacheWrite: 0 },
      contextWindow: 64000,
      maxTokens: 8192
    },
    defaultModel: "deepseek/deepseek-chat"
  }
};

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("=== OpenClaw Provider Setup ===\n");

  // Provider auswaehlen
  console.log("Verfuegbare Provider:");
  const providerKeys = Object.keys(PROVIDERS);
  providerKeys.forEach((key, i) => {
    console.log(`  ${i + 1}. ${PROVIDERS[key].name} (${key})`);
  });

  const choice = await ask("\nWaehle einen Provider (1-" + providerKeys.length + "): ");
  const providerKey = providerKeys[parseInt(choice) - 1];

  if (!providerKey) {
    console.error("Ungueltige Auswahl.");
    process.exit(1);
  }

  const provider = PROVIDERS[providerKey];
  console.log(`\nKonfiguriere: ${provider.name}`);

  // API Key abfragen
  const apiKeyInput = await ask(`\nAPI Key fuer ${provider.name}: `);

  if (!apiKeyInput) {
    console.error("API Key darf nicht leer sein.");
    process.exit(1);
  }

  // Config laden oder erstellen
  let cfg = {};
  if (fs.existsSync(CFG_PATH)) {
    cfg = JSON.parse(fs.readFileSync(CFG_PATH, "utf8"));
  }

  // Gateway-Token generieren falls keiner vorhanden
  const token = crypto.randomBytes(24).toString("hex");
  cfg.gateway = cfg.gateway || {};
  cfg.gateway.mode = "local";
  cfg.gateway.auth = cfg.gateway.auth || {};
  cfg.gateway.auth.mode = "token";

  if (!cfg.gateway.auth.token) {
    cfg.gateway.auth.token = token;
    console.log("\nGateway-Token generiert.");
  } else {
    console.log("\nGateway-Token bereits vorhanden, wird beibehalten.");
  }

  // API Key in env speichern
  cfg.env = cfg.env || {};
  cfg.env[provider.envVar] = apiKeyInput;

  // Default Model setzen
  cfg.agents = cfg.agents || {};
  cfg.agents.defaults = cfg.agents.defaults || {};
  cfg.agents.defaults.model = { primary: provider.defaultModel };

  // Provider konfigurieren
  cfg.models = cfg.models || {};
  cfg.models.mode = "merge";
  cfg.models.providers = cfg.models.providers || {};
  cfg.models.providers[providerKey] = {
    baseUrl: provider.baseUrl,
    apiKey: "${" + provider.envVar + "}",
    api: provider.api,
    models: [provider.model]
  };

  // Verzeichnis erstellen falls noetig
  const cfgDir = path.dirname(CFG_PATH);
  if (!fs.existsSync(cfgDir)) {
    fs.mkdirSync(cfgDir, { recursive: true });
  }

  // Config speichern
  fs.writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2));

  console.log("\n=== Setup abgeschlossen ===");
  console.log("Config: " + CFG_PATH);
  console.log("Provider: " + provider.name);
  console.log("Default Model: " + provider.defaultModel);
  console.log("\nNaechste Schritte:");
  console.log("  openclaw gateway install   # systemd-Service einrichten");
  console.log("  openclaw gateway start     # Gateway starten");
  console.log("  openclaw gateway health    # Pruefen ob alles laeuft");
  console.log("  openclaw models list       # Modelle anzeigen");
}

main().catch(err => {
  console.error("Fehler:", err.message);
  process.exit(1);
});
