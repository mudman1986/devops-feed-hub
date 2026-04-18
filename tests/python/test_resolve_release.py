#!/usr/bin/env python3
"""Tests for resolve-release.py."""

import importlib.util
import json
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[2] / "scripts" / "workflows" / "resolve-release.py"
spec = importlib.util.spec_from_file_location("resolve_release", str(SCRIPT_PATH))
if spec is None or spec.loader is None:
    raise ImportError(f"Unable to load module spec for {SCRIPT_PATH}")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def _write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload), encoding="utf-8")


def _write_release_files(tmp_path: Path, *, tag: str = "v1.0.0") -> tuple[Path, Path, Path, Path, Path]:
    config_path = tmp_path / "release.json"
    starter_workflow_path = tmp_path / "publish.yml"
    starter_readme_path = tmp_path / "README.md"
    package_json_path = tmp_path / "package.json"
    package_lock_path = tmp_path / "package-lock.json"

    _write_json(config_path, {"tag": tag})
    starter_workflow_path.write_text(
        "\n".join(
            [
                "jobs:",
                "  publish-pages:",
                "    uses: mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@" + tag,
                "",
            ]
        ),
        encoding="utf-8",
    )
    starter_readme_path.write_text(
        (
            "mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@"
            f"{tag}\n"
        ),
        encoding="utf-8",
    )
    _write_json(package_json_path, {"version": tag.removeprefix("v")})
    _write_json(
        package_lock_path,
        {
            "version": tag.removeprefix("v"),
            "packages": {"": {"version": tag.removeprefix("v")}},
        },
    )

    return (
        config_path,
        starter_workflow_path,
        starter_readme_path,
        package_json_path,
        package_lock_path,
    )


def test_validate_release_metadata_accepts_matching_files(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
        package_json_path,
        package_lock_path,
    ) = _write_release_files(tmp_path)

    tag, version_number = module.validate_release_metadata(
        config_path=config_path,
        starter_workflow_path=starter_workflow_path,
        starter_readme_path=starter_readme_path,
        package_json_path=package_json_path,
        package_lock_path=package_lock_path,
    )

    assert tag == "v1.0.0"
    assert version_number == "1.0.0"


def test_validate_release_metadata_rejects_non_semver_tag(tmp_path):
    config_path, *_ = _write_release_files(tmp_path, tag="v1")

    try:
        module.load_release_tag(config_path)
    except ValueError as error:
        assert "must match vX.Y.Z" in str(error)
    else:
        raise AssertionError("Expected semver validation failure")


def test_validate_release_metadata_rejects_starter_workflow_mismatch(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
        package_json_path,
        package_lock_path,
    ) = _write_release_files(tmp_path)
    starter_workflow_path.write_text(
        (
            "jobs:\n"
            "  publish-pages:\n"
            "    uses: mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@v1.0.1\n"
        ),
        encoding="utf-8",
    )

    try:
        module.validate_release_metadata(
            config_path=config_path,
            starter_workflow_path=starter_workflow_path,
            starter_readme_path=starter_readme_path,
            package_json_path=package_json_path,
            package_lock_path=package_lock_path,
        )
    except ValueError as error:
        assert "must match v1.0.0" in str(error)
    else:
        raise AssertionError("Expected starter workflow mismatch")


def test_validate_release_metadata_rejects_readme_mismatch(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
        package_json_path,
        package_lock_path,
    ) = _write_release_files(tmp_path)
    starter_readme_path.write_text(
        "mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@v1.0.1\n",
        encoding="utf-8",
    )

    try:
        module.validate_release_metadata(
            config_path=config_path,
            starter_workflow_path=starter_workflow_path,
            starter_readme_path=starter_readme_path,
            package_json_path=package_json_path,
            package_lock_path=package_lock_path,
        )
    except ValueError as error:
        assert "must all match v1.0.0" in str(error)
    else:
        raise AssertionError("Expected starter README mismatch")


def test_validate_release_metadata_rejects_package_version_mismatch(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
        package_json_path,
        package_lock_path,
    ) = _write_release_files(tmp_path)
    _write_json(package_json_path, {"version": "1.0.1"})

    try:
        module.validate_release_metadata(
            config_path=config_path,
            starter_workflow_path=starter_workflow_path,
            starter_readme_path=starter_readme_path,
            package_json_path=package_json_path,
            package_lock_path=package_lock_path,
        )
    except ValueError as error:
        assert "package.json" in str(error)
    else:
        raise AssertionError("Expected package.json mismatch")


def test_validate_release_metadata_rejects_package_lock_mismatch(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
        package_json_path,
        package_lock_path,
    ) = _write_release_files(tmp_path)
    _write_json(
        package_lock_path,
        {"version": "1.0.1", "packages": {"": {"version": "1.0.1"}}},
    )

    try:
        module.validate_release_metadata(
            config_path=config_path,
            starter_workflow_path=starter_workflow_path,
            starter_readme_path=starter_readme_path,
            package_json_path=package_json_path,
            package_lock_path=package_lock_path,
        )
    except ValueError as error:
        assert "package-lock.json" in str(error)
    else:
        raise AssertionError("Expected package-lock mismatch")
