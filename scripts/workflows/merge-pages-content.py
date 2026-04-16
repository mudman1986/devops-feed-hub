#!/usr/bin/env python3
"""Merge generated GitHub Pages content into a deployable site directory."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


def validate_deploy_subdir(deploy_subdir: str) -> Path:
    """Validate and normalize a relative deploy subdirectory."""
    if deploy_subdir in ("", "."):
        return Path()

    deploy_path = Path(deploy_subdir)
    if deploy_path.is_absolute():
        raise ValueError(f"Deploy subdirectory must be relative: {deploy_subdir}")

    if any(part == ".." for part in deploy_path.parts):
        raise ValueError(
            f"Deploy subdirectory cannot contain parent path segments: {deploy_subdir}"
        )

    return deploy_path


def copy_directory_contents(source_dir: Path, destination_dir: Path) -> None:
    """Copy all files and directories from source_dir into destination_dir."""
    destination_dir.mkdir(parents=True, exist_ok=True)
    for item in source_dir.iterdir():
        destination_path = destination_dir / item.name
        if item.is_dir():
            shutil.copytree(item, destination_path, dirs_exist_ok=True)
        else:
            shutil.copy2(item, destination_path)


def remove_directory_contents(
    directory: Path, preserve_names: set[str] | None = None
) -> None:
    """Remove all contents from a directory, preserving named entries when requested."""
    preserve_names = preserve_names or set()
    if not directory.exists():
        return
    for item in directory.iterdir():
        if item.name in preserve_names:
            continue
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()


def merge_pages_content(
    build_dir: str,
    output_dir: str,
    deploy_subdir: str = "",
    existing_dir: str | None = None,
) -> Path:
    """Merge existing Pages content with the latest generated build output."""
    build_path = Path(build_dir)
    output_path = Path(output_dir)
    deploy_path = validate_deploy_subdir(deploy_subdir)
    existing_path = Path(existing_dir) if existing_dir else None

    if not build_path.is_dir():
        raise ValueError(f"Build directory does not exist: {build_dir}")

    if output_path.exists():
        shutil.rmtree(output_path)
    output_path.mkdir(parents=True, exist_ok=True)

    if existing_path and existing_path.is_dir():
        copy_directory_contents(existing_path, output_path)

    target_dir = output_path / deploy_path
    if deploy_path.parts:
        if target_dir.exists():
            shutil.rmtree(target_dir)
        target_dir.mkdir(parents=True, exist_ok=True)
    else:
        remove_directory_contents(output_path, preserve_names={"preview"})

    copy_directory_contents(build_path, target_dir)
    return output_path


def main() -> None:
    """Parse CLI arguments and merge the generated Pages content."""
    parser = argparse.ArgumentParser(
        description="Merge generated Pages content into a deployable site directory."
    )
    parser.add_argument(
        "--build-dir", required=True, help="Directory with fresh build output"
    )
    parser.add_argument(
        "--output-dir", required=True, help="Directory for merged site output"
    )
    parser.add_argument(
        "--deploy-subdir",
        default="",
        help="Relative subdirectory inside the output directory for preview builds",
    )
    parser.add_argument(
        "--existing-dir",
        default="",
        help="Optional directory with the previously deployed site snapshot",
    )
    args = parser.parse_args()

    merge_pages_content(
        build_dir=args.build_dir,
        output_dir=args.output_dir,
        deploy_subdir=args.deploy_subdir,
        existing_dir=args.existing_dir or None,
    )


if __name__ == "__main__":
    main()
