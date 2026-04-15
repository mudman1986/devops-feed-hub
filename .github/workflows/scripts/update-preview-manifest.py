#!/usr/bin/env python3
"""Update the preview/manifest.json with the latest preview deployment entry."""

import json
import os
import sys
from datetime import datetime, timezone


def update_manifest(
    manifest_json: str,
    source_branch: str,
    preview_slug: str,
    base_url: str,
    manifest_path: str,
) -> dict:
    """Merge a preview entry into the manifest and write it to disk.

    Args:
        manifest_json: JSON string of the existing manifest (or ``{}``)
        source_branch: Name of the source branch
        preview_slug: URL-safe slug derived from the branch name
        base_url: Base URL for the preview deployment (without trailing slash)
        manifest_path: Filesystem path where the manifest will be written

    Returns:
        The updated manifest dict.
    """
    try:
        manifest = json.loads(manifest_json)
    except json.JSONDecodeError as exc:
        print(
            f"Warning: could not parse existing manifest ({exc}); starting fresh",
            file=sys.stderr,
        )
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

    os.makedirs(os.path.dirname(os.path.abspath(manifest_path)), exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")

    return manifest


def main() -> None:
    """Entry point: reads configuration from environment variables."""
    manifest_path = os.path.join("docs", "preview", "manifest.json")
    source_branch = os.environ["SOURCE_BRANCH"]
    preview_slug = os.environ["PREVIEW_SLUG"]
    base_url = os.environ["BASE_URL"]
    manifest_json = os.environ.get("MANIFEST", '{"previews":[]}')

    manifest = update_manifest(
        manifest_json, source_branch, preview_slug, base_url, manifest_path
    )
    print(
        f"✓ Preview manifest updated ({len(manifest['previews'])} entries)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
