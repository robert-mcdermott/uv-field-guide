# Agent skills

| Skill | What it does |
|---|---|
| [`uv/`](uv/SKILL.md) | Teaches AI coding agents to use uv correctly: orientation steps, decision rules (project vs script vs pip vs tool), current defaults that override older training data, and safe-by-default rules. Reference files cover every command, pip interop, publishing, workspaces/CI/Docker, configuration and Ruff. |

## Install

The skill is a folder with a `SKILL.md` (YAML front matter + instructions) and a `references/` directory, following the common agent-skill layout.

- **Claude Code (all your projects):** copy `uv/` to `~/.claude/skills/uv/`
- **Claude Code (one repository):** copy `uv/` to `<repo>/.claude/skills/uv/` and commit it
- **Other agents:** point the agent at `skills/uv/SKILL.md` (for example from `AGENTS.md`), or paste it into the agent's instructions

```bash
mkdir -p ~/.claude/skills && cp -r skills/uv ~/.claude/skills/
```

The skill is generated from the same verified content as [`uv-guide.md`](../uv-guide.md). When the guide is updated for a new uv release, update `SKILL.md` and regenerate the `references/` files to match.
