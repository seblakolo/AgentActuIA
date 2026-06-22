// Couche LIVRAISON : archive Markdown + envoi WhatsApp à une LISTE de destinataires.
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const today = new Date().toISOString().slice(0, 10);

export async function writeDigest(fullMarkdown) {
  const dir = "digests";
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${today}.md`);
  await writeFile(file, `# Digest IA · Photo-Vidéo · Design — ${today}\n\n` + fullMarkdown + "\n");
  console.log(`[deliver] digest écrit : ${file}`);
  return file;
}

export function digestUrl(date) {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) return null;
  const [owner, name] = repo.split("/");
  if (process.env.USE_PAGES !== "0") return `https://${owner}.github.io/${name}/${date}.html`;
  const server = process.env.GITHUB_SERVER_URL || "https://github.com";
  return `${server}/${repo}/blob/${process.env.DIGEST_BRANCH || "main"}/digests/${date}.md`;
}

async function getRecipients() {
  try {
    const list = JSON.parse(await readFile("recipients.json", "utf8"));
    const valid = (Array.isArray(list) ? list : []).filter((r) => r && r.phone && r.apikey);
    if (valid.length) return valid;
  } catch { /* pas de fichier -> repli */ }
  if (process.env.WHATSAPP_PHONE && process.env.CALLMEBOT_APIKEY) {
    return [{ phone: process.env.WHATSAPP_PHONE, apikey: process.env.CALLMEBOT_APIKEY }];
  }
  return [];
}

async function sendOne(phone, apikey, text) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 120)}`);
  return body;
}

export async function sendWhatsApp(summary, link) {
  const recipients = await getRecipients();
  if (!recipients.length) { console.warn("[deliver] aucun destinataire configuré — envoi sauté."); return; }
  let text = summary;
  if (link) text += `\n\n📄 Digest complet : ${link}`;
  if (text.length > 3900) text = text.slice(0, 3900) + "…";
  let ok = 0;
  for (const r of recipients) {
    try { await sendOne(r.phone, r.apikey, text); ok++; console.log(`[deliver] WhatsApp -> ${r.phone} : OK`); }
    catch (e) { console.warn(`[deliver] WhatsApp -> ${r.phone} : ÉCHEC ${e.message}`); }
  }
  console.log(`[deliver] ${ok}/${recipients.length} envoi(s) réussi(s).`);
}
