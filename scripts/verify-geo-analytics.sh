#!/usr/bin/env bash
# Checks which HTML page CloudFront serves to this machine's country.
#
# Usage: scripts/verify-geo-analytics.sh <ga|no-ga> [base-url]
#   ga     expect the GA page (for example, run from Japan or the US)
#   no-ga  expect the GA-free page (for example, run from Germany)
#
# Run it once the CDN routing is live: until then every path serves the file it
# names, so /index.analytics.html has the meta tag for everyone.
set -euo pipefail

expected=${1:?usage: verify-geo-analytics.sh <ga|no-ga> [base-url]}
base=${2:-https://it-infra-meetup.org}
failed=0

for path in / /index.html /index.analytics.html; do
  body=$(curl --silent --show-error --fail --max-time 20 "$base$path")
  got=no-ga
  if [[ $body == *'name="ga-measurement-id"'* ]]; then
    got=ga
  fi
  if [[ $got == "$expected" ]]; then
    echo "ok    $path -> $got"
  else
    echo "FAIL  $path -> $got (expected $expected)"
    failed=1
  fi
done

exit "$failed"
