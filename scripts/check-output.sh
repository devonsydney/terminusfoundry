#!/usr/bin/env bash
# The built site must not reference the services that were dropped. Run after the build.
set -u
cd "$(dirname "$0")/.."
pattern='fathom|stripe|portal|disqus|tocbot|unpkg|google-analytics'
hits=$(grep -rilE "$pattern" _site --include='*.html' --include='*.js' --include='*.css' --include='*.xml' 2>/dev/null || true)
if [ -n "$hits" ]; then
  echo "FAIL: dropped services referenced in the build output:"
  grep -rinoE "$pattern" $hits | head -20
  exit 1
fi
echo "ok: no reference to fathom, stripe, portal, disqus, tocbot, unpkg or google-analytics in _site"
