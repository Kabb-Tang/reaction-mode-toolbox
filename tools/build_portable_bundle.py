#!/usr/bin/env python3
"""Build self-contained Skill folders and a generic knowledge-upload bundle."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"


def replace_directory(path: Path, source: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    shutil.copytree(source, path, ignore=shutil.ignore_patterns("__pycache__", ".DS_Store"))


def main() -> int:
    subprocess.run([sys.executable, str(ROOT / "tools" / "sync_skill_references.py")], check=True)
    skills_target = DIST / "skills"
    generic_target = DIST / "generic-knowledge-bundle"
    if skills_target.exists():
        shutil.rmtree(skills_target)
    skills_target.mkdir(parents=True)
    for skill in sorted((ROOT / "skills").iterdir()):
        if skill.is_dir() and (skill / "SKILL.md").is_file():
            shutil.copytree(skill, skills_target / skill.name)
    replace_directory(generic_target / "core", ROOT / "core")
    if (generic_target / "knowledge").exists():
        shutil.rmtree(generic_target / "knowledge")
    shutil.copytree(
        ROOT / "knowledge",
        generic_target / "knowledge",
        ignore=shutil.ignore_patterns("design-history", "__pycache__", ".DS_Store"),
    )
    replace_directory(generic_target / "templates", ROOT / "templates")
    shutil.copy2(ROOT / "adapters" / "generic-system-prompt" / "SYSTEM_PROMPT.md", generic_target / "START_HERE.md")

    spark_target = DIST / "gemini-spark" / "reaction-mode-toolbox"
    if spark_target.exists():
        shutil.rmtree(spark_target)
    spark_target.mkdir(parents=True)
    shutil.copy2(
        ROOT / "adapters" / "gemini-spark" / "spark-entry.template.md",
        spark_target / "SKILL.md",
    )
    shutil.copytree(ROOT / "adapters" / "gemini-spark" / "modules", spark_target / "modules")
    (spark_target / "core").mkdir()
    for source in (ROOT / "core").glob("*.md"):
        shutil.copy2(source, spark_target / "core" / source.name)
    shutil.copytree(
        ROOT / "knowledge",
        spark_target / "knowledge",
        ignore=shutil.ignore_patterns("design-history", "__pycache__", ".DS_Store", "*.yaml"),
    )
    shutil.copytree(ROOT / "templates", spark_target / "templates")
    print(
        f"built {skills_target.relative_to(ROOT)}, {generic_target.relative_to(ROOT)} "
        f"and {spark_target.relative_to(ROOT)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
