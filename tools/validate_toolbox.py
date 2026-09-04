#!/usr/bin/env python3
"""Lightweight structural validation without external dependencies."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS = [
    "reaction-mode",
    "reaction-first-aid",
    "reaction-pattern",
    "reaction-training",
    "reaction-construction",
    "reaction-journal",
    "reaction-framework",
]
REQUIRED = ["README.md", "SOURCE_OF_TRUTH.md", "AGENTS.md", "VERSION", "toolbox.yaml"]
VENDOR_TERMS = re.compile(r"\b(?:claude|codex|chatgpt|openai|anthropic|grok)\b", re.IGNORECASE)


def read_name(path: Path) -> str | None:
    text = path.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\nname:\s*([^\n]+)\n", text)
    return match.group(1).strip() if match else None


def main() -> int:
    errors = []
    for relative in REQUIRED:
        if not (ROOT / relative).is_file():
            errors.append(f"missing required file: {relative}")
    for skill in SKILLS:
        path = ROOT / "skills" / skill / "SKILL.md"
        if not path.is_file():
            errors.append(f"missing {path.relative_to(ROOT)}")
            continue
        if read_name(path) != skill:
            errors.append(f"frontmatter name mismatch: {path.relative_to(ROOT)}")
    spark_entry = ROOT / "adapters" / "gemini-spark" / "SKILL.md"
    if not spark_entry.is_file() or read_name(spark_entry) != "reaction-mode-toolbox":
        errors.append("missing or invalid single-entry Spark adapter")
    for module in ("router", "first-aid", "pattern", "training", "construction", "journal", "framework"):
        if not (ROOT / "adapters" / "gemini-spark" / "modules" / f"{module}.md").is_file():
            errors.append(f"missing Spark module: {module}.md")
    for folder in (ROOT / "core", ROOT / "skills", ROOT / "adapters" / "generic-system-prompt"):
        for path in folder.rglob("*"):
            if path.is_file() and "references" not in path.parts:
                matches = VENDOR_TERMS.findall(path.read_text(encoding="utf-8"))
                if matches:
                    errors.append(f"platform-bound term in portable source: {path.relative_to(ROOT)}")
    sync_check = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "sync_skill_references.py"), "--check"],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if sync_check.returncode:
        errors.append(sync_check.stdout.strip() or "generated references are not current")
    if errors:
        print("toolbox validation failed:")
        print("\n".join(f"- {item}" for item in errors))
        return 1
    print("toolbox structure and portable-source checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
