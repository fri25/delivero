#!/bin/sh
# Daily PostgreSQL dump, 14 days kept. Run from cron on the VM:
#   0 3 * * * /home/ubuntu/delivero/deploy/sauvegarde.sh >> /home/ubuntu/sauvegardes/cron.log 2>&1
# Copy the dumps off the VM regularly: a backup on the same disk is not a backup.
set -eu

DOSSIER="${SAUVEGARDE_DOSSIER:-$HOME/sauvegardes}"
mkdir -p "$DOSSIER"
cd "$(dirname "$0")"

docker compose exec -T db pg_dump -U delivero -Fc delivero \
  > "$DOSSIER/delivero-$(date +%Y%m%d-%H%M).dump"
find "$DOSSIER" -name 'delivero-*.dump' -mtime +14 -delete
