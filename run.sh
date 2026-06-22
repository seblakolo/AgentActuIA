#!/bin/bash
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
cd "$(dirname "$0")" || exit 1
set -a; [ -f .env ] && . ./.env; set +a
DATE="$(date +%F)"
export DIGEST_DATE="$DATE"
mkdir -p logs digests docs
LOG="logs/run-$DATE.log"
exec > >(tee -a "$LOG") 2>&1
echo "=== RUN $DATE $(date) ==="
node src/run-collect.js || { echo "ECHEC collecte"; exit 1; }
claude -p "La date du jour est $DATE. Lis items.json et genere le digest de la semaine en suivant CLAUDE.md. Ecris digests/$DATE.md et digests/.latest.json." \
  --allowedTools "Read,Write" \
  --permission-mode acceptEdits || { echo "ECHEC curation Claude Code"; exit 1; }
node src/run-render.js || { echo "ECHEC rendu"; exit 1; }
git add digests/ docs/ && git commit -m "digest: $DATE" || echo "(rien a committer)"
git push || echo "(push echoue - verifier auth git)"
node src/notify.js || echo "(envoi WhatsApp echoue)"
open "docs/index.html" 2>/dev/null || true
echo "=== FIN $DATE ==="
