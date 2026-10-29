#!/bin/sh
# Daily PostgreSQL dump, 14 days kept. Run from cron on the VM:
#   0 3 * * * /home/ubuntu/delivero/deploy/sauvegarde.sh >> /home/ubuntu/sauvegardes/cron.log 2>&1
# Offsite copy (strongly recommended: a backup on the same disk is not a
# backup). Set in the cron environment or export before running:
#   SAUVEGARDE_DISTANT="user@backup-host:/backups/rapiliv/"   # scp destination
#   SAUVEGARDE_SSH_OPTS="-i /home/ubuntu/.ssh/backup_ed25519" # optional
# Example crontab line with offsite:
#   0 3 * * * SAUVEGARDE_DISTANT="user@host:/backups/" /home/ubuntu/delivero/deploy/sauvegarde.sh >> /home/ubuntu/sauvegardes/cron.log 2>&1
set -eu

DOSSIER="${SAUVEGARDE_DOSSIER:-$HOME/sauvegardes}"
mkdir -p "$DOSSIER"
cd "$(dirname "$0")"

DUMP="$DOSSIER/delivero-$(date +%Y%m%d-%H%M).dump"
docker compose exec -T db pg_dump -U delivero -Fc delivero > "$DUMP"
find "$DOSSIER" -name 'delivero-*.dump' -mtime +14 -delete

if [ -n "${SAUVEGARDE_DISTANT:-}" ]; then
  # shellcheck disable=SC2086
  scp ${SAUVEGARDE_SSH_OPTS:-} "$DUMP" "$SAUVEGARDE_DISTANT" \
    && echo "Copie distante OK : $SAUVEGARDE_DISTANT" \
    || echo "AVERTISSEMENT: copie distante échouée, dump local conservé : $DUMP"
fi
