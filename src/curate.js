// Couche CURATION : LLM (Opus), input borné (uniquement la liste pré-filtrée).
// Ne crawle rien : reçoit titres + résumés courts + URL, renvoie un digest structuré.

import { CATEGORY_LABELS } from "./sources.js";

const MODEL = process.env.CURATION_MODEL || "claude-opus-4-8";

function buildItemList(items) {
  // Groupé par verticale, compact, pour minimiser les tokens.
  const byCat = { ia: [], media: [], design: [] };
  for (const it of items) (byCat[it.category] || byCat.ia).push(it);
  let n = 0;
  const lines = [];
  for (const cat of ["ia", "media", "design"]) {
    lines.push(`\n### ${CATEGORY_LABELS[cat]}`);
    for (const it of byCat[cat]) {
      n++;
      lines.push(`[${n}] ${it.title} — ${it.source}\n${it.url}${it.summary ? `\n${it.summary}` : ""}`);
    }
  }
  return lines.join("\n");
}

const SYSTEM = `Tu es l'éditeur d'un digest hebdomadaire (le samedi) destiné à un fondateur tech francophone qui suit l'IA/LLM, la génération photo/vidéo et le design.
On te donne une liste d'items déjà collectés sur les 7 derniers jours (titre, source, URL, parfois résumé). Tu ne dois RIEN inventer ni ajouter d'item hors liste : si une info n'est pas dans la liste, elle n'existe pas.

Méthode :
- Trie le signal du bruit. Fusionne les doublons (même annonce relayée par plusieurs sources) en une seule entrée avec la meilleure source.
- Hiérarchise : ce qui change vraiment la donne en haut, le secondaire ensuite. Coupe le hors-sujet et le promo.
- Marque les SORTIES MAJEURES d'un 🔥 (nouveau modèle, version importante, fonctionnalité notable). Sois sélectif : 🔥 doit rester rare.
- Pour chaque entrée : un titre court en **gras**, puis UNE phrase qui dit pourquoi ça compte (pas de paraphrase du titre), puis le lien Markdown sur la source.
- Si une verticale n'a rien de notable, écris une seule ligne le disant. Ne meuble jamais.
- Français, ton direct, zéro remplissage, zéro flagornerie.

Structure du Markdown (exactement ces 3 sections) :
## IA / LLM
## Photo & Vidéo
## Design & outils

Réponds UNIQUEMENT par un objet JSON valide, sans texte autour ni balises de code. Schéma :
{
  "full_markdown": "le digest complet en Markdown selon la structure ci-dessus",
  "whatsapp_summary": "résumé WhatsApp < 1100 caractères. Format WhatsApp : titre en *gras* (un seul astérisque), puces avec •, sauts de ligne réels. 3 à 6 infos majeures max, sans liens. Commence par une ligne *📰 Digest IA — <date courte>*"
}`;

export async function curate(items) {
  if (!items.length) {
    return {
      full_markdown: "_Aucune actualité notable collectée cette semaine._",
      whatsapp_summary: "Rien de notable cette semaine côté IA / photo-vidéo / design.",
    };
  }

  const userContent = `Voici les ${items.length} items collectés cette semaine :\n${buildItemList(items)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 5000,
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const clean = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Fallback : si le parsing échoue, on livre le texte brut plutôt que de planter.
    return { full_markdown: clean, whatsapp_summary: clean.slice(0, 1100) };
  }
}
