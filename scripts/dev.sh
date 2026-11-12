#!/bin/bash
# Starts the SSH tunnel to the VM's Postgres (if not already up), then runs Next.js.

# Read the DB port from DATABASE_URL (env or .env.local). On the VM it's 5432
# (Postgres is local), so no tunnel is needed there.
DB_URL="${DATABASE_URL:-$(grep -E '^DATABASE_URL=' "$(dirname "$0")/../.env.local" 2>/dev/null | cut -d= -f2-)}"
DB_PORT="$(echo "$DB_URL" | sed -nE 's#.*@[^:/]+:([0-9]+)/.*#\1#p')"

if [ "$SKIP_TUNNEL" = "1" ] || [ "$DB_PORT" = "5432" ]; then
  echo "Using database directly (no SSH tunnel)."
elif ! nc -z localhost 5433 2>/dev/null; then
  echo "Opening SSH tunnel to the VM database..."
  ssh -i ~/.ssh/id_ed25519 -f -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 \
    -L 5433:localhost:5432 kumar_shashwat_greyorange_com@172.35.0.13 || { echo "Tunnel failed (are you on the VPN?)"; exit 1; }
fi
exec npx next dev -p 3005 "$@"
