// Couche LIVRAISON : écrit le digest complet (archive Markdown) + envoie le teaser WhatsApp.
// L'envoi WhatsApp est isolé ici (adapter CallMeBot) -> swap vers Cloud API officiel = ce seul fichier.

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const today = new Date().toISOString().slice(0, 10);

export async function writeDigest(fullMarkdown) {
  const dir = "digests";
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${today}.md`);
  const header = `# Digest IA · Photo-Vidéo · Design — ${today}\n\n`;
  await writeFile(file, header + fullMarkdown + "\n");
  console.log(`[deliver] digest écrit : ${file}`);
  return file;
}

export function digestUrl(date) {
  // Lien lisible : page GitHub Pages. Fallback : Markdown brut dans le repo.
  const repo = process.env.GITHUB_REPOSITORY; // "owner/name"
  if (!repo) return null;
  const [owner, name] = repo.split("/");
  if (process.env.USE_PAGES !== "0") {
    return `https://${owner}.github.io/${name}/${date}.html`;
  }
  const server = process.env.GITHUB_SERVER_URL || "https://github.com";
  const branch = process.env.DIGEST_BRANCH || "main";
  return `${server}/${repo}/blob/${branch}/digests/${date}.md`;
}

// --- Adapter WhatsApp : CallMeBot ---
export async function sendWhatsApp(summary, link) {
  const phone = process.env.WHATSAPP_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) {
    console.warn("[deliver] WHATSAPP_PHONE / CALLMEBOT_APIKEY manquants — envoi sauté.");
    return;
  }
  let text = summary;
  if (link) text += `\n\n📄 Digest complet : ${link}`;
  if (text.length > 3900) text = text.slice(0, 3900) + "…";

  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;

  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) throw new Error(`CallMeBot HTTP ${res.status}: ${body}`);
  console.log("[deliver] WhatsApp envoyé.");
}
