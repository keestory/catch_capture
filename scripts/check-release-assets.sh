#!/bin/sh

set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
evaluation_dir="$project_root/assets/samples/screenshots/user-evaluation"

for asset in "$evaluation_dir"/*.jpg "$evaluation_dir"/*.jpeg "$evaluation_dir"/*.png; do
  if [ -f "$asset" ]; then
    echo "error: Release blocked because local evaluation screenshots are still bundled." >&2
    echo "error: Remove or replace assets/samples/screenshots/user-evaluation images first." >&2
    exit 1
  fi
done
