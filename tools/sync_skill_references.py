#!/usr/bin/env python3
"""Generate self-contained Skill references from the toolbox truth layers."""

from __future__ import annotations

import argparse
import filecmp
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CORE_FILES = [
    "runtime-contract.md",
    "router.yaml",
    "safety-boundary.md",
    "output-self-check.md",
    "knowledge-registry.yaml",
]
DEPENDENCIES = {
    "reaction-mode": [
        "knowledge/特殊关系结构识别_操控暴力创伤场景_PLACEHOLDER.md",
    ],
    "reaction-first-aid": [
        "knowledge/工具A_反弹模式实时介入流程_v0.2.md",
        "knowledge/工具B_冥想路由器_v0.2.md",
        "knowledge/runbooks/acute_trigger.md",
        "knowledge/runbooks/body_regulation.md",
        "knowledge/runbooks/transfer_out.md",
    ],
    "reaction-pattern": [
        "knowledge/内在转化理论框架v2.5.md",
        "knowledge/话术库_点破与引导参考_v1.1.md",
        "knowledge/对话示例集_含失败案例诊断_v1.2.md",
        "knowledge/特殊关系结构识别_操控暴力创伤场景_PLACEHOLDER.md",
        "knowledge/runbooks/inner_pattern_work.md",
    ],
    "reaction-training": [
        "knowledge/v3.0使用指南_v0.2.md",
        "knowledge/工具C_反应日志_v0.2.md",
        "knowledge/模块一_识别力训练_v0.1.md",
        "knowledge/模块二_穿透力训练_v0.3.md",
        "knowledge/模块三_选择力训练_v0.1.md",
        "knowledge/诊断路径_v0.3.md",
        "knowledge/v3.0 元规则 · 悖论、完成感、觉察 vs 建设_v0.2.1.md",
        "knowledge/runbooks/training_guidance.md",
        "knowledge/runbooks/training_diagnosis.md",
    ],
    "reaction-construction": [
        "knowledge/模块二_穿透力训练_v0.3.md",
        "knowledge/模块四_建设力训练_v0.1.2.md",
        "knowledge/v3.0 元规则 · 悖论、完成感、觉察 vs 建设_v0.2.1.md",
        "knowledge/话术库_点破与引导参考_v1.1.md",
        "knowledge/runbooks/construction_work.md",
    ],
    "reaction-journal": [
        "knowledge/工具C_反应日志_v0.2.md",
        "knowledge/模块一_识别力训练_v0.1.md",
        "knowledge/v3.0 元规则 · 悖论、完成感、觉察 vs 建设_v0.2.1.md",
        "knowledge/runbooks/reaction_journal.md",
        "knowledge/runbooks/monthly_review.md",
    ],
    "reaction-framework": [
        "knowledge/v3.0主文档_v0.2.md",
        "knowledge/v3.0使用指南_v0.2.md",
        "knowledge/内在转化理论框架v2.5.md",
        "knowledge/诊断路径_v0.3.md",
        "knowledge/v3.0 元规则 · 悖论、完成感、觉察 vs 建设_v0.2.1.md",
    ],
}


def copy_file(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def expected_files(skill: str) -> list[tuple[Path, Path]]:
    pairs = []
    skill_root = ROOT / "skills" / skill
    for name in CORE_FILES:
        source = ROOT / "core" / name
        pairs.append((source, skill_root / "references" / "core" / name))
    for relative in DEPENDENCIES[skill]:
        source = ROOT / relative
        pairs.append((source, skill_root / "references" / relative))
    if skill == "reaction-mode":
        for leaf in sorted(name for name in DEPENDENCIES if name != "reaction-mode"):
            source = ROOT / "skills" / leaf / "SKILL.md"
            pairs.append((source, skill_root / "references" / "skills" / f"{leaf}.md"))
    return pairs


def sync() -> None:
    for skill in DEPENDENCIES:
        refs = ROOT / "skills" / skill / "references"
        if refs.exists():
            shutil.rmtree(refs)
        for source, target in expected_files(skill):
            if not source.is_file():
                raise FileNotFoundError(source)
            copy_file(source, target)
        print(f"synced {skill}")


def check() -> int:
    failures = []
    for skill in DEPENDENCIES:
        for source, target in expected_files(skill):
            if not target.is_file():
                failures.append(f"missing {target.relative_to(ROOT)}")
            elif not filecmp.cmp(source, target, shallow=False):
                failures.append(f"outdated {target.relative_to(ROOT)}")
    if failures:
        print("reference check failed:")
        print("\n".join(failures))
        return 1
    print("all generated Skill references are current")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    raise SystemExit(check() if args.check else (sync() or 0))
