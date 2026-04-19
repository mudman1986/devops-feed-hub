#!/usr/bin/env python3
"""Tests for resolve_release.py."""

import importlib.util
import json
from pathlib import Path

# pylint: disable=missing-function-docstring

SCRIPT_PATH = (
    Path(__file__).resolve().parents[2] / "scripts" / "workflows" / "resolve_release.py"
)
spec = importlib.util.spec_from_file_location("resolve_release", str(SCRIPT_PATH))
if spec is None or spec.loader is None:
    raise ImportError(f"Unable to load module spec for {SCRIPT_PATH}")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def _write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload), encoding="utf-8")


def _write_release_files(
    tmp_path: Path, *, tag: str = "v1.0.0"
) -> tuple[Path, Path, Path]:
    config_path = tmp_path / "release.json"
    starter_workflow_path = tmp_path / "publish.yml"
    starter_readme_path = tmp_path / "README.md"

    _write_json(config_path, {"tag": tag})
    starter_workflow_path.write_text(
        "\n".join(
            [
                "jobs:",
                "  publish-pages:",
                "    uses: mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@"
                + tag,
                "    with:",
                "      engine-repository: mudman1986/devops-feed-hub",
                f"      engine-ref: {tag}",
                "",
            ]
        ),
        encoding="utf-8",
    )
    starter_readme_path.write_text(
        ("mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@" f"{tag}\n"),
        encoding="utf-8",
    )

    return (
        config_path,
        starter_workflow_path,
        starter_readme_path,
    )


def test_validate_release_metadata_accepts_matching_files(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
    ) = _write_release_files(tmp_path)

    tag, version_number = module.validate_release_metadata(
        config_path=config_path,
        starter_workflow_path=starter_workflow_path,
        starter_readme_path=starter_readme_path,
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
        )
    except ValueError as error:
        assert "must match v1.0.0" in str(error)
    else:
        raise AssertionError("Expected starter workflow mismatch")


def test_validate_release_metadata_rejects_starter_engine_ref_mismatch(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
    ) = _write_release_files(tmp_path)
    starter_workflow_path.write_text(
        (
            "jobs:\n"
            "  publish-pages:\n"
            "    uses: mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@v1.0.0\n"
            "    with:\n"
            "      engine-repository: mudman1986/devops-feed-hub\n"
            "      engine-ref: v1.0.1\n"
        ),
        encoding="utf-8",
    )

    try:
        module.validate_release_metadata(
            config_path=config_path,
            starter_workflow_path=starter_workflow_path,
            starter_readme_path=starter_readme_path,
        )
    except ValueError as error:
        assert "engine ref v1.0.1 must match v1.0.0" in str(error)
    else:
        raise AssertionError("Expected starter engine ref mismatch")


def test_validate_release_metadata_rejects_starter_engine_repository_mismatch(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
    ) = _write_release_files(tmp_path)
    starter_workflow_path.write_text(
        (
            "jobs:\n"
            "  publish-pages:\n"
            "    uses: mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@v1.0.0\n"
            "    with:\n"
            "      engine-repository: mudman1986/example-feed-hub\n"
            "      engine-ref: v1.0.0\n"
        ),
        encoding="utf-8",
    )

    try:
        module.validate_release_metadata(
            config_path=config_path,
            starter_workflow_path=starter_workflow_path,
            starter_readme_path=starter_readme_path,
        )
    except ValueError as error:
        assert (
            "engine repository mudman1986/example-feed-hub must match "
            "mudman1986/devops-feed-hub"
        ) in str(error)
    else:
        raise AssertionError("Expected starter engine repository mismatch")


def test_validate_release_metadata_rejects_missing_engine_repository(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
    ) = _write_release_files(tmp_path)
    starter_workflow_path.write_text(
        (
            "jobs:\n"
            "  publish-pages:\n"
            "    uses: mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@v1.0.0\n"
            "    with:\n"
            "      engine-ref: v1.0.0\n"
        ),
        encoding="utf-8",
    )

    try:
        module.validate_release_metadata(
            config_path=config_path,
            starter_workflow_path=starter_workflow_path,
            starter_readme_path=starter_readme_path,
        )
    except ValueError as error:
        assert "must set engine-repository" in str(error)
    else:
        raise AssertionError("Expected missing engine repository failure")


def test_validate_release_metadata_rejects_missing_engine_ref(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
    ) = _write_release_files(tmp_path)
    starter_workflow_path.write_text(
        (
            "jobs:\n"
            "  publish-pages:\n"
            "    uses: mudman1986/devops-feed-hub/.github/workflows/publish-pages.yml@v1.0.0\n"
            "    with:\n"
            "      engine-repository: mudman1986/devops-feed-hub\n"
        ),
        encoding="utf-8",
    )

    try:
        module.validate_release_metadata(
            config_path=config_path,
            starter_workflow_path=starter_workflow_path,
            starter_readme_path=starter_readme_path,
        )
    except ValueError as error:
        assert "must set engine-ref" in str(error)
    else:
        raise AssertionError("Expected missing engine ref failure")


def test_validate_release_metadata_rejects_readme_mismatch(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
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
        )
    except ValueError as error:
        assert "must all match v1.0.0" in str(error)
    else:
        raise AssertionError("Expected starter README mismatch")


def test_validate_release_metadata_rejects_missing_readme_reference(tmp_path):
    (
        config_path,
        starter_workflow_path,
        starter_readme_path,
    ) = _write_release_files(tmp_path)
    starter_readme_path.write_text("No release reference here\n", encoding="utf-8")

    try:
        module.validate_release_metadata(
            config_path=config_path,
            starter_workflow_path=starter_workflow_path,
            starter_readme_path=starter_readme_path,
        )
    except ValueError as error:
        assert "must mention the reusable workflow release reference" in str(error)
    else:
        raise AssertionError("Expected missing README ref")
