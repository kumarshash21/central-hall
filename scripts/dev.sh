#!/bin/bash
# Starts the SSH tunnel to the VM's Postgres (if not already up), then runs Next.js.
if ! nc -z localhost 5433 2>/dev/null; then
  echo "Opening SSH tunnel to the VM database..."
  ssh -i ~/.ssh/id_ed25519 -f -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 \
    -L 5433:localhost:5432 kumar_shashwat_greyorange_com@172.35.0.13 || { echo "Tunnel failed (are you on the VPN?)"; exit 1; }
fi
exec npx next dev -p 3005 "$@"
