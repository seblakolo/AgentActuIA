# AI Weekly Digest

Agent hebdomadaire (samedi matin) : il collecte les actus **IA/LLM**, **photo-vidéo** et **design** des 7 derniers jours, les curate avec **Claude Opus**, publie une **page web lisible** (GitHub Pages) et t'envoie un **teaser sur WhatsApp** avec le lien.

## Comment ça marche (2 couches, pour borner le coût)

```
COLLECTE (0 token)                  CURATION (Opus, input borné)         LIVRAISON
flux curés (The Batch, Verge AI…)   ~120 items pré-filtrés → JSON        page web stylée (Pages)
+ labos + GitHub + HN + Reddit  →   { full_markdown, whatsapp_summary } → + teaser WhatsApp (+ lien)
filtre 7j + dédoublonnage
```

Le LLM ne crawle jamais le web : il ne voit que la liste déjà filtrée (titre + résumé court + URL). Input prévisible = coût prévisible (quelques centimes/run).

---

## Mise en place — étape par étape

### Étape 1 — Mettre les fichiers dans un dossier et initialiser git
```bash
cd ai-weekly-digest
git init
git add .
git commit -m "init digest"
```

### Étape 2 — Créer le repo GitHub et pousser
Crée un repo vide sur github.com (ex. `ai-weekly-digest`), puis :
```bash
git remote add origin git@github.com:<TON_USER>/ai-weekly-digest.git
git branch -M main
git push -u origin main
```

### Étape 3 — Récupérer ta clé API Anthropic
console.anthropic.com → API Keys → Create Key. Garde-la de côté pour l'étape 5.

### Étape 4 — Activer WhatsApp via CallMeBot (une seule fois)
1. Ajoute le numéro **+34 644 84 71 89** à tes contacts.
2. Envoie-lui sur WhatsApp, exactement : `I allow callmebot to send me messages`
3. Tu reçois en retour ton **apikey** (un nombre). Garde-le.
> CallMeBot = relais tiers gratuit, idéal en perso. Pour passer à l'API WhatsApp Cloud officielle plus tard, seul `src/deliver.js` change.

### Étape 5 — Déclarer les secrets GitHub
Repo → **Settings → Secrets and variables → Actions → New repository secret**. Crée ces 3 secrets :
| Nom | Valeur |
|-----|--------|
| `ANTHROPIC_API_KEY` | ta clé de l'étape 3 |
| `WHATSAPP_PHONE` | ton numéro au format international sans `+`, ex. `33612345678` |
| `CALLMEBOT_APIKEY` | l'apikey de l'étape 4 |
> `GITHUB_TOKEN` est fourni automatiquement, rien à faire.

### Étape 6 — Premier run manuel (pour tout valider)
Repo → onglet **Actions → weekly-digest → Run workflow**.
Le job : génère le digest → committe `digests/` et `docs/` → attend ~75 s → t'envoie le WhatsApp.
Vérifie : tu as reçu le message WhatsApp **et** un fichier est apparu dans `docs/`.

### Étape 7 — Activer GitHub Pages (pour la page lisible)
Repo → **Settings → Pages** → *Source* = **Deploy from a branch** → *Branch* = **main**, dossier **/docs** → Save.
Ton digest sera lisible à : `https://<TON_USER>.github.io/ai-weekly-digest/`
> Fais cette étape **après** le premier run (l'étape 6 crée le dossier `docs/`).

C'est tout. Ensuite ça tourne **tout seul chaque samedi** (cron `0 5 * * 6`, ≈ 7h Paris).

---

## Tester en local (optionnel)
```bash
npm install
ANTHROPIC_API_KEY=sk-... npm run dry   # collecte + curation, affiche le teaser, n'envoie rien
```
La page de test est écrite dans `docs/`. Ouvre-la dans un navigateur pour juger la lisibilité.

---

## Régler / personnaliser
- **Sources** : tout est dans `src/sources.js` (flux RSS, repos GitHub, requêtes HN + seuils de points, subs Reddit + seuils de score). Ajoute/retire librement.
- **Volume & fenêtre** : variables d'env `WINDOW_DAYS` (def. 7), `MAX_ITEMS` (def. 120).
- **Ton du digest** : prompt `SYSTEM` dans `src/curate.js`.
- **Look de la page** : palette + CSS dans `src/render.js`.
- **Heure d'envoi** : ligne `cron` dans `.github/workflows/digest.yml` (UTC).

## Bon à savoir
- **Robustesse** : chaque source est isolée. Si un flux RSS change d'URL ou tombe, le run continue et un *warning* apparaît dans les logs Actions → tu corriges `sources.js` sur cette base.
- **Vérifie le 1er run** : certaines URLs de flux sont mes meilleures estimations. Le premier `npm run dry` (ou les logs du run manuel) te diront lesquelles répondent. On ajuste ensuite, pas à l'aveugle.
- **WhatsApp** : message plafonné et sans rendu Markdown → le teaser reste court et pointe vers la page. La page Pages peut mettre ~1 min à se déployer (d'où l'attente de 75 s avant l'envoi).
