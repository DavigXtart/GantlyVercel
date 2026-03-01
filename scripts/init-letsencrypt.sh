#!/bin/bash
# Script to obtain initial SSL certificates using certbot

set -e

DOMAIN=${1:-gantly.es}
EMAIL=${2:-admin@gantly.es}

echo "Obtaining SSL certificate for $DOMAIN..."

docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

echo "Certificate obtained successfully!"
echo "Restarting frontend to load new certificates..."
docker compose -f docker-compose.prod.yml restart frontend

echo "Done! SSL is now active for $DOMAIN"
