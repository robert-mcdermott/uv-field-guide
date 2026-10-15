# uv Field Guide

A practical, team-oriented guide to Python development with [uv](https://docs.astral.sh/uv/) (and a little [Ruff](https://docs.astral.sh/ruff/)).
Written and tested against **uv 0.13.1** and **Ruff 0.17.0** (October 2026).

| Path | What it is |
|---|---|
| [`uv-guide.md`](uv-guide.md) | **The guide.** Single source of truth for all content; readable directly on GitHub. |
| [`docs/`](docs/) | **The website** (generated from `uv-guide.md`): menu, search, copy buttons, dark mode. GitHub Pages serves this folder. |
| [`plugins/uv/`](plugins/uv/skills/uv/SKILL.md) | **uv agent skill** for AI coding assistants, packaged as a Claude Code plugin (`SKILL.md` + `references/`). The build also zips it to `docs/downloads/uv-skill.zip`. |
| [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) | Makes this repo a Claude Code plugin marketplace so the skill installs with one command. |
| [`tools/`](tools/) | `build_site.py` and the HTML/CSS/JS templates that turn `uv-guide.md` into `docs/`. |
| [`LICENSE`](LICENSE) | Apache License 2.0 |

## Publish the website (GitHub Pages)

1. Push this repository to GitHub.
2. **Settings → Pages → Build and deployment**: Source *Deploy from a branch*, branch `main`, folder **`/docs`**. Save.
3. The site appears at `https://robert-mcdermott.github.io/uv-field-guide/` after a minute or two.

## Edit and rebuild

1. Edit `uv-guide.md` (or a template in `tools/templates/`).
2. Regenerate the site:

   ```bash
   uv run --no-project --with markdown tools/build_site.py
   ```

3. Commit both `uv-guide.md` and `docs/`. (The build also regenerates `docs/downloads/uv-skill.zip` from `plugins/uv/skills/uv/`.)

Never edit `docs/index.html` by hand; it is overwritten on every build.

## Preview locally

```bash
uv run --no-project python -m http.server 8000 --directory docs   # open http://localhost:8000
```

Opening `docs/index.html` directly from disk also works.

## Install the uv agent skill

In a Claude Code session (Claude Code 2.1.275 or later):

```text
/plugin install uv --marketplace robert-mcdermott/uv-field-guide
```

Or from your shell, with any recent Claude Code:

```bash
claude plugin marketplace add robert-mcdermott/uv-field-guide
claude plugin install uv@uv-field-guide
```

For other agents, or to install by hand, download
[`uv-skill.zip`](https://robert-mcdermott.github.io/uv-field-guide/downloads/uv-skill.zip) and unzip it into your
skills directory (`~/.claude/skills/` for Claude Code). Full instructions are in section 24 of the guide.

When you change the skill, bump `version` in `plugins/uv/.claude-plugin/plugin.json` so installed copies pick up the update.

## License

Copyright 2026 Robert McDermott

Licensed under the [Apache License, Version 2.0](LICENSE). uv and Ruff are projects of [Astral](https://astral.sh); this is an independent community guide.
