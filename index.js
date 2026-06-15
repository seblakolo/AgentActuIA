// BUILD : collecte -> curation -> archive Markdown + page HTML.
// N'envoie rien (l'envoi est dans notify.js, après publication de la page).
import { writeFile } from "node:fs/promises";
import { collectAll } from "./collect.js";
import { curate } from "./curate.js";
import { writeDigest } from "./deliver.js";
import { renderHtml } from "./render.js";

const DRY = process.env.DRY_RUN === "1";
const date = new Date().toISOString().slice(0, 10);

async function main() {
  console.log(`=== BUILD digest ${date} ${DRY ? "(DRY)" : ""} ===`);
  const items = await collectAll();
  const { full_markdown, whatsapp_summary } = await curate(items);

  await writeDigest(full_markdown);
  await renderHtml(full_markdown, date);
  // On persiste le teaser pour l'étape notify (après publication Pages).
  await writeFile("digests/.latest.json", JSON.stringify({ date, whatsapp_summary }, null, 2));

  if (DRY) {
    console.log("\n----- TEASER WHATSAPP (preview) -----\n" + whatsapp_summary);
    console.log("\n[dry] page HTML générée dans docs/, rien envoyé.");
  }
  console.log("=== BUILD terminé ===");
}

main().catch((e) => { console.error("ÉCHEC build :", e); process.exit(1); });
