#!/usr/bin/env python3
"""Resolve and validate committed release metadata."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

SEMVER_TAG_PATTERN = re.compile(r"^v[0-9]+\.[0-9]+\.[0-9]+$")
STARTER_WORKFLOW_REF_PATTERN = re.compile(
    r"uses:\s+mudman1986/devops-feed-hub/\.github/workflows/publish-pages\.yml@([^\s]+)"
)
STARTER_README_REF_PATTERN = re.compile(
    r"mudman1986/devops-feed-hub/\.github/workflows/publish-pages\.yml@([^\s`]+)"
)


def _read_json(path: Path) -> dict:
    """Load a JSON object from disk."""
    with path.open(encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")

    return data


def _require_string(value: object, label: str) -> str:
    """Validate a required string value."""
    if not isinstance(value, str) or not value:
        raise ValueError(f"{label} must be a non-empty string")

    return value


def load_release_tag(config_path: Path) -> str:
    """Return the configured release tag."""
    tag = _require_string(_read_json(config_path).get("tag"), f"{config_path}: tag")

    if not SEMVER_TAG_PATTERN.fullmatch(tag):
        raise ValueError(f"{config_path}: tag must match vX.Y.Z")

    return tag


def load_package_version(package_path: Path) -> str:
    """Return the package version from a package manifest."""
    return _require_string(
        _read_json(package_path).get("version"), f"{package_path}: version"
    )


def load_package_lock_version(package_lock_path: Path) -> str:
    """Return the package version from the root package-lock entry."""
    package_lock_data = _read_json(package_lock_path)
    root_version = _require_string(
        package_lock_data.get("version"), f"{package_lock_path}: version"
    )
    packages = package_lock_data.get("packages")

    if not isinstance(packages, dict):
        raise ValueError(f"{package_lock_path}: packages must be an object")

    root_package = packages.get("")
    if not isinstance(root_package, dict):
        raise ValueError(f"{package_lock_path}: packages[''] must be an object")

    nested_version = _require_string(
        root_package.get("version"), f"{package_lock_path}: packages[''].version"
    )

    if root_version != nested_version:
        raise ValueError(
            f"{package_lock_path}: version and packages[''].version must match"
        )

    return root_version


def load_starter_workflow_ref(workflow_path: Path) -> str:
    """Return the pinned reusable-workflow ref from the starter workflow."""
    workflow_text = workflow_path.read_text(encoding="utf-8")
    match = STARTER_WORKFLOW_REF_PATTERN.search(workflow_text)

    if match is None:
        raise ValueError(
            f"{workflow_path}: could not find publish-pages reusable workflow ref"
        )

    return match.group(1)


def load_starter_readme_refs(readme_path: Path) -> set[str]:
    """Return all reusable-workflow refs mentioned in the starter README."""
    readme_text = readme_path.read_text(encoding="utf-8")
    refs = set(STARTER_README_REF_PATTERN.findall(readme_text))

    if not refs:
        raise ValueError(
            f"{readme_path}: must mention the reusable workflow release reference"
        )

    return refs


def validate_release_metadata(
    *,
    config_path: Path,
    starter_workflow_path: Path,
    starter_readme_path: Path,
    package_json_path: Path,
    package_lock_path: Path,
) -> tuple[str, str]:
    """Validate committed release metadata and return (tag, version_number)."""
    tag = load_release_tag(config_path)
    version_number = tag.removeprefix("v")

    starter_workflow_ref = load_starter_workflow_ref(starter_workflow_path)
    if starter_workflow_ref != tag:
        raise ValueError(
            f"{starter_workflow_path}: reusable workflow ref {starter_workflow_ref} "
            f"must match {tag}"
        )

    starter_readme_refs = load_starter_readme_refs(starter_readme_path)
    if starter_readme_refs != {tag}:
        refs_text = ", ".join(sorted(starter_readme_refs))
        raise ValueError(
            f"{starter_readme_path}: reusable workflow refs [{refs_text}] must all "
            f"match {tag}"
        )

    package_version = load_package_version(package_json_path)
    if package_version != version_number:
        raise ValueError(
            f"{package_json_path}: version {package_version} must match {version_number}"
        )

    package_lock_version = load_package_lock_version(package_lock_path)
    if package_lock_version != version_number:
        raise ValueError(
            f"{package_lock_path}: version {package_lock_version} must match "
            f"{version_number}"
        )

    return tag, version_number


def write_github_outputs(output_path: Path, *, tag: str, version_number: str) -> None:
    """Write workflow outputs for downstream steps."""
    with output_path.open("a", encoding="utf-8") as file:
        file.write(f"tag={tag}\n")
        file.write(f"version_number={version_number}\n")


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Resolve and validate committed release metadata."
    )
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--starter-workflow", type=Path, required=True)
    parser.add_argument("--starter-readme", type=Path, required=True)
    parser.add_argument("--package-json", type=Path, required=True)
    parser.add_argument("--package-lock", type=Path, required=True)
    parser.add_argument("--github-output", type=Path)
    return parser.parse_args()


def main() -> int:
    """Run the release metadata resolver."""
    args = parse_args()

    try:
        tag, version_number = validate_release_metadata(
            config_path=args.config,
            starter_workflow_path=args.starter_workflow,
            starter_readme_path=args.starter_readme,
            package_json_path=args.package_json,
            package_lock_path=args.package_lock,
        )
    except (json.JSONDecodeError, OSError, ValueError) as error:
        print(f"Release metadata validation failed: {error}", file=sys.stderr)
        return 1

    if args.github_output is not None:
        write_github_outputs(
            args.github_output, tag=tag, version_number=version_number
        )

    print(tag)
    return 0


if __name__ == "__main__":
    sys.exit(main())
