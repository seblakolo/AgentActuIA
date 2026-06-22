// Lit le Markdown produit par Claude Code et génère la page HTML lisible.
import { readFile } from "node:fs/promises";
import { renderHtml } from "./render.js";

const date = process.env.DIGEST_DATE || new Date().toISOString().slice(0, 10);
const md = await readFile(`digests/${date}.md`, "utf8");
await renderHtml(md, date);
console.log(`[run-render] page générée pour ${date}`);
