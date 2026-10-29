#!/bin/sh
# Déploiement ChapExpress sur le VPS (Traefik externe déjà en place) :
# API + PostgreSQL + 4 fronts statiques. Tout-en-un : prérequis -> build ->
# démarrage -> santé (API + 4 domaines publics).
#
# Usage (depuis le VPS, dépôt clené) :
#   ./deploy.sh            # build + up + vérif santé
#   ./deploy.sh --no-build # up sans rebuild (rollback vers l'image en place)
set -eu
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

NO_BUILD=""
if [ "${1:-}" = "--no-build" ]; then NO_BUILD="--no-build"; fi

echo "==> 1/4 Prérequis"
command -v docker >/dev/null || { echo "ERREUR: docker absent." >&2; exit 1; }
docker compose version >/dev/null || { echo "ERREUR: plugin docker compose absent." >&2; exit 1; }
[ -f .env ] || { echo "ERREUR: deploy/.env absent — cp .env.example .env puis remplir." >&2; exit 1; }
if docker network inspect proxy >/dev/null 2>&1; then
  echo "    réseau proxy : existe déjà"
else
  docker network create proxy >/dev/null && echo "    réseau proxy : créé"
fi
docker compose config --quiet || { echo "ERREUR: .env incomplet (voir message ci-dessus)." >&2; exit 1; }

echo "==> 2/4 Build + démarrage"
# shellcheck disable=SC2086
docker compose up -d --build $NO_BUILD
docker compose ps

echo "==> 3/4 Santé de l'API (max ~5 min, migrations incluses)"
i=0
until docker compose exec -T api wget -q --spider http://localhost:3000/api/health 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "ERREUR: API toujours hors service — 20 dernières lignes :" >&2
    docker compose logs --tail=20 api >&2
    exit 1
  fi
  sleep 5
done
echo "    /api/health : OK"

echo "==> 4/4 Accès public via Traefik"
API_DOMAIN="$(grep -E '^API_DOMAIN=' .env | cut -d'"' -f2)"
# Le check public peut rater juste après un recreate (Traefik se ré-abonne) :
# 3 essais espacés avant de conclure.
ok_public=""
for _ in 1 2 3; do
  if [ -n "${API_DOMAIN:-}" ] && curl -sk --max-time 15 "https://$API_DOMAIN/api/health" | grep -q '"status":"ok"'; then
    ok_public="1"
    break
  fi
  sleep 15
done
for var in CLIENT_DOMAIN LIVREUR_DOMAIN PARTENAIRES_DOMAIN ADMIN_DOMAIN; do
  domain="$(grep -E "^${var}=" .env | cut -d'"' -f2)"
  if [ -n "${domain:-}" ] && curl -sk --max-time 15 "https://$domain/" -o /dev/null -w '%{http_code}' | grep -q '^200$'; then
    echo "    https://$domain/ : OK"
  else
    echo "    AVERTISSEMENT: https://$domain/ injoignable ou non-200."
    echo "    Vérifier : DNS $domain -> IP du VPS, router Traefik, ACME."
  fi
done
if [ -n "$ok_public" ]; then
  echo "    https://$API_DOMAIN/api/health : OK"
else
  echo "    AVERTISSEMENT: https://$API_DOMAIN/api/health injoignable."
  echo "    Vérifier : DNS $API_DOMAIN -> IP du VPS, router Traefik, ACME."
fi
echo "Déploiement terminé."
