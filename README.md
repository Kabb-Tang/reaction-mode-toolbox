# 反应模式工作台工具箱

这是 v3.0 反应模式工作台的平台无关工具箱。它把原有的运行规则、知识文档和场景流程拆为一个总入口与六个可独立使用的能力包。

## 安装

在支持 Agent Skills 的环境中，从 GitHub 安装全部能力包：

```bash
npx -y skills add Kabb-Tang/reaction-mode-toolbox -g --all
```

安装后，优先直接描述你的处境或需求；`reaction-mode` 是默认总入口，会先判断安全与场景。对模式、训练、关系困扰等探索性请求，它会像一次咨询式会谈那样逐层询问、反映和推进，而不是依据第一句话给完整答案。也可以在支持原生多 Skill 的环境中直接选用任一叶子 Skill。

Gemini Spark 不以多 Skill 发现为入口：从本仓库构建后，上传 `dist/gemini-spark/reaction-mode-toolbox/` 整个文件夹即可获得单主入口、内部模块递进的体验。

## 边界

本工具箱用于反应觉察、短时稳定、训练与复盘，不替代紧急救援、医疗或心理治疗。出现即时危险、伤害自己或他人的风险、急性创伤/解离，或关系中的操控、暴力与胁迫风险时，先按安全边界寻求当地紧急服务、可信支持或合格专业人员帮助。

《特殊关系结构识别·操控/暴力/创伤场景》目前仍是明确占位内容；工具箱只提供最低限度的识别、停止有害归因和转介规则，不能把它当作完整的风险评估或安全计划。

## 使用方式

优先把用户的自然语言请求交给 `reaction-mode`。它在同一轮只选择一个主要路线；探索性请求会跨多轮逐步推进，不要求平台支持斜杠命令、子 Skill 调用、脚本或本地文件系统。

支持原生 Skill 的环境，也可以直接调用以下叶子 Skill：

- `reaction-first-aid`：急性触发后的短时稳定与身体状态路由。
- `reaction-pattern`：用户明确要求探索反应模式时的对话工作。
- `reaction-training`：模块一至三的训练起步与卡点诊断。
- `reaction-construction`：模块四建设力及其前提核对。
- `reaction-journal`：反应日志和月度回看。
- `reaction-framework`：体系、理论与使用方式说明。

## 目录职责

- `core/`：所有运行都必须遵守的行为契约、路由和安全边界。
- `knowledge/`：当前内容真源；运行知识、runbook 和设计历史分开保存。
- `skills/`：可安装的 Skill 真源。每个包的 `references/` 均由同步工具生成。
- `adapters/`：不改变业务逻辑的通用发行入口。
- `templates/`：可复制给用户的状态模板。
- `evals/`：路由、安全与回归案例。
- `tools/`：引用同步、结构校验和发行构建工具。
- `dist/`：可随时再生成的发行结果，不作为内容真源。

## 面向维护者的发布

原生多 Skill 的发布真源是 `skills/`；`.claude-plugin/` 提供 Claude Code 工具箱入口。发布前先同步引用、校验结构并重建发行包：

```bash
python3 tools/sync_skill_references.py
python3 tools/validate_toolbox.py
python3 tools/build_portable_bundle.py
```

随后在隔离环境实际执行 README 中的安装命令，确认七个 Skill 均被安装；不要仅凭 README 中有命令就视为可发布。

## 维护顺序

1. 修改 `core/` 或 `knowledge/`。
2. 运行 `python3 tools/sync_skill_references.py`。
3. 运行 `python3 tools/validate_toolbox.py`。
4. 运行 `python3 tools/build_portable_bundle.py` 生成发行目录。

原根目录文档与 `agent/` 仍保留为迁移基线。新修改应进入本工具箱结构；在完整回归通过前，不删除 legacy 内容。
