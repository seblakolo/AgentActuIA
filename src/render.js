// Rend le digest Markdown en page HTML lisible (publiée via GitHub Pages).
import { marked } from "marked";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const PALETTE = {
  paper: "#faf8f3",
  ink: "#1c1a17",
  muted: "#6b655c",
  accent: "#b45309",
  line: "#e7e1d6",
  fire: "#fff4e6",
};

function template(date, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Digest IA — ${date}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: ${PALETTE.paper}; color: ${PALETTE.ink};
    font-family: ui-sans-serif, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.7; -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 48px 22px 96px; }
  .kicker { font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: ${PALETTE.accent}; font-weight: 600; }
  h1 { font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; font-size: 34px; line-height: 1.15; margin: 6px 0 4px; }
  .date { color: ${PALETTE.muted}; font-size: 15px; margin-bottom: 40px; }
  h2 {
    font-family: Georgia, "Iowan Old Style", serif; font-size: 24px; margin: 48px 0 8px;
    padding-top: 22px; border-top: 1px solid ${PALETTE.line};
  }
  h3 { font-size: 18px; margin: 28px 0 4px; }
  p { margin: 12px 0; }
  a { color: ${PALETTE.accent}; text-decoration: none; border-bottom: 1px solid ${PALETTE.line}; }
  a:hover { border-color: ${PALETTE.accent}; }
  ul { padding-left: 20px; }
  li { margin: 10px 0; }
  /* met en valeur les lignes "sorties majeures" 🔥 */
  li:has(> :first-child) { }
  hr { border: 0; border-top: 1px solid ${PALETTE.line}; margin: 40px 0; }
  code { background: #f1ece1; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
  .foot { margin-top: 64px; color: ${PALETTE.muted}; font-size: 13px; border-top: 1px solid ${PALETTE.line}; padding-top: 16px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="kicker">Digest hebdomadaire</div>
    <h1>IA · Photo-Vidéo · Design</h1>
    <div class="date">${date}</div>
    ${bodyHtml}
    <div class="foot">Généré automatiquement · curation Claude Opus · sources curées + GitHub + Hacker News + Reddit.</div>
  </div>
</body>
</html>`;
}

export async function renderHtml(fullMarkdown, date) {
  const body = marked.parse(fullMarkdown);
  const html = template(date, body);
  await mkdir("docs", { recursive: true });
  await writeFile(path.join("docs", `${date}.html`), html); // archive
  await writeFile(path.join("docs", "index.html"), html);    // dernier en date
  console.log(`[render] page HTML : docs/${date}.html (+ index.html)`);
}
