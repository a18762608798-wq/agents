"""Shared utilities for skill-creator scripts."""

import re
from pathlib import Path

import yaml

_FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---", re.DOTALL)


def parse_skill_md(skill_path: Path) -> tuple[str, str, str]:
    """Parse SKILL.md, returning ``(name, description, full_content)``."""
    content = (skill_path / "SKILL.md").read_text(encoding="utf-8")

    m = _FRONTMATTER_RE.search(content)
    if not m:
        raise ValueError("SKILL.md is missing YAML frontmatter (--- ... ---)")

    frontmatter_text = m.group(1)
    try:
        fm = yaml.safe_load(frontmatter_text)
    except yaml.YAMLError as exc:
        raise ValueError(f"Invalid YAML in SKILL.md frontmatter: {exc}") from exc

    if not isinstance(fm, dict):
        raise ValueError("SKILL.md frontmatter must be a YAML mapping")

    name = str(fm.get("name", "")).strip()
    description = str(fm.get("description", "")).strip()

    return name, description, content
