"""Shared pytest configuration for Python tests."""

import sys
from pathlib import Path


def _rss_processing_dir() -> str:
    """Return the absolute path to the RSS processing scripts."""
    return str(
        Path(__file__).resolve().parents[2] / "scripts" / "workflows" / "rss-processing"
    )


sys.path.insert(0, _rss_processing_dir())
