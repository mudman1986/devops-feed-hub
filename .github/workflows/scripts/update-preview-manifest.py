#!/usr/bin/env python3
"""Update the preview/manifest.json with the latest preview deployment entry."""

import json
import os
import sys
from datetime import datetime, timezone

manifest_path = os.path.join("docs", "preview", "manifest.json")
source_branch = os.environ["SOURCE_BRANCH"]
preview_slug = os.environ["PREVIEW_SLUG"]
base_url = os.environ["BASE_URL"]
manifest_json = os.environ.get("MANIFEST", '{"previews":[]}')

try:
    manifest = json.loads(manifest_json)
except json.JSONDecodeError as exc:
    print(f"Warning: could not parse existing manifest ({exc}); starting fresh")
    manifest = {"previews": []}

previews = manifest.get("previews", [])

# Remove any stale entry for this slug then add updated one
previews = [p for p in previews if p.get("slug") != preview_slug]
previews.append(
    {
        "branch": source_branch,
        "slug": preview_slug,
        "url": base_url + "/",
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
)
previews.sort(key=lambda p: p.get("updated_at", ""), reverse=True)
manifest["previews"] = previews

os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")

print(f"✓ Preview manifest updated ({len(previews)} entries)", file=sys.stderr)
