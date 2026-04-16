"""Shared pytest configuration for Python tests."""

import sys
from pathlib import Path


def _rss_processing_dir() -> str:
    """Return the absolute path to the RSS processing scripts."""
    for parent in Path(__file__).resolve().parents:
        if (parent / "pyproject.toml").is_file():
            return str(parent / "scripts" / "workflows" / "rss-processing")
    raise FileNotFoundError("Could not determine repository root for Python tests")


sys.path.insert(0, _rss_processing_dir())
