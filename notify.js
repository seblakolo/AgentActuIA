// NOTIFY : lit le teaser généré par le build et l'envoie sur WhatsApp avec le lien vers la page.
import { readFile } from "node:fs/promises";
import { digestUrl, sendWhatsApp } from "./deliver.js";

async function main() {
  const { date, whatsapp_summary } = JSON.parse(await readFile("digests/.latest.json", "utf8"));
  const link = digestUrl(date);
  await sendWhatsApp(whatsapp_summary, link);
}

main().catch((e) => { console.error("ÉCHEC notify :", e); process.exit(1); });
