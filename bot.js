import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// CONFIG
const DISCORD_TOKEN = "SEU_TOKEN_DISCORD";
const FIREBASE_URL = "https://seu-projeto.firebaseio.com";
const FIREBASE_AUTH = ""; // opcional: ?auth=TOKEN

// === Funções ===

// Gera key no formato 1234-5678-9101
function genKey() {
  const p1 = Math.floor(1000 + Math.random() * 9000);
  const p2 = Math.floor(1000 + Math.random() * 9000);
  const p3 = Math.floor(1000 + Math.random() * 9000);
  return `${p1}-${p2}-${p3}`;
}

// Interpreta duração (1h, 3d, etc)
function parseDuration(input) {
  if (!input) return 0;
  const match = input.match(/(\d+)([smhd])/);
  if (!match) return 0;
  const val = parseInt(match[1]);
  const unit = match[2];
  const mult = { s: 1, m: 60, h: 3600, d: 86400 };
  return val * (mult[unit] || 0);
}

// Salva a key no Firebase
async function saveKey(key, data) {
  const url = `${FIREBASE_URL}/keys/${encodeURIComponent(key)}.json${FIREBASE_AUTH ? "?auth=" + FIREBASE_AUTH : ""}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok;
}

// === Listener de mensagens ===
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith("!genkey")) return;

  const args = msg.content.split(" ").slice(1);
  const tipo = args[0] || "temporaria";
  const tempoStr = args[1];

  let expiresAt = null;
  let tipoFinal = tipo.toLowerCase();

  if (tipoFinal === "permanente") {
    expiresAt = null;
  } else {
    const seconds = parseDuration(tempoStr || "1h");
    expiresAt = Date.now() + seconds * 1000;
  }

  const key = genKey();
  const data = {
    used: false,
    createdAt: Date.now(),
    expiresAt,
    type: tipoFinal,
    owner: msg.author.id,
  };

  const ok = await saveKey(key, data);
  if (ok) {
    msg.reply(`✅ Key gerada com sucesso!\n\`\`\`\n${key}\n\`\`\`\nTipo: ${tipoFinal}\nExpira: ${expiresAt ? new Date(expiresAt).toLocaleString() : "Nunca"}`);
  } else {
    msg.reply("❌ Erro ao salvar no Firebase.");
  }
});

client.login(DISCORD_TOKEN);
