#!/usr/bin/env bash
# NADF-GUIDE
# Propósito: Deploy DoEventsWEB a DEV (S3 + CloudFront) desde Linux/Actions.
# Configuración: AWS creds; vars BUCKET/REGION/CLOUDFRONT_DISTRIBUTION_ID.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

REGION="${AWS_REGION:-sa-east-1}"
BUCKET="${DOEVENTS_WEB_DEV_BUCKET:-doevents-web-dev}"
CF_ID="${CLOUDFRONT_DISTRIBUTION_ID:-E1AIDTCT83PAW5}"

if [ -z "${VITE_GOOGLE_MAPS_API_KEY:-}" ]; then
  echo "ERROR: Falta VITE_GOOGLE_MAPS_API_KEY (exportarla o definir vars en Actions)." >&2
  exit 1
fi

echo "=== Build DEV (devaws) ==="
npm run build:devaws

echo "=== Sync S3 s3://${BUCKET} (${REGION}) ==="
aws s3 sync packages/shell/dist/assets/ "s3://${BUCKET}/assets/" --delete --region "$REGION" \
  --cache-control "public, max-age=31536000, immutable"
aws s3 sync packages/shell/dist/ "s3://${BUCKET}/" --delete --region "$REGION" \
  --exclude "index.html" --exclude "assets/*" \
  --cache-control "public, max-age=86400"
aws s3 cp packages/shell/dist/index.html "s3://${BUCKET}/index.html" --region "$REGION" \
  --cache-control "public, max-age=0, must-revalidate" --content-type "text/html"

if [ -d packages/mfe-auth/dist ]; then
  aws s3 sync packages/mfe-auth/dist/assets/ "s3://${BUCKET}/mfe-auth/assets/" --delete --region "$REGION" \
    --cache-control "public, max-age=31536000, immutable" --exclude "@mf-types/*" || true
  aws s3 sync packages/mfe-auth/dist/ "s3://${BUCKET}/mfe-auth/" --delete --region "$REGION" \
    --exclude "index.html" --exclude "assets/*" --exclude "@mf-types/*" \
    --cache-control "public, max-age=86400" || true
  if [ -f packages/mfe-auth/dist/index.html ]; then
    aws s3 cp packages/mfe-auth/dist/index.html "s3://${BUCKET}/mfe-auth/index.html" --region "$REGION" \
      --cache-control "public, max-age=0, must-revalidate"
  fi
fi

if [ -n "$CF_ID" ]; then
  echo "=== Invalidate CloudFront ${CF_ID} ==="
  aws cloudfront create-invalidation --distribution-id "$CF_ID" --paths "/*" >/dev/null
fi

echo "=== Deploy DEV WEB OK → https://dev.doeventsapp.com ==="
