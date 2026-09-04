---
name: reaction-mode
description: 反应模式工作台总入口。用户带着具体困扰、情绪、训练问题、关系互动或不确定从哪里开始时使用；先做安全与场景判断，再在同一轮完成一个最合适的主要动作。
---

# 反应模式工作台

先读取 `references/core/runtime-contract.md`、`references/core/router.yaml`、`references/core/safety-boundary.md` 和 `references/core/output-self-check.md`。

按路由优先级处理。默认直接完成选中路线，不要求用户再次调用其他 Skill。只有环境支持并且用户明确偏好时，才提示可直接使用叶子 Skill。

## 读取规则

- 实用支持和情感支持：仅依赖核心规则；不要自动进入模式分析。
- 急性峰值或身体稳定：读取 `references/skills/reaction-first-aid.md` 并执行其边界。
- 明确模式探索、训练、建设、日志或体系说明：读取对应 `references/skills/` 的叶子入口，再按其局部资料工作。
- 关系安全信号：读取 `references/knowledge/特殊关系结构识别_操控暴力创伤场景_PLACEHOLDER.md`；只执行占位文档明确允许的最小规则。

输出前完成核心自检。不要展示内部路由名称，除非用户要求。
