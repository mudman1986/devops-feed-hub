"""Shared pytest configuration for Python tests."""

import os
import sys


def _rss_processing_dir() -> str:
    """Return the absolute path to the RSS processing scripts."""
    return os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "scripts",
        "workflows",
        "rss-processing",
    )


sys.path.insert(0, os.path.abspath(_rss_processing_dir()))
