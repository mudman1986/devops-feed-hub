#!/usr/bin/env python3
"""Tests for merge-pages-content.py."""

import importlib.util
from pathlib import Path

import pytest

SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "scripts"
    / "workflows"
    / "merge-pages-content.py"
)
spec = importlib.util.spec_from_file_location("merge_pages_content", str(SCRIPT_PATH))
if spec is None or spec.loader is None:
    raise ImportError(f"Unable to load module spec for {SCRIPT_PATH}")
_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_module)
merge_pages_content = _module.merge_pages_content
validate_deploy_subdir = _module.validate_deploy_subdir


def write_file(path: Path, content: str) -> None:
    """Write a file, creating parent directories as needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def test_validate_deploy_subdir_rejects_parent_segments() -> None:
    with pytest.raises(ValueError, match="parent path segments"):
        validate_deploy_subdir("../preview")


def test_merge_root_build_preserves_existing_previews(tmp_path: Path) -> None:
    existing_dir = tmp_path / "existing"
    build_dir = tmp_path / "build"
    output_dir = tmp_path / "site"

    write_file(existing_dir / "index.html", "production v1")
    write_file(existing_dir / "old.html", "remove me")
    write_file(existing_dir / "preview" / "feature-a" / "index.html", "preview")
    write_file(
        existing_dir / "preview" / "manifest.json",
        '{"previews":[{"slug":"feature-a"}]}\n',
    )
    write_file(build_dir / "index.html", "production v2")
    write_file(build_dir / "summary.html", "summary")

    merge_pages_content(str(build_dir), str(output_dir), existing_dir=str(existing_dir))

    assert (output_dir / "index.html").read_text(encoding="utf-8") == "production v2"
    assert (output_dir / "summary.html").read_text(encoding="utf-8") == "summary"
    assert not (output_dir / "old.html").exists()
    assert (
        output_dir / "preview" / "feature-a" / "index.html"
    ).read_text(encoding="utf-8") == "preview"


def test_merge_preview_build_preserves_production_site(tmp_path: Path) -> None:
    existing_dir = tmp_path / "existing"
    build_dir = tmp_path / "build"
    output_dir = tmp_path / "site"

    write_file(existing_dir / "index.html", "production")
    write_file(existing_dir / "summary.html", "summary")
    write_file(existing_dir / "preview" / "feature-a" / "old.html", "stale")
    write_file(build_dir / "index.html", "preview")

    merge_pages_content(
        str(build_dir),
        str(output_dir),
        deploy_subdir="preview/feature-a",
        existing_dir=str(existing_dir),
    )

    assert (output_dir / "index.html").read_text(encoding="utf-8") == "production"
    assert (output_dir / "summary.html").read_text(encoding="utf-8") == "summary"
    assert (
        output_dir / "preview" / "feature-a" / "index.html"
    ).read_text(encoding="utf-8") == "preview"
    assert not (output_dir / "preview" / "feature-a" / "old.html").exists()


def test_merge_preview_build_creates_nested_directory(tmp_path: Path) -> None:
    build_dir = tmp_path / "build"
    output_dir = tmp_path / "site"

    write_file(build_dir / "index.html", "preview")

    merge_pages_content(
        str(build_dir),
        str(output_dir),
        deploy_subdir="preview/feature-branch",
    )

    assert (
        output_dir / "preview" / "feature-branch" / "index.html"
    ).read_text(encoding="utf-8") == "preview"
