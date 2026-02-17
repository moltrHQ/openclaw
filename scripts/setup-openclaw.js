#!/usr/bin/env node

/**
 * OpenClaw Provider Setup Script
 * Configures an API provider in the OpenClaw config.
 *
 * Usage:
 *   node setup-openclaw.js
 *
 * The script reads the existing config, adds the provider,
 * and generates a gateway token if none exists.
 *
 * AGPL-3.0 — moltrHQ / Walter Troska 2026
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const HOME = process.env.HOME || process.env.USERPROFILE;
const CFG_PATH = path.join(HOME, ".openclaw", "openclaw.json");

// Provider definitions
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

  // Select provider
  console.log("Available providers:");
  const providerKeys = Object.keys(PROVIDERS);
  providerKeys.forEach((key, i) => {
    console.log(`  ${i + 1}. ${PROVIDERS[key].name} (${key})`);
  });

  const choice = await ask("\nSelect a provider (1-" + providerKeys.length + "): ");
  const providerKey = providerKeys[parseInt(choice) - 1];

  if (!providerKey) {
    console.error("Invalid selection.");
    process.exit(1);
  }

  const provider = PROVIDERS[providerKey];
  console.log(`\nConfiguring: ${provider.name}`);

  // Request API key
  const apiKeyInput = await ask(`\nAPI key for ${provider.name}: `);

  if (!apiKeyInput) {
    console.error("API key must not be empty.");
    process.exit(1);
  }

  // Load or create config
  let cfg = {};
  if (fs.existsSync(CFG_PATH)) {
    cfg = JSON.parse(fs.readFileSync(CFG_PATH, "utf8"));
  }

  // Generate gateway token if none exists
  const token = crypto.randomBytes(24).toString("hex");
  cfg.gateway = cfg.gateway || {};
  cfg.gateway.mode = "local";
  cfg.gateway.auth = cfg.gateway.auth || {};
  cfg.gateway.auth.mode = "token";

  if (!cfg.gateway.auth.token) {
    cfg.gateway.auth.token = token;
    console.log("\nGateway token generated.");
  } else {
    console.log("\nGateway token already exists, keeping it.");
  }

  // Store API key in env
  cfg.env = cfg.env || {};
  cfg.env[provider.envVar] = apiKeyInput;

  // Set default model
  cfg.agents = cfg.agents || {};
  cfg.agents.defaults = cfg.agents.defaults || {};
  cfg.agents.defaults.model = { primary: provider.defaultModel };

  // Configure provider
  cfg.models = cfg.models || {};
  cfg.models.mode = "merge";
  cfg.models.providers = cfg.models.providers || {};
  cfg.models.providers[providerKey] = {
    baseUrl: provider.baseUrl,
    apiKey: "${" + provider.envVar + "}",
    api: provider.api,
    models: [provider.model]
  };

  // Create directory if needed
  const cfgDir = path.dirname(CFG_PATH);
  if (!fs.existsSync(cfgDir)) {
    fs.mkdirSync(cfgDir, { recursive: true });
  }

  // Save config
  fs.writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2));

  console.log("\n=== Setup complete ===");
  console.log("Config: " + CFG_PATH);
  console.log("Provider: " + provider.name);
  console.log("Default model: " + provider.defaultModel);
  console.log("\nNext steps:");
  console.log("  openclaw gateway install   # set up systemd service");
  console.log("  openclaw gateway start     # start gateway");
  console.log("  openclaw gateway health    # check if everything works");
  console.log("  openclaw models list       # list models");
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
