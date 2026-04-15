#!/usr/bin/env python3
"""Tests for update-preview-manifest.py"""

import importlib.util
import json
import os
import sys
import tempfile
from typing import Any

import pytest

# Load the script as a module without executing its __main__ block
SCRIPT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "update-preview-manifest.py")
spec = importlib.util.spec_from_file_location("update_preview_manifest", SCRIPT_PATH)
_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_module)
update_manifest = _module.update_manifest


def _run(manifest_json: str, branch: str, slug: str, url: str, tmp_path: str) -> tuple[dict[str, Any], dict[str, Any]]:
    """Helper: call update_manifest and return (returned dict, written dict)."""
    manifest_file = os.path.join(tmp_path, "manifest.json")
    result = update_manifest(manifest_json, branch, slug, url, manifest_file)
    with open(manifest_file, encoding="utf-8") as f:
        written = json.load(f)
    return result, written


class TestUpdateManifestFreshStart:
    def test_creates_entry_from_empty_manifest(self, tmp_path):
        _, written = _run('{"previews":[]}', "feature/foo", "feature--foo", "https://example.com/preview/feature--foo", str(tmp_path))
        assert len(written["previews"]) == 1
        entry = written["previews"][0]
        assert entry["branch"] == "feature/foo"
        assert entry["slug"] == "feature--foo"
        assert entry["url"] == "https://example.com/preview/feature--foo/"

    def test_creates_entry_when_manifest_key_missing(self, tmp_path):
        _, written = _run('{}', "main-preview", "main-preview", "https://example.com/preview/main-preview", str(tmp_path))
        assert len(written["previews"]) == 1

    def test_invalid_json_falls_back_to_fresh(self, tmp_path):
        _, written = _run("NOT VALID JSON", "branch", "branch", "https://example.com/preview/branch", str(tmp_path))
        assert len(written["previews"]) == 1


class TestUpdateManifestUpdate:
    def test_updates_existing_slug(self, tmp_path):
        existing = json.dumps({
            "previews": [
                {"branch": "feature/foo", "slug": "feature--foo", "url": "https://example.com/preview/feature--foo/", "updated_at": "2026-01-01T00:00:00Z"}
            ]
        })
        _, written = _run(existing, "feature/foo", "feature--foo", "https://example.com/preview/feature--foo", str(tmp_path))
        # Still only one entry for this slug
        assert len(written["previews"]) == 1
        # URL stays correct
        assert written["previews"][0]["url"] == "https://example.com/preview/feature--foo/"

    def test_adds_new_slug_without_removing_others(self, tmp_path):
        existing = json.dumps({
            "previews": [
                {"branch": "feature/bar", "slug": "feature--bar", "url": "https://example.com/preview/feature--bar/", "updated_at": "2026-01-01T00:00:00Z"}
            ]
        })
        _, written = _run(existing, "feature/foo", "feature--foo", "https://example.com/preview/feature--foo", str(tmp_path))
        slugs = {p["slug"] for p in written["previews"]}
        assert "feature--bar" in slugs
        assert "feature--foo" in slugs

    def test_only_one_entry_per_slug_after_update(self, tmp_path):
        existing = json.dumps({
            "previews": [
                {"branch": "feature/foo", "slug": "feature--foo", "url": "old/", "updated_at": "2026-01-01T00:00:00Z"},
                {"branch": "feature/foo", "slug": "feature--foo", "url": "duplicate/", "updated_at": "2026-01-02T00:00:00Z"},
            ]
        })
        _, written = _run(existing, "feature/foo", "feature--foo", "https://example.com/preview/feature--foo", str(tmp_path))
        foo_entries = [p for p in written["previews"] if p["slug"] == "feature--foo"]
        assert len(foo_entries) == 1


class TestUpdateManifestSorting:
    def test_most_recently_updated_is_first(self, tmp_path):
        existing = json.dumps({
            "previews": [
                {"branch": "old-branch", "slug": "old-branch", "url": "https://example.com/preview/old-branch/", "updated_at": "2026-01-01T00:00:00Z"}
            ]
        })
        _, written = _run(existing, "new-branch", "new-branch", "https://example.com/preview/new-branch", str(tmp_path))
        # The freshly added entry has a newer timestamp so should be first
        assert written["previews"][0]["slug"] == "new-branch"


class TestUpdateManifestFileOutput:
    def test_written_file_ends_with_newline(self, tmp_path):
        manifest_file = os.path.join(str(tmp_path), "manifest.json")
        update_manifest('{"previews":[]}', "branch", "branch", "https://example.com/preview/branch", manifest_file)
        with open(manifest_file, encoding="utf-8") as f:
            content = f.read()
        assert content.endswith("\n")

    def test_written_file_is_valid_json(self, tmp_path):
        manifest_file = os.path.join(str(tmp_path), "manifest.json")
        update_manifest('{"previews":[]}', "branch", "branch", "https://example.com/preview/branch", manifest_file)
        with open(manifest_file, encoding="utf-8") as f:
            parsed = json.load(f)
        assert "previews" in parsed

    def test_creates_parent_directories(self, tmp_path):
        deep_path = os.path.join(str(tmp_path), "a", "b", "c", "manifest.json")
        update_manifest('{"previews":[]}', "branch", "branch", "https://example.com/preview/branch", deep_path)
        assert os.path.exists(deep_path)
