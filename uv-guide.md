# The uv Field Guide

**A practical, team-oriented guide to Python development with uv (and a little Ruff)**

> Written for **uv 0.13.1** and **Ruff 0.17.0** (October 2026). Every command in this guide was run against those versions. uv moves quickly, so if something looks different on your machine, run `uv self version` and check the [uv changelog](https://github.com/astral-sh/uv/blob/main/CHANGELOG.md).

---

## Table of contents

1. [What uv is and what it replaces](#1-what-uv-is-and-what-it-replaces)
2. [Installing, updating and removing uv](#2-installing-updating-and-removing-uv)
3. [The mental model: five ways to use uv](#3-the-mental-model-five-ways-to-use-uv)
4. [Managing Python versions](#4-managing-python-versions)
5. [Creating projects](#5-creating-projects)
6. [Managing dependencies with `uv add` and `uv remove`](#6-managing-dependencies-with-uv-add-and-uv-remove)
7. [Locking, syncing, running and inspecting](#7-locking-syncing-running-and-inspecting)
8. [Single-file scripts with inline dependencies](#8-single-file-scripts-with-inline-dependencies)
9. [Tools: `uvx` and `uv tool`](#9-tools-uvx-and-uv-tool)
10. [The pip-compatible interface: `uv venv` and `uv pip`](#10-the-pip-compatible-interface-uv-venv-and-uv-pip)
11. [Working with vanilla pip users: requirements.txt in both directions](#11-working-with-vanilla-pip-users-requirementstxt-in-both-directions)
12. [Building and publishing packages to PyPI](#12-building-and-publishing-packages-to-pypi)
13. [Workspaces (monorepos)](#13-workspaces-monorepos)
14. [Code quality: Ruff, `uv format`, `uv check` and `uv audit`](#14-code-quality-ruff-uv-format-uv-check-and-uv-audit)
15. [Configuration and environment variables](#15-configuration-and-environment-variables)
16. [Package indexes and authentication](#16-package-indexes-and-authentication)
17. [The cache](#17-the-cache)
18. [CI/CD, Docker and pre-commit](#18-cicd-docker-and-pre-commit)
19. [Recommended team conventions](#19-recommended-team-conventions)
20. [Migration cheat sheet (pip, pip-tools, pipx, pyenv, Poetry, Conda)](#20-migration-cheat-sheet)
21. [Gotchas and troubleshooting](#21-gotchas-and-troubleshooting)
22. [Complete command reference](#22-complete-command-reference)
23. [What changed recently (0.10 → 0.13)](#23-what-changed-recently-010--013)

---

## 1. What uv is and what it replaces

uv is a single, fast binary (written in Rust by [Astral](https://astral.sh), the team behind Ruff) that manages **Python installations, virtual environments, dependencies, lockfiles, scripts, command-line tools, builds and publishing**. It does not need Python to be installed first; it will download Python for you.

| You used to reach for… | With uv you use… |
|---|---|
| `pyenv`, python.org installers | `uv python install`, `uv python pin` |
| `python -m venv`, `virtualenv` | `uv venv` (or nothing: projects create `.venv` automatically) |
| `pip install`, `pip freeze`, `pipdeptree` | `uv add`, `uv pip install`, `uv pip freeze`, `uv tree` |
| `pip-tools` (`pip-compile`, `pip-sync`) | `uv lock`, `uv sync`, `uv pip compile`, `uv pip sync` |
| `pipx` | `uvx`, `uv tool install` |
| Poetry / PDM / Pipenv | `uv init`, `uv add`, `uv lock`, `uv sync`, `uv run` |
| `build`, `twine` | `uv build`, `uv publish` |
| `black` / formatter wiring | `uv format` (runs Ruff) |

Why teams adopt it:

- **Speed.** Resolution and installs are typically 10–100× faster than pip thanks to a global cache, parallel downloads and hard-linking/copy-on-write installs.
- **One universal lockfile.** `uv.lock` captures exact versions for *every* platform and Python version at once, so macOS, Windows and Linux developers (and CI) all get the same dependency set.
- **Standards-based.** Projects use the standard `pyproject.toml` (PEP 621), dependency groups (PEP 735), inline script metadata (PEP 723), and can export `pylock.toml` (PEP 751) and `requirements.txt`. Nothing locks you in.
- **No more "activate the venv" dance.** `uv run <cmd>` always runs inside an up-to-date project environment.

---

## 2. Installing, updating and removing uv

### Install

**macOS and Linux (recommended standalone installer):**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# no curl?
wget -qO- https://astral.sh/uv/install.sh | sh
# pin a specific version
curl -LsSf https://astral.sh/uv/0.13.1/install.sh | sh
```

**Windows (PowerShell):**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Package managers:**

```bash
brew install uv                    # Homebrew (macOS/Linux)
winget install --id=astral-sh.uv -e  # WinGet
scoop install main/uv              # Scoop
sudo port install uv               # MacPorts
pipx install uv                    # from PyPI, isolated
pip install uv                     # from PyPI, into the current environment
cargo install --locked uv          # build from source
```

The standalone installer puts `uv` and `uvx` in `~/.local/bin` (Windows: `%USERPROFILE%\.local\bin`) and adds it to your `PATH`. Set `UV_NO_MODIFY_PATH=1` if you don't want it to edit your shell profile.

Verify:

```console
$ uv --version
uv 0.13.1 (aarch64-apple-darwin)
```

### Update

If you used the standalone installer, uv updates itself:

```console
$ uv self update
info: Checking for updates...
success: Upgraded uv from v0.12.10 to v0.13.1! https://github.com/astral-sh/uv/releases/tag/0.13.1

$ uv self update --dry-run     # check without installing
$ uv self update 0.13.0        # move to a specific version (up or down)
$ uv self version --short      # just the version number
```

If you installed with Homebrew, pip, WinGet, etc., `uv self update` is disabled; use that tool's upgrade command instead (`brew upgrade uv`, `pip install -U uv`, …).

> **Tip:** if `uv self update` hits GitHub rate limits in CI, pass `--token` or set `UV_GITHUB_TOKEN`.

### Shell completion

```bash
# bash
echo 'eval "$(uv generate-shell-completion bash)"' >> ~/.bashrc
echo 'eval "$(uvx --generate-shell-completion bash)"' >> ~/.bashrc
# zsh
echo 'eval "$(uv generate-shell-completion zsh)"' >> ~/.zshrc
echo 'eval "$(uvx --generate-shell-completion zsh)"' >> ~/.zshrc
# fish
echo 'uv generate-shell-completion fish | source' > ~/.config/fish/completions/uv.fish
```

PowerShell: `Add-Content -Path $PROFILE -Value '(& uv generate-shell-completion powershell) | Out-String | Invoke-Expression'`

### Uninstall

```bash
uv cache clean
rm -r "$(uv python dir)"   # uv-managed Pythons
rm -r "$(uv tool dir)"     # installed tools
rm ~/.local/bin/uv ~/.local/bin/uvx
```

### Getting help

```bash
uv --help            # concise help
uv help              # long-form help
uv help add          # long-form help for a subcommand (opens a pager)
uv add --help        # concise help for a subcommand
```

---

## 3. The mental model: five ways to use uv

uv has several interfaces that can be used independently or together. Knowing which one you're in removes most confusion.

| Interface | Commands | Use it when… | State lives in |
|---|---|---|---|
| **Python versions** | `uv python …` | You need a particular interpreter | `~/.local/share/uv/python` |
| **Projects** | `uv init/add/remove/lock/sync/run/tree/version/build/publish/export` | You're building an app or library that others will run or install | `pyproject.toml`, `uv.lock`, `.venv/` |
| **Scripts** | `uv run script.py`, `uv add --script`, `uv init --script` | A single `.py` file needs a few dependencies | Inline `# /// script` block |
| **Tools** | `uvx`, `uv tool …` | You want to run a CLI (ruff, httpie, black, cookiecutter) | `~/.local/share/uv/tools` or cache |
| **pip interface** | `uv venv`, `uv pip …` | Legacy workflows, requirements.txt, fine-grained manual control | Whatever venv you point it at |

The files that matter in a uv project:

| File | Purpose | Commit it? |
|---|---|---|
| `pyproject.toml` | Your **intent**: metadata, dependency ranges, tool config | Yes |
| `uv.lock` | The **exact** resolved versions for all platforms | **Yes** (for apps and libraries) |
| `.python-version` | Default Python version for the project | Yes |
| `.venv/` | The project's virtual environment (disposable) | **No** (uv adds a `.gitignore` inside it) |
| `requirements.txt` | Optional export for pip users / legacy tooling | Only if someone needs it |

**The golden rule:** in a project, change dependencies with `uv add` / `uv remove` (or by editing `pyproject.toml`), and run things with `uv run`. Avoid `uv pip install` into a project's `.venv`; the next `uv sync` will remove anything that isn't in the lockfile.

---

## 4. Managing Python versions

uv distinguishes **managed** Pythons (ones uv downloaded, from the `python-build-standalone` project) from **system** Pythons (Homebrew, pyenv, OS, python.org). It will happily use either. If nothing suitable is found, it downloads one automatically.

> **Default Python is now 3.15.** As of uv 0.13.0, when no version is requested or pinned, uv downloads Python 3.15. Existing installed Pythons that satisfy a request are still preferred.

### Install, list, find

```console
$ uv python install                 # latest stable (3.15 today), or whatever .python-version asks for
$ uv python install 3.12            # latest 3.12.x
$ uv python install 3.11 3.12 3.13  # several at once
$ uv python install 3.12.3          # an exact patch
$ uv python install '>=3.10,<3.12'  # a range
$ uv python install pypy@3.11       # alternative implementations: pypy, graalpy, pyodide
$ uv python install 3.14t           # free-threaded build
$ uv python install 3.13 --default  # also install `python` and `python3` shims (experimental)

$ uv python list                    # installed + available downloads for this platform
$ uv python list --only-installed
$ uv python list 3.13               # filter
$ uv python list --all-versions     # include old patch releases
$ uv python list --output-format json

$ uv python find 3.13               # path of the interpreter uv would use
/Users/you/.local/share/uv/python/cpython-3.13-macos-aarch64-none/bin/python3.13
$ uv python find --system           # ignore virtual environments
```

Installing puts a versioned executable (`python3.13`) in `~/.local/bin`. If that directory isn't on your `PATH`, run `uv python update-shell`.

### Upgrade and uninstall

```console
$ uv python upgrade 3.13     # move to the newest 3.13.x patch
$ uv python upgrade          # upgrade every managed version
$ uv python install --reinstall   # rebuild installs (picks up distribution fixes)
$ uv python uninstall 3.11
$ uv python dir              # where managed Pythons live
```

Virtual environments that use a managed minor version (for example 3.13) are **automatically moved to the new patch** when you upgrade, because uv points them at a `cpython-3.13-…` directory link. Environments created with an explicit patch (`-p 3.13.2`) are left alone.

### Pinning

```console
$ uv python pin 3.13             # writes .python-version in the current directory
Pinned `.python-version` to `3.13`
$ uv python pin                  # show the current pin
$ uv python pin --global 3.13    # user-wide default (~/.config/uv/.python-version)
$ uv python pin --global --rm    # remove the global pin
$ uv python pin --resolved 3.13  # write the full interpreter path instead of the request
```

How uv picks a Python for a project (highest priority first):

1. `--python` / `-p` flag or `UV_PYTHON`
2. `.python-version` in the current directory or a parent (within the project)
3. The global pin in the user config directory
4. The first installed interpreter compatible with `requires-python` (managed first by default)
5. Download one, if downloads are allowed

### Request formats

Anything that takes `--python` accepts: `3`, `3.12`, `3.12.3`, `>=3.12,<3.13`, `3.13t` (free-threaded), `3.14+gil`, `cpython@3.12`, `cp312`, `pypy@3.10`, `cpython-3.12.3-macos-aarch64-none`, a path such as `/opt/homebrew/bin/python3`, or an executable name.

### Controlling managed vs system Python

| Want | Flag | Setting (`uv.toml` / `[tool.uv]`) |
|---|---|---|
| Only uv-managed Pythons | `--managed-python` | `python-preference = "only-managed"` |
| Only system Pythons | `--no-managed-python` | `python-preference = "only-system"` |
| Prefer system, fall back to managed | — | `python-preference = "system"` |
| Never auto-download | `--no-python-downloads` | `python-downloads = "manual"` (or `"never"`) |

### One-off interpreters

```console
$ uvx python@3.14 -c "import sys; print(sys.version)"
3.14.8 (main, Oct 14 2026, 01:04:34) [Clang 23.1.3 ]
$ uv run --python 3.12 --no-project python -c "import platform; print(platform.python_version())"
3.12.15
```

---

## 5. Creating projects

`uv init` creates a project. Since uv 0.12, **every `uv init` project is a packaged project by default**: it has a `[build-system]` using uv's own `uv_build` backend, a `src/` layout, and (for apps) a console-script entry point. This is the best-practice layout; it means your code is importable from tests and installable as a command.

### The project types at a glance

| Command | What you get | Build system? | Typical use |
|---|---|---|---|
| `uv init my-app` (same as `--app`) | `src/my_app/__init__.py` with `main()`, `[project.scripts] my-app = "my_app:main"` | Yes (`uv_build`) | CLIs, services, most new work |
| `uv init --lib my-lib` | `src/my_lib/__init__.py` + `py.typed` | Yes | Libraries you'll publish or share |
| `uv init --no-package my-app` | Flat `main.py`, no build system; the project itself isn't installed | No | Notebooks, glue scripts, simple apps |
| `uv init --bare my-thing` | Only `pyproject.toml` (no README, no `.python-version`, no git) | No | Adding uv to an existing repo |
| `uv init --script tool.py` | A single file with an inline `# /// script` block | — | One-file utilities |
| `uv init --build-backend maturin my-ext` | Rust extension module scaffold (`Cargo.toml`, `lib.rs`) | Yes | Rust or C/C++ extensions (`scikit-build-core` for C/C++) |

> **Heads up if you learned uv before 0.12:** `uv init` used to create a flat `main.py` application with no build system. That layout now requires `--no-package`.

### A real example

```console
$ uv init weather-cli --python 3.13
Initialized project `weather-cli` at `/Users/you/dev/weather-cli`

$ cd weather-cli && find . -not -path "./.git*" | sort
.
./.python-version
./README.md
./pyproject.toml
./src
./src/weather_cli
./src/weather_cli/__init__.py

$ cat pyproject.toml
[project]
name = "weather-cli"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
authors = [
    { name = "Robert McDermott", email = "robert@example.com" }
]
requires-python = ">=3.13"
dependencies = []

[project.scripts]
weather-cli = "weather_cli:main"

[build-system]
requires = ["uv_build>=0.13.1,<0.14.0"]
build-backend = "uv_build"

$ uv run weather-cli
Using CPython 3.13.16
Creating virtual environment at: .venv
   Building weather-cli @ file:///Users/you/dev/weather-cli
      Built weather-cli @ file:///Users/you/dev/weather-cli
Installed 1 package in 1ms
Hello from weather-cli!
```

The first `uv run` created `.venv`, wrote `uv.lock`, built the project and installed it in **editable** mode, so changes to `src/` are picked up immediately without reinstalling.

### Useful `uv init` options

```bash
uv init my-app --python 3.12                  # set requires-python and .python-version
uv init my-app --description "Robert's cool app"
uv init my-app --author-from git              # auto | git | none
uv init my-app --vcs none                     # skip `git init`
uv init my-app --no-readme --no-pin-python
uv init my-app --name custom-name             # project name differs from directory
uv init --lib my-lib --build-backend hatch    # uv | hatch | flit | pdm | poetry | setuptools | maturin | scikit
uv init .                                     # initialize the current directory
uv init packages/core --no-workspace          # don't auto-join a parent workspace
```

Running `uv init` **inside** an existing project adds the new project as a [workspace member](#13-workspaces-monorepos) automatically. Use `--no-workspace` to prevent that.

### Anatomy of `pyproject.toml` in a uv project

```toml
[project]                       # standard PEP 621 metadata: other tools read this
name = "weather-cli"
version = "0.2.0"
requires-python = ">=3.13"
dependencies = [                # runtime dependencies (published with your package)
    "httpx>=0.28.1",
    "rich>=15.0.0",
]

[project.optional-dependencies] # "extras": pip install weather-cli[plot]
plot = ["matplotlib>=3.10"]

[project.scripts]               # console commands created on install
weather-cli = "weather_cli:main"

[dependency-groups]             # PEP 735: local-only groups (never published)
dev = ["pytest>=9.1.1", "ruff>=0.17.0"]
docs = ["mkdocs-material"]

[build-system]
requires = ["uv_build>=0.13.1,<0.14.0"]
build-backend = "uv_build"

[tool.uv]                       # uv-specific settings
default-groups = ["dev"]

[tool.uv.sources]               # where to get a dependency during development
# mylib = { path = "../mylib", editable = true }

[tool.ruff]                     # Ruff config can live here too
line-length = 100
```

---

## 6. Managing dependencies with `uv add` and `uv remove`

`uv add` does three things in one step: edits `pyproject.toml`, re-resolves `uv.lock`, and syncs `.venv`.

```console
$ uv add httpx rich
Resolved 12 packages in 231ms
Installed 12 packages in 11ms
 + anyio==4.15.1
 + certifi==2026.7.22
 + h11==0.16.0
 + httpcore==1.0.9
 + httpx==0.28.1
 + idna==3.20
 + markdown-it-py==4.2.0
 + mdurl==0.1.2
 + pygments==2.21.0
 + rich==15.0.0
 + typing-extensions==4.16.0
 ~ weather-cli==0.1.0 (from file:///Users/you/dev/weather-cli)
```

uv records a lower bound of the version it picked (`"httpx>=0.28.1"`). The exact version lives in `uv.lock`.

### Version constraints and bounds

```bash
uv add "requests==2.32.3"          # exact
uv add "requests>=2.31,<3"         # range
uv add "django~=5.2"               # compatible release (>=5.2,<6)
uv add requests --bounds major     # writes requests>=2.34.2,<3.0.0
uv add requests --bounds minor     # >=2.34.2,<2.35.0
uv add requests --bounds exact     # ==2.34.2
uv add "fastapi[standard]"         # with extras
uv add fastapi --extra standard    # same thing
```

Set a team-wide default with `add-bounds = "major"` under `[tool.uv]`.

### Dependency kinds

| Kind | Command | Lands in | Published? | Installed by default? |
|---|---|---|---|---|
| Runtime | `uv add httpx` | `[project] dependencies` | Yes | Yes |
| Optional ("extra") | `uv add --optional plot matplotlib` | `[project.optional-dependencies] plot` | Yes | No: `--extra plot` / `--all-extras` |
| Development | `uv add --dev pytest` | `[dependency-groups] dev` | No | **Yes** (`dev` is a default group) |
| Other group | `uv add --group lint ruff` | `[dependency-groups] lint` | No | No: `--group lint` / `--all-groups` |

Groups can include each other:

```toml
[dependency-groups]
test = ["pytest", "pytest-cov"]
lint = ["ruff"]
dev  = [{ include-group = "test" }, { include-group = "lint" }]
```

Change which groups are installed by default:

```toml
[tool.uv]
default-groups = ["dev", "docs"]   # or "all"
```

### Platform and Python-version specific dependencies (markers)

```console
$ uv add "numpy; python_version >= '3.12'" "colorama; sys_platform == 'win32'"
$ grep -A3 dependencies pyproject.toml
dependencies = [
    "colorama>=0.4.6 ; sys_platform == 'win32'",
    "numpy>=2.5.4 ; python_full_version >= '3.12'",
]
```

Because the lockfile is universal, the Windows-only package is recorded once and installed only on Windows.

### Alternative sources (git, paths, URLs, indexes)

```bash
uv add git+https://github.com/psf/requests --tag v2.32.3
uv add git+https://github.com/encode/httpx --branch main
uv add git+https://github.com/encode/httpx --rev 326b9431c761e1ef1e00b9f760d1f654c8db48c6
uv add "git+https://github.com/langchain-ai/langchain#subdirectory=libs/langchain"
uv add git+ssh://git@github.com/org/private-repo
uv add ../my-shared-lib --editable              # local project, editable
uv add ./wheels/foo-1.0-py3-none-any.whl        # local wheel
uv add "https://example.com/pkg-1.0.tar.gz"     # remote archive
uv add torch --index pytorch=https://download.pytorch.org/whl/cpu
```

The standard `dependencies` list keeps just the name; the location goes in `[tool.uv.sources]`:

```toml
[tool.uv.sources]
requests = { git = "https://github.com/psf/requests", tag = "v2.32.3" }
my-shared-lib = { path = "../my-shared-lib", editable = true }
```

> `tool.uv.sources` is uv-only. Other tools, and people installing your published package, see only the plain `dependencies`. Before publishing, check that the package builds without sources: `uv build --no-sources`.

### Importing an existing requirements.txt

```bash
uv add -r requirements.txt                       # take the ranges from the file
uv add -r requirements.in -c requirements.txt    # keep the versions you already had pinned
uv add --dev -r requirements-dev.txt
```

### Removing and changing

```bash
uv remove httpx
uv remove --dev pytest
uv remove --group lint ruff
uv remove --optional plot matplotlib
uv add "httpx>=0.27" --upgrade-package httpx     # change the constraint and move the lock forward
```

### Self-dependencies

You can't add your own project as a runtime dependency (`uv add my-app` inside `my-app` errors with "self-dependencies are not permitted"). You can add it to a group or extra, which is useful for things like `my-app[all]`:

```toml
[project.optional-dependencies]
all = ["my-app[plot,network]"]
```

---

## 7. Locking, syncing, running and inspecting

### How it fits together

```
pyproject.toml ──(uv lock)──▶ uv.lock ──(uv sync)──▶ .venv ──(uv run)──▶ your command
   (intent)                  (exact pins)            (installed)
```

`uv run`, `uv sync`, `uv add` and friends **lock and sync automatically**, so in day-to-day work you rarely type `uv lock` or `uv sync` yourself.

### `uv lock`

```bash
uv lock                         # create/refresh uv.lock (only changes what must change)
uv lock --check                 # exit non-zero if uv.lock is stale (great in CI)
uv lock --upgrade               # move every package to the newest allowed version
uv lock --upgrade-package rich  # upgrade just one package
uv lock --upgrade-package "rich==14.0.0"
uv lock --dry-run               # show what would change
```

The lockfile never goes stale because a new version was released. You choose when to upgrade.

### `uv sync`

```bash
uv sync                       # install exactly what uv.lock says (+ default groups)
uv sync --locked              # fail if uv.lock needs updating (CI)
uv sync --frozen              # use uv.lock as-is, don't even check it
uv sync --no-dev              # production install
uv sync --group docs          # add a non-default group
uv sync --all-groups --all-extras
uv sync --only-group lint     # just that group, not the project
uv sync --extra plot
uv sync --inexact             # don't remove packages that aren't in the lock
uv sync --no-install-project  # deps only (Docker layer caching)
uv sync --no-editable         # install the project as a regular (non-editable) package
uv sync --check               # is the environment in sync? (non-zero if not)
uv sync --dry-run
```

> **Exact by default.** `uv sync` removes anything not selected. If you ran `uv add --group lint ruff` (which installs ruff) and then a plain `uv sync`, ruff gets uninstalled because `lint` isn't a default group. That's intended. Add the group to `default-groups` if everyone needs it.

### `uv run`

```bash
uv run weather-cli Seattle            # a project console script
uv run python                         # REPL inside the project env
uv run pytest -q                      # any command available in the env
uv run -m http.server 8000            # run a module
uv run script.py                      # a file (inline-metadata scripts get their own env)
uv run -- flask run -p 3000           # `--` separates uv flags from the command's flags
uv run --with ipython ipython         # add a temporary extra package for this run
uv run --with "httpx==0.27.0" python -c "import httpx; print(httpx.__version__)"
uv run --env-file .env python app.py  # load environment variables
uv run --python 3.12 pytest           # different interpreter for this run
uv run --package api api              # a specific workspace member
uv run --no-project script.py         # ignore the surrounding project
uv run --isolated pytest              # temporary env, don't touch .venv
uv run --no-sync pytest               # skip the lock/sync check (fast inner loop)
uv run --locked pytest                # fail if uv.lock is stale
```

Before every `uv run`, uv checks that `uv.lock` matches `pyproject.toml` and that `.venv` matches `uv.lock`, fixing either if needed. `uv run` syncs *inexactly* (adds what's missing, removes nothing). Use `uv run --exact` to also remove extras.

**Activating still works.** `.venv` is a normal virtual environment:

```bash
uv sync
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pytest
deactivate
```

By default, project commands ignore an already-activated *different* virtualenv (`VIRTUAL_ENV`) and warn you. Use `--active` to target it on purpose.

### `uv tree`

```console
$ uv tree --depth 2
Resolved 18 packages in 2ms
weather-cli v0.1.0
├── httpx v0.28.1
│   ├── anyio v4.15.1
│   ├── certifi v2026.7.22
│   ├── httpcore v1.0.9
│   └── idna v3.20
├── rich v15.0.0
│   ├── markdown-it-py v4.2.0
│   └── pygments v2.21.0
└── pytest v9.1.1 (group: dev)
    ├── iniconfig v2.3.1
    ├── packaging v26.3
    ├── pluggy v1.6.0
    └── pygments v2.21.0
```

```bash
uv tree --outdated          # show newer versions available
uv tree --invert --package idna   # who depends on idna?
uv tree --show-sizes        # wheel sizes
uv tree --universal         # platform-independent view
uv tree --no-dev --format json
```

### `uv version`

```console
$ uv version
weather-cli 0.1.0
$ uv version --short
0.1.0
$ uv version --bump minor
weather-cli 0.1.0 => 0.2.0
$ uv version --bump patch --bump beta --dry-run
weather-cli 0.2.0 => 0.2.1b1
$ uv version --bump stable          # 0.2.1b1 => 0.2.1
$ uv version 1.0.0                  # set explicitly
$ uv version --output-format json
```

`--bump` accepts `major`, `minor`, `patch`, `stable`, `alpha`, `beta`, `rc`, `post`, `dev`. `uv version` re-locks and syncs after a change; add `--frozen` to only edit `pyproject.toml`.

### Upgrading dependencies safely

```bash
uv tree --outdated --depth 1     # what's behind?
uv lock --upgrade-package rich   # targeted
uv run pytest                    # verify
git diff uv.lock                 # review
```

Want a supply-chain "cooldown" that ignores brand-new releases? Use `exclude-newer` with a duration:

```toml
[tool.uv]
exclude-newer = "7 days"     # also accepts ISO-8601 (P7D) or an RFC 3339 timestamp
```

---

## 8. Single-file scripts with inline dependencies

Python's [inline script metadata](https://packaging.python.org/en/latest/specifications/inline-script-metadata/) (PEP 723) lets a single `.py` file declare its own dependencies. uv creates (and caches) an isolated environment for it on the fly.

```console
$ uv init --script hello.py --python 3.13
Initialized script at `hello.py`

$ uv add --script pep_titles.py --python 3.13 httpx rich
Resolved 11 packages in 2ms

$ head -7 pep_titles.py
# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "httpx>=0.28.1",
#     "rich>=15.0.0",
# ]
# ///

$ uv run pep_titles.py
PEP 8: Style Guide for Python Code
PEP 20: The Zen of Python
PEP 517: A build-system independent format for source trees
PEP 723: Inline script metadata
```

Other script tricks:

```bash
uv run --with rich script.py              # ad-hoc dependency without editing the file
uv remove --script script.py rich
uv lock --script script.py                # writes script.py.lock for reproducibility
uv export --script script.py              # requirements.txt for a script
uv tree --script script.py
uv sync --script script.py                # shows/creates the cached env location
echo 'print("hi")' | uv run -             # read the script from stdin
uv run --python 3.12 script.py            # pick the interpreter
```

Pin a script in time for reproducibility:

```python
# /// script
# dependencies = ["requests"]
# [tool.uv]
# exclude-newer = "2026-10-01T00:00:00Z"
# ///
```

Make a script directly executable with a shebang:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["cowsay"]
# ///
import cowsay
cowsay.cow("Hello from a uv script!")
```

```console
$ chmod +x moo && ./moo
  _______________________
| Hello from a uv script! |
  =======================
                       \
                        \
                          ^__^
                          (oo)\_______
                          (__)\       )\/\
                              ||----w |
                              ||     ||
```

> Inside a project, a script **with** an inline block ignores the project's dependencies. A script **without** one runs in the project environment. Use `uv run --no-project script.py` to opt out explicitly (the flag must come before the script name).

---

## 9. Tools: `uvx` and `uv tool`

Tools are Python packages that provide command-line programs. `uvx` is an exact alias for `uv tool run`.

### Run without installing

```console
$ uvx pycowsay "Hello from uvx!"
  ---------------
< Hello from uvx! >
  ---------------
   \   ^__^
    \  (oo)\_______
       (__)\       )\/\
           ||----w |
           ||     ||

$ uvx ruff@0.17.0 --version          # exact version
$ uvx ruff@latest check              # force the newest release
$ uvx --from httpie http --version   # command name differs from package name
$ uvx --from 'mypy[reports]==1.13.0' mypy --help
$ uvx --with mkdocs-material mkdocs serve       # plugins
$ uvx --from git+https://github.com/httpie/cli httpie
$ uvx --python 3.12 black .
$ uvx --from ./dist/weather_cli-0.2.0-py3-none-any.whl weather-cli Paris  # try a built wheel
```

`uvx` environments are cached and disposable. After the first run, `uvx tool` reuses the cached version until you ask for `@latest`, the cache is cleaned, or you pass `--refresh`.

### Install persistently

```console
$ uv tool install httpie
Installed 3 executables: http, httpie, https
$ uv tool install 'ruff>=0.16'
$ uv tool install ruff@latest
$ uv tool install mkdocs --with mkdocs-material
$ uv tool install --with-executables-from ansible-core,ansible-lint ansible
$ uv tool install -e .               # your own CLI project, editable
$ uv tool install git+https://github.com/org/internal-cli

$ uv tool list
httpie v3.2.4
- http
- httpie
- https
$ uv tool list --show-paths --show-version-specifiers --show-python
$ uv tool list --outdated

$ uv tool upgrade httpie            # respects the original constraints
$ uv tool upgrade --all
$ uv tool uninstall httpie
$ uv tool dir                       # where tool environments live
$ uv tool dir --bin                 # where executables are linked
$ uv tool update-shell              # put the bin dir on PATH
```

Tool executables go in `~/.local/bin`. Tool environments are isolated: `python -c "import ruff"` won't work after `uv tool install ruff`, by design.

### `uvx` vs `uv run` for dev tools

- Use **`uv run pytest`** (with pytest in your `dev` group) for anything that needs to import *your* project: test runners, type checkers, Sphinx.
- Use **`uvx`** for standalone tools that don't import your code (cookiecutter, httpie, pre-commit, twine), or one-off runs.
- For linters/formatters like Ruff, either works. Pinning `ruff` in the `dev` group keeps the whole team on the same version.

---

## 10. The pip-compatible interface: `uv venv` and `uv pip`

The `uv pip` commands are a fast drop-in for pip, pip-tools and virtualenv workflows. Use them when you're working with `requirements.txt`, maintaining a legacy project, or need manual control.

### `uv venv`

```console
$ uv venv                          # .venv with the default Python
Using CPython 3.14.8
Creating virtual environment at: .venv
Activate with: source .venv/bin/activate
$ uv venv --python 3.12            # specific Python (downloaded if needed)
$ uv venv .venv-312 -p 3.12        # custom location
$ uv venv --seed                   # include pip in the venv (for tools that call `pip`)
$ uv venv --clear                  # required to replace an existing venv (since 0.10)
$ uv venv --prompt myproj --system-site-packages
$ uv venv --relocatable
```

> **There is no pip inside a uv-created venv** unless you pass `--seed`. `python -m pip` will fail. Use `uv pip …` instead, or create the venv with `--seed` for IDEs/tools that insist on pip.

### Installing and inspecting packages

```bash
uv pip install flask "ruff>=0.16" "requests==2.32.3"
uv pip install -r requirements.txt
uv pip install -r pyproject.toml --extra dev       # deps declared in pyproject
uv pip install --group dev                          # a dependency group
uv pip install -e .                                 # editable install of the current project
uv pip install "git+https://github.com/astral-sh/ruff@v0.17.0"
uv pip install --system requests                    # into a non-virtual Python (CI/Docker)
uv pip install --target ./vendor requests           # into a directory
uv pip install --dry-run -r requirements.txt
uv pip install --torch-backend auto torch           # pick the right PyTorch build

uv pip uninstall flask
uv pip list                    # table
uv pip list --outdated
uv pip list --format json
uv pip freeze > requirements.lock.txt
uv pip show flask
uv pip tree --depth 1
uv pip check                   # verify compatible dependencies
```

```console
$ uv pip tree --depth 1
flask v3.1.3
├── blinker v1.9.0
├── click v8.5.0
├── itsdangerous v2.2.0
├── jinja2 v3.1.6
├── markupsafe v3.0.4
└── werkzeug v3.1.9
python-dotenv v1.2.4
requests v2.32.3
├── certifi v2026.7.22
├── charset-normalizer v3.5.2
├── idna v3.20
└── urllib3 v2.8.0
```

### Which environment does `uv pip` modify?

1. The active venv (`VIRTUAL_ENV`), then an active Conda env (`CONDA_PREFIX`).
2. A `.venv` in the current directory or a parent.
3. Otherwise it errors and tells you to run `uv venv`, unless you pass `--system` or `--python <path>`.

### Compiling and syncing (pip-tools replacement)

```bash
uv pip compile requirements.in -o requirements.txt           # lock loose deps to exact pins
uv pip compile pyproject.toml -o requirements.txt
uv pip compile pyproject.toml --extra dev -o requirements-dev.txt
uv pip compile --group dev -o requirements-dev.txt
uv pip compile requirements.in --universal -o requirements.txt   # one file for all platforms
uv pip compile requirements.in --python-version 3.11 --python-platform linux
uv pip compile requirements.in --generate-hashes -o requirements.txt
uv pip compile requirements.in -o requirements.txt --upgrade-package django
uv pip compile requirements.in -o pylock.toml                    # PEP 751 output

uv pip sync requirements.txt      # make the env match exactly (removes extras)
uv pip sync pylock.toml
```

`uv pip install -r` adds/updates but never removes. `uv pip sync` makes the environment *exactly* match the file.

Constraints, overrides and exclusions work like pip's:

```bash
uv pip compile requirements.in -c constraints.txt    # cap versions without adding packages
uv pip compile requirements.in --overrides overrides.txt   # force a version, ignoring others' pins
uv pip compile requirements.in --excludes excludes.txt
```

The project-level equivalents are `constraint-dependencies`, `override-dependencies` and `exclude-dependencies` under `[tool.uv]`.

### Key differences from pip

- A virtual environment is required by default (`--system` opts out).
- No `pip` in uv-created venvs unless `--seed`.
- `uv pip install` respects `requires-python` and prefers the newest compatible versions. It does *not* read `pip.conf`; configure uv via `uv.toml`, `[tool.uv.pip]` or `UV_*` environment variables.
- `--index-url` / `--extra-index-url` work, but uv searches indexes in order and stops at the first one that has the package (safer against dependency confusion). See `--index-strategy` if you need pip's behavior.
- Pre-releases: uv tries stable versions first and falls back to pre-releases only when nothing stable satisfies the constraints (since 0.12).
---

## 11. Working with vanilla pip users: requirements.txt in both directions

Not everyone on a team (or every deployment target) uses uv. uv speaks `requirements.txt` fluently in both directions.

### Scenario A: you use uv, a colleague or server uses plain pip

Export the lockfile to a pinned `requirements.txt`:

```console
$ uv export --no-dev --no-hashes --no-emit-project -o requirements.txt
$ head -12 requirements.txt
# This file was autogenerated by uv via the following command:
#    uv export --no-dev --no-hashes --no-emit-project -o requirements.txt
anyio==4.15.1
    # via httpx
certifi==2026.7.22
    # via
    #   httpcore
    #   httpx
h11==0.16.0
    # via httpcore
httpcore==1.0.9
    # via httpx
```

Your colleague installs with nothing but standard Python:

```console
$ python3.13 -m venv .venv && .venv/bin/pip install -r requirements.txt
$ .venv/bin/pip freeze
anyio==4.15.1
certifi==2026.7.22
h11==0.16.0
httpcore==1.0.9
httpx==0.28.1
idna==3.20
markdown-it-py==4.2.0
mdurl==0.1.2
Pygments==2.21.0
rich==15.0.0
typing_extensions==4.16.0
```

Choosing export flags:

| Flag | Effect | When |
|---|---|---|
| *(default)* | Includes hashes, the `dev` group, and `-e .` for your project | Hash-checked installs of a dev environment |
| `--no-dev` | Exclude the `dev` group | Production requirements |
| `--all-groups` / `--group docs` | Include more groups | `requirements-dev.txt`, docs builds |
| `--all-extras` / `--extra plot` | Include extras | |
| `--no-hashes` | Plain `pkg==version` lines | Easier to read, older tooling |
| `--no-emit-project` | Leave out `-e .` | Deploying deps only; consumer doesn't have your source |
| `--no-header` / `--no-annotate` | Drop comments | Minimal files |
| `--format pylock.toml` | PEP 751 lockfile | Tools that support `pylock.toml` |
| `--format cyclonedx1.5` | SBOM (preview) | Security/compliance |
| `--frozen` | Don't re-lock first | CI |

A typical pair of files:

```bash
uv export --no-dev --no-hashes -o requirements.txt
uv export --all-groups --no-hashes --no-emit-project -o requirements-dev.txt
```

> **Gotchas**
> - `uv export -o file` writes the file **and** prints it to stdout. Redirect to `/dev/null` in scripts if the noise bothers you.
> - The export targets your project's `requires-python`. A pip user on an older Python may pull in extra backports (for example `exceptiongroup` on 3.10) that aren't in the file, or fail outright. Tell them which Python to use (keep `.python-version` in the repo).
> - The lines carry environment markers (`; sys_platform == 'win32'`), so one file works on every OS.

**Keep it in sync automatically** with the official pre-commit hook (see [§18](#pre-commit)):

```yaml
- repo: https://github.com/astral-sh/uv-pre-commit
  rev: 0.13.1
  hooks:
    - id: uv-lock
    - id: uv-export
      args: ["--no-dev", "--no-hashes", "-o", "requirements.txt"]
```

### Scenario B: someone hands you a requirements.txt

**Option 1: just install it (no project).**

```console
$ uv venv --python 3.13
$ uv pip install -r requirements.txt
Resolved 13 packages in 626ms
Installed 13 packages in 6ms
 + blinker==1.9.0
 + flask==3.1.3
 ...
```

**Option 2: convert it into a uv project** (recommended for anything long-lived):

```console
$ uv init --bare --python 3.13
Initialized project `legacy-app`
$ uv add -r requirements.txt                              # use its ranges
$ uv add -r requirements.in -c requirements.txt           # keep previously locked versions
$ uv add --dev -r requirements-dev.txt
$ cat pyproject.toml
[project]
name = "legacy-app"
version = "0.1.0"
requires-python = ">=3.13"
dependencies = [
    "flask>=3.0",
    "python-dotenv>=1.2.4",
    "requests==2.32.3",
]
```

If `requirements-dev.in` starts with `-r requirements.in`, strip that line first so base deps don't land in the dev group:

```bash
sed '/^-r /d' requirements-dev.in | uv add --dev -r - -c requirements-dev.txt
```

**Option 3: stay in pip-tools style** (`requirements.in` → `requirements.txt`):

```bash
uv pip compile requirements.in -o requirements.txt --universal
uv pip sync requirements.txt
```

### Scenario C: you need pip itself inside the environment

Some IDEs, notebooks or legacy scripts call `pip` directly.

```bash
uv venv --seed                 # adds pip to the venv
uv add --dev pip               # or make pip a dev dependency of the project
```

### Quick decision table

| Situation | Use |
|---|---|
| New project | `uv init` + `uv add` (commit `uv.lock`) |
| Deploy target only has pip | `uv export --no-dev -o requirements.txt` |
| Existing repo with requirements files, team not ready to switch | `uv pip compile` / `uv pip sync` / `uv pip install -r` |
| Existing repo, ready to switch | `uv init --bare` + `uv add -r requirements.in -c requirements.txt` |
| Need a standards-based lockfile for another tool | `uv export --format pylock.toml -o pylock.toml` |

---

## 12. Building and publishing packages to PyPI

### Prepare the project

Any packaged project works (`uv init --lib`, or the default app layout). A minimal library:

```console
$ uv init --lib tempconv --python 3.13
$ find . -path ./.git -prune -o -type f -print | sort
./.gitignore
./.python-version
./README.md
./pyproject.toml
./src/tempconv/__init__.py
./src/tempconv/py.typed
```

Fill in the metadata PyPI displays:

```toml
[project]
name = "tempconv"
version = "0.1.0"
description = "Tiny temperature conversion helpers"
readme = "README.md"
license = "MIT"
license-files = ["LICENSE"]
authors = [{ name = "Robert McDermott", email = "robert@example.com" }]
requires-python = ">=3.13"
keywords = ["temperature", "conversion"]
classifiers = [
    "Programming Language :: Python :: 3",
    "Operating System :: OS Independent",
]
dependencies = []

[project.urls]
Homepage = "https://github.com/you/tempconv"
Issues = "https://github.com/you/tempconv/issues"

[build-system]
requires = ["uv_build>=0.13.1,<0.14.0"]
build-backend = "uv_build"
```

> Keep the upper bound on `uv_build` (`<0.14.0`). When you move to a new uv minor release, bump it.

**uv_build module layout.** By default the backend expects `src/<normalized_name>/__init__.py`. To change it:

```toml
[tool.uv.build-backend]
module-name = "temp_conv"   # import name, if it differs from the project name
module-root = ""            # flat layout (module next to pyproject.toml) instead of src/
```

Prefer a different backend? `uv init --build-backend hatch` (or `setuptools`, `flit`, `pdm`, `poetry`, `maturin`, `scikit`). `uv build` works with any PEP 517 backend.

**Internal packages** that must never reach PyPI:

```toml
classifiers = ["Private :: Do Not Upload"]
```

### Version, build, smoke-test

```console
$ uv version --bump minor
tempconv 0.1.0 => 0.2.0

$ uv build
Building source distribution...
Building wheel from source distribution...
Successfully built dist/tempconv-0.2.0.tar.gz
Successfully built dist/tempconv-0.2.0-py3-none-any.whl

$ uv build --no-sources --clear     # release build: ignore tool.uv.sources, wipe old dist/
$ uv build --wheel                  # wheel only (or --sdist)
$ uv build --package core           # one workspace member (or --all-packages)

$ uv run --isolated --no-project --with dist/tempconv-0.2.0-py3-none-any.whl \
    python -c "import tempconv; print(tempconv.c_to_f(100))"
212.0
```

### Publish to TestPyPI first

1. Create an account at <https://test.pypi.org> and an API token.
2. Add the index to `pyproject.toml`:

```toml
[[tool.uv.index]]
name = "testpypi"
url = "https://test.pypi.org/simple/"
publish-url = "https://test.pypi.org/legacy/"
explicit = true
```

3. Publish (dry run first):

```console
$ export UV_PUBLISH_TOKEN=pypi-AgENdGVzdC5weXBpLm9yZw...
$ uv publish --index testpypi --dry-run
Checking 2 files against https://test.pypi.org/legacy/
Checking tempconv-0.2.0-py3-none-any.whl (1.5KiB)
Checking tempconv-0.2.0.tar.gz (1.0KiB)
$ uv publish --index testpypi
```

Without the config block, use `uv publish --publish-url https://test.pypi.org/legacy/ --token "$TOKEN"`.

4. Install it back from TestPyPI:

```bash
uv run --no-project --with tempconv \
  --index https://test.pypi.org/simple/ --index-strategy unsafe-best-match \
  -- python -c "import tempconv; print(tempconv.f_to_c(212))"
```

(`unsafe-best-match` lets dependencies come from real PyPI. Add `--refresh-package tempconv` if a cached copy gets in the way.)

### Publish to PyPI

```bash
export UV_PUBLISH_TOKEN=pypi-AgEIcHlwaS5vcmc...   # a project-scoped token is best
uv publish                                       # uploads dist/*
uv publish dist/tempconv-0.2.0*                  # specific files
```

Credentials: `--token`/`UV_PUBLISH_TOKEN`, or `--username`/`--password` (`UV_PUBLISH_USERNAME`/`UV_PUBLISH_PASSWORD`). PyPI only accepts tokens now (username `__token__`). If an upload half-fails, rerun the same command; PyPI skips identical files. For other registries, use `--check-url <index-url>`.

### Trusted Publishing from GitHub Actions (no secrets)

Add a [trusted publisher](https://docs.pypi.org/trusted-publishers/) on PyPI (project → *Publishing*), create a `pypi` environment in GitHub, then:

```yaml
# .github/workflows/release.yml
name: Publish to PyPI
on:
  push:
    tags: ["v*.*.*"]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@v7
        with: { persist-credentials: false }
      - uses: astral-sh/setup-uv@v9
        with: { enable-cache: false }
      - run: uv build
      - run: uv run --isolated --no-project --with dist/*.whl tests/smoke_test.py
      - uses: actions/upload-artifact@v7
        with: { name: dist, path: dist/ }

  publish:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: pypi }
    permissions: { id-token: write }
    steps:
      - uses: astral-sh/setup-uv@v9
        with: { enable-cache: false }
      - uses: actions/download-artifact@v8
        with: { name: dist, path: dist/ }
      - run: uv publish
```

Then `uv version --bump patch && git commit -am "release" && git tag v0.2.1 && git push --tags`. uv detects trusted publishing automatically and uploads PEP 740 attestations it finds next to the files (`--no-attestations` to skip). Astral's own workflow pins actions to commit SHAs. Do the same in production.

---

## 13. Workspaces (monorepos)

A workspace is a set of packages in one repo that share **one lockfile and one `.venv`** (like Cargo workspaces).

```console
$ uv init acme --python 3.13 && cd acme
$ uv init --lib packages/core
Adding `core` as member of workspace `/Users/you/dev/acme`
Initialized project `core` at `/Users/you/dev/acme/packages/core`
$ uv init packages/api
Adding `api` as member of workspace `/Users/you/dev/acme`

$ cd packages/api && uv add core      # depend on a sibling member
$ cat pyproject.toml | tail -2
[tool.uv.sources]
core = { workspace = true }
```

The root `pyproject.toml` gains:

```toml
[tool.uv.workspace]
members = ["packages/core", "packages/api"]   # globs allowed: ["packages/*"]
exclude = ["packages/experimental"]
```

Working in a workspace:

```console
$ uv workspace list
acme
api
core
$ uv workspace list --paths
$ uv workspace dir --package core
$ uv sync --all-packages             # install every member
$ uv run --package api api           # run in a member from anywhere in the repo
Hello from api!
$ uv lock                            # always locks the whole workspace
$ uv build --all-packages            # dist/ gets a wheel + sdist per member
$ uv export --all-packages
$ uv workspace metadata              # JSON description of the workspace (preview)
```

Rules of thumb:

- Members depend on each other via `{ workspace = true }` and are always editable.
- There's one `requires-python` for the whole workspace (the intersection of all members).
- `[tool.uv]` settings are read from the workspace root only.
- If members need conflicting dependency versions or separate environments, use independent projects with `path` sources instead.

---

## 14. Code quality: Ruff, `uv format`, `uv check` and `uv audit`

### Is Ruff built into uv?

Partly. `uv format` runs Ruff's **formatter** for you: it downloads a Ruff binary on demand. It is still a **preview** command (it prints an "experimental" warning), and it pins its own default Ruff version (0.15.x in uv 0.13.1) rather than the newest Ruff. There is **no `uv lint`**: for linting you run `ruff check` yourself. Most teams add Ruff as a dev dependency so everyone uses the same version:

```bash
uv add --dev ruff
uv run ruff check            # lint
uv run ruff check --fix      # lint + safe autofixes
uv run ruff format           # format
uv run ruff format --check   # CI: fail if unformatted
```

Or without adding it to the project: `uvx ruff check`, or `uv tool install ruff`.

### Ruff in 2 minutes

```console
$ uv run ruff check
UP035 [*] Import from `collections.abc` instead: `Iterable`
 --> src/numbers/calculate.py:1:1
...
F401 [*] `os` imported but unused
 --> src/numbers/calculate.py:2:8
...
Found 7 errors.
[*] 5 fixable with `--fix` (2 unsafe fixes available with `--fix --unsafe-fixes`).

$ uv run ruff check --fix
...
Found 7 errors (5 fixed, 2 remaining).
2 unsafe fixes available with `--fix --unsafe-fixes`.

$ uv run ruff format --diff      # preview formatting changes
$ uv run ruff format
1 file reformatted, 2 files left unchanged

$ uv run ruff check --statistics
1	SIM103	needless-bool
1	F841  	unused-variable
$ uv run ruff rule F841          # explain a rule
$ uv run ruff check --watch      # re-lint on save
$ uv run ruff check --select UP035 --add-noqa .   # baseline an existing codebase
```

Ruff 0.17's default rule set is much broader than older releases (it now includes pyflakes `F`, bugbear-style, pyupgrade `UP`, import sorting `I`, simplification `SIM` and more). It also defaults to Python 3.11 when it can't find a target version. With a `requires-python` in `pyproject.toml`, Ruff uses that automatically.

### A sensible team configuration

```toml
[tool.ruff]
line-length = 100
# target-version is inferred from [project].requires-python

[tool.ruff.lint]
extend-select = [
  "E501",   # line too long (off by default because the formatter handles it)
  "D",      # pydocstyle (optional)
]
ignore = ["D100", "D104"]

[tool.ruff.lint.pydocstyle]
convention = "google"

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["D"]

[tool.ruff.format]
quote-style = "double"
docstring-code-format = true
```

Suppressing: `# noqa: F401` on a line, `# ruff: noqa: UP035` for a file. Ruff 0.17 also supports `# ruff: ignore[...]` comments (`ruff check --add-ignore`).

### `uv format`

```console
$ uv format --check
warning: `uv format` is experimental and may change without warning. Pass `--preview-features format-command` to disable this warning.
Would reformat: src/weather_cli/__init__.py
1 file would be reformatted, 1 file already formatted
$ uv format                            # format the project
$ uv format --diff
$ uv format --version 0.17.0           # use a specific Ruff version
$ uv format -- --line-length 100       # pass extra args through to `ruff format`
$ uv format --preview-features format-command   # silence the warning
```

It reads the same `[tool.ruff]` configuration.

### `uv check`: type checking with ty (preview)

`uv check` runs Astral's **ty** type checker against your project environment, downloading ty on demand.

```console
$ uv check
warning: `uv check` is experimental and may change without warning. Pass `--preview-features check-command` to disable this warning.
error[invalid-assignment]: Object of type `float` is not assignable to `str`
 --> src/weather_cli/oops.py:3:15
  |
3 | result: str = c_to_f(10)
  |         ---   ^^^^^^^^^^ Incompatible value of type `float`
  |         |
  |         Declared type

Found 1 diagnostic
```

Useful flags: `--fix`, `--all-packages`, `--package`, `--script file.py`, `--ty-version`, `--python 3.13`.

### `uv audit`: vulnerability scanning (preview)

`uv audit` checks every locked dependency against the [OSV](https://osv.dev) database.

```console
$ uv audit
warning: `uv audit` is experimental and may change without warning. Pass `--preview-features audit-command` to disable this warning.
Resolved 18 packages in 1ms
Found no known vulnerabilities and no adverse project statuses in 17 packages

$ uv add "jinja2==3.1.2" && uv audit
...
Found 10 known vulnerabilities and no adverse project statuses in 19 packages

Vulnerabilities:

jinja2 3.1.2 has 10 known vulnerabilities:

- PYSEC-2026-1474: Jinja vulnerable to HTML attribute injection when passing user input as keys to xmlattr filter
  Fixed in: 3.1.4
...
```

Flags: `--output-format json|sarif` (SARIF plugs into GitHub code scanning), `--ignore <ID>`, `--ignore-until-fixed <ID>`, `--no-dev`, `--script`. Installed tools can be audited with `uv tool audit --all`, but only tools installed with the `tool-install-locks` preview feature have a lockfile to audit.

There's also opt-in **malware checking during sync** (preview): set `UV_MALWARE_CHECK=1` or `audit.malware-check = true`.

### Editor integration

- **VS Code / Cursor:** install the Ruff extension (native language server); point the Python interpreter at `.venv/bin/python` (run `uv sync` first so it exists). ty also has an editor extension.
- **PyCharm:** recent versions detect `uv.lock` and offer uv as the interpreter type.
- **Neovim/Helix:** `ruff server` and `ty server` speak LSP.
---

## 15. Configuration and environment variables

### Where uv reads settings (highest precedence first)

1. Command-line flags
2. Environment variables (`UV_*`)
3. Project config: `uv.toml` or `[tool.uv]` in `pyproject.toml` (found in the current directory or a parent; for workspaces, only the root). If both exist in one directory, `uv.toml` wins.
4. User config: `~/.config/uv/uv.toml` (macOS/Linux) or `%APPDATA%\uv\uv.toml` (Windows)
5. System config: `/etc/uv/uv.toml` or `%PROGRAMDATA%\uv\uv.toml`

Scalars from closer files override farther ones; arrays are concatenated. `--no-config` ignores all files; `--config-file path/uv.toml` uses only that file. `uv tool …` commands ignore project config and read only user/system config.

`uv.toml` uses the same keys as `[tool.uv]` without the prefix:

```toml
# ~/.config/uv/uv.toml: a good personal baseline
python-preference = "managed"      # managed | only-managed | system | only-system
python-downloads = "automatic"     # automatic | manual | never
link-mode = "clone"                # clone | copy | hardlink | symlink
compile-bytecode = false
add-bounds = "lower"               # lower | major | minor | exact
system-certs = true                # use the OS trust store (corporate TLS proxies)
```

### Frequently used `[tool.uv]` settings

```toml
[tool.uv]
default-groups = ["dev"]                    # or "all"
managed = true                              # false = uv won't auto-lock/sync this project
package = true                              # force-build/install the project (or false to never)
required-version = ">=0.13"                 # fail fast if a teammate's uv is too old
exclude-newer = "7 days"                    # dependency cooldown (or a timestamp)
environments = ["sys_platform == 'darwin'", "sys_platform == 'linux'"]  # limit lock platforms
required-environments = ["sys_platform == 'darwin' and platform_machine == 'x86_64'"]
constraint-dependencies = ["urllib3<3"]
override-dependencies = ["somepkg>=2"]      # ignore other packages' bounds on somepkg
conflicts = [[{ extra = "cpu" }, { extra = "gpu" }]]
preview-features = ["format-command", "check-command", "audit-command"]  # silence warnings

[tool.uv.pip]                               # applies only to `uv pip …`
index-url = "https://pypi.org/simple"
```

> `required-version` is an easy win for teams: it stops someone on an old uv from rewriting `uv.lock` in a format others can't read.

### `.env` files

```bash
uv run --env-file .env -- python app.py
uv run --env-file .env --env-file .env.local -- python app.py   # later files override
export UV_ENV_FILE=".env .env.local"
uv run --no-env-file app.py
```

Variables already set in the shell take precedence over the file.

### Environment variables worth knowing

| Variable | Purpose |
|---|---|
| `UV_PYTHON` | Same as `--python` |
| `UV_PROJECT_ENVIRONMENT` | Use a different venv path for the project (e.g. `/usr/local` in Docker, or an external dir) |
| `UV_CACHE_DIR` / `UV_NO_CACHE` | Cache location / disable the cache |
| `UV_LINK_MODE` | `copy` silences hard-link warnings across filesystems |
| `UV_COMPILE_BYTECODE` | Pre-compile `.pyc` at install (Docker images) |
| `UV_SYSTEM_CERTS` | Trust the OS certificate store (renamed from `UV_NATIVE_TLS`) |
| `SSL_CERT_FILE` | Point at a PEM bundle (e.g. corporate CA) |
| `UV_INDEX`, `UV_DEFAULT_INDEX` | Extra / default package indexes |
| `UV_INDEX_<NAME>_USERNAME` / `_PASSWORD` | Credentials for a named index |
| `UV_PUBLISH_TOKEN` | Token for `uv publish` |
| `UV_LOCKED`, `UV_FROZEN`, `UV_NO_SYNC`, `UV_NO_DEV` | CI behavior switches |
| `UV_SYSTEM_PYTHON` | Let `uv pip` install into system Python |
| `UV_PYTHON_DOWNLOADS=never` | Never download interpreters |
| `UV_OFFLINE` | No network at all |
| `UV_EXCLUDE_NEWER` | Global cooldown/timestamp |
| `UV_TORCH_BACKEND` | `auto`, `cpu`, `cu128`… for PyTorch |
| `UV_HTTP_TIMEOUT`, `UV_CONCURRENT_DOWNLOADS` | Network tuning |
| `UV_TOOL_BIN_DIR`, `UV_TOOL_DIR`, `UV_PYTHON_INSTALL_DIR` | Relocate tools/Pythons |
| `UV_PREVIEW=1`, `UV_PREVIEW_FEATURES=…` | Enable preview features |
| `UV_NO_MODIFY_PATH` | Stop the installer/self-update from editing shell profiles |

---

## 16. Package indexes and authentication

### Defining indexes

```toml
[[tool.uv.index]]
name = "internal"
url = "https://pypi.internal.example.org/simple"

[[tool.uv.index]]
name = "pytorch-cpu"
url = "https://download.pytorch.org/whl/cpu"
explicit = true            # only used by packages that opt in via sources

[tool.uv.sources]
torch = { index = "pytorch-cpu" }
```

- Indexes are searched **in the order listed**, then PyPI (the implicit default). Add `default = true` to replace PyPI.
- uv stops at the **first index that has the package** (`first-index` strategy). This prevents dependency-confusion attacks. Use `index-strategy = "unsafe-best-match"` only if you really need pip-like merging.
- `explicit = true` keeps an index from being used for anything except packages pinned to it.
- On the command line: `--index name=url`, `--default-index url`. The legacy `--index-url` / `--extra-index-url` also work.

### Credentials

```bash
# per-index environment variables (name uppercased, non-alphanumerics → _)
export UV_INDEX_INTERNAL_USERNAME=robert
export UV_INDEX_INTERNAL_PASSWORD="$TOKEN"

# or store them with uv's credential store
uv auth login pypi.internal.example.org --username robert --password -   # reads from stdin
uv auth login example.com --token "$TOKEN"
uv auth token example.com
uv auth logout example.com
uv auth dir
```

uv also reads `~/.netrc` and can call the `keyring` CLI (`--keyring-provider subprocess`). Credentials are **never** written to `uv.lock`. Guides exist for Azure Artifacts, AWS CodeArtifact, Google Artifact Registry and JFrog in the uv docs. Private Git dependencies use your normal Git credentials (SSH keys, credential helpers, `gh auth setup-git`).

### Corporate networks / TLS inspection

If you see certificate errors behind a proxy that re-signs TLS traffic:

```bash
uv sync --system-certs           # or: export UV_SYSTEM_CERTS=1
export SSL_CERT_FILE=/path/to/corporate-ca-bundle.pem
export HTTPS_PROXY=http://proxy.example.org:8080
```

### PyTorch

```bash
uv pip install torch --torch-backend auto        # detect CUDA/ROCm/CPU automatically
uv add torch --index pytorch=https://download.pytorch.org/whl/cu128
```

For projects that need different builds per platform, use marker-based sources (see the PyTorch guide in the uv docs).

---

## 17. The cache

uv keeps one global cache of downloaded and built packages and links files from it into each environment, which is why repeated installs are nearly instant and many venvs use little extra disk.

```console
$ uv cache dir
/Users/you/.cache/uv
$ uv cache size -H              # preview command
627.0MiB
$ uv cache prune                # remove unused entries (safe, run any time)
Pruning cache at: /Users/you/.cache/uv
Removed 13689 files (423.2MiB)
$ uv cache prune --ci           # shrink before saving a CI cache
$ uv cache clean                # wipe everything
$ uv cache clean requests       # one package
```

Force fresh metadata or builds without wiping the cache:

```bash
uv sync --refresh                    # revalidate everything
uv sync --refresh-package mylib
uv sync --reinstall-package mylib    # rebuild/reinstall one package
```

For local packages whose build depends on extra files (Cython sources, `.env`, version files), tell uv what to watch:

```toml
[tool.uv]
cache-keys = [{ file = "pyproject.toml" }, { file = "src/**/*.pyx" }, { git = { commit = true } }]
```

> After upgrading to uv 0.13, expect some packages to be re-downloaded or rebuilt once: the cache format changed. Multiple uv versions can still share one cache.

---

## 18. CI/CD, Docker and pre-commit

### GitHub Actions

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.12", "3.13"]
    steps:
      - uses: actions/checkout@v7
      - uses: astral-sh/setup-uv@v9
        with:
          version: "0.13.1"                # pin uv for reproducibility
          python-version: ${{ matrix.python-version }}
          enable-cache: true
      - run: uv lock --check               # fail if someone forgot to commit uv.lock
      - run: uv sync --locked --all-extras --dev
      - run: uv run ruff check
      - run: uv run ruff format --check
      - run: uv run pytest
```

Without `setup-uv`: `curl -LsSf https://astral.sh/uv/0.13.1/install.sh | sh`, set `UV_PYTHON` for the matrix, cache `~/.cache/uv` keyed on `hashFiles('uv.lock')`, and run `uv cache prune --ci` before saving. On non-ephemeral self-hosted runners, put `UV_CACHE_DIR` inside the workspace and clean it after each job.

GitLab CI: use the `ghcr.io/astral-sh/uv:python3.13-trixie-slim` image and set `UV_CACHE_DIR: .uv-cache` with a cache on that path.

### Docker

Copy the static binary from the official image and build in two layers (dependencies, then your code):

```dockerfile
FROM python:3.13-slim-trixie
COPY --from=ghcr.io/astral-sh/uv:0.13.1 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_DEV=1

WORKDIR /app

# 1) dependencies only: cached until uv.lock / pyproject.toml change
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# 2) the project itself
COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-editable

ENV PATH="/app/.venv/bin:$PATH"
CMD ["weather-cli"]
```

Add `.venv` to `.dockerignore`. In workspaces, use `--no-install-workspace` and `--frozen` in the first layer. For the smallest runtime images, use a multi-stage build that copies only `/app/.venv` into a slim base with the same Python. Images with uv preinstalled also exist (`ghcr.io/astral-sh/uv:python3.13-trixie-slim`, `:alpine`, `:debian`…).

### pre-commit

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/uv-pre-commit
    rev: 0.13.1
    hooks:
      - id: uv-lock                       # keep uv.lock in sync with pyproject.toml
      - id: uv-export                     # keep requirements.txt in sync with uv.lock
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.17.0
    hooks:
      - id: ruff-check
        args: [--fix]
      - id: ruff-format
```

Run it with uv, no global install needed: `uvx pre-commit install` then `uvx pre-commit run --all-files`. (Or try `prek`, a fast Rust reimplementation: `uvx prek run --all-files`.)

### Jupyter

```bash
uv add --dev ipykernel
uv run --with jupyter jupyter lab                 # notebook server using the project env
uv run ipython kernel install --user --env VIRTUAL_ENV $(pwd)/.venv --name=myproj
```

---

## 19. Recommended team conventions

A starting point for a team adopting uv:

1. **Everyone installs uv with the standalone installer** and keeps it current with `uv self update`. Set `required-version = ">=0.13"` in `[tool.uv]`.
2. **Pick a default Python and pin it.** For broad package compatibility, standardize on **Python 3.13** for now: create projects with `uv init -p 3.13`, which writes `requires-python = ">=3.13"` and a `.python-version` of `3.13`. Optionally set a personal default with `uv python pin --global 3.13`. Move to 3.14/3.15 deliberately, when your key dependencies publish wheels.
3. **New projects:** `uv init my-app -p 3.13` (apps/CLIs), `uv init --lib my-lib -p 3.13` (libraries), `uv init --no-package -p 3.13` (notebooks, simple scripts).
4. **Commit** `pyproject.toml`, `uv.lock`, `.python-version`. **Ignore** `.venv/`, `dist/`, `__pycache__/`, `.ruff_cache/`.
5. **Change dependencies only with `uv add` / `uv remove`.** Never `uv pip install` into a project venv.
6. **Run everything with `uv run`.** Activating `.venv` is fine for interactive work.
7. **Dev tooling in groups:** `dev` (pytest, ruff, ipykernel), plus `docs` / `lint` if useful.
8. **Upgrades are explicit and reviewed:** `uv lock --upgrade-package X` or `uv lock --upgrade` in a dedicated PR; review the `uv.lock` diff. Consider `exclude-newer = "7 days"` as a supply-chain cooldown.
9. **CI** runs `uv lock --check`, `uv sync --locked`, `uv run ruff check`, `uv run ruff format --check`, `uv run pytest` (and optionally `uv audit`).
10. **Hand-offs to pip users:** generate `requirements.txt` with `uv export` via the pre-commit hook rather than by hand.
11. **Onboarding a new developer is two commands:** `git clone … && cd repo && uv sync`. Then `uv run pytest`.

A starter `.gitignore` for uv projects:

```gitignore
.venv/
__pycache__/
*.py[cod]
dist/
build/
*.egg-info/
.ruff_cache/
.pytest_cache/
.env
```

---

## 20. Migration cheat sheet

### From pip + venv

| Old | uv (project workflow) | uv (pip-compatible) |
|---|---|---|
| `python -m venv .venv` | *(automatic)* | `uv venv` |
| `source .venv/bin/activate` | *(not needed: `uv run`)* | same |
| `pip install requests` | `uv add requests` | `uv pip install requests` |
| `pip install -r requirements.txt` | `uv add -r requirements.txt` | `uv pip install -r requirements.txt` |
| `pip install -e .` | *(automatic for packaged projects)* | `uv pip install -e .` |
| `pip uninstall requests` | `uv remove requests` | `uv pip uninstall requests` |
| `pip freeze > requirements.txt` | `uv export -o requirements.txt` | `uv pip freeze > requirements.txt` |
| `pip list` / `pip show` | `uv tree` | `uv pip list` / `uv pip show` |
| `pip install -U requests` | `uv lock --upgrade-package requests` | `uv pip install -U requests` |
| `python script.py` | `uv run script.py` | same |

### From pip-tools

| pip-tools | uv |
|---|---|
| `pip-compile requirements.in` | `uv pip compile requirements.in -o requirements.txt` |
| `pip-compile --upgrade-package X` | `uv pip compile … --upgrade-package X` |
| `pip-compile --generate-hashes` | `uv pip compile … --generate-hashes` |
| `pip-sync requirements.txt` | `uv pip sync requirements.txt` |
| one file per platform | `uv pip compile --universal` (one file for all) |

### From pipx

| pipx | uv |
|---|---|
| `pipx run black` | `uvx black` |
| `pipx install httpie` | `uv tool install httpie` |
| `pipx inject mkdocs mkdocs-material` | `uv tool install mkdocs --with mkdocs-material` |
| `pipx upgrade-all` | `uv tool upgrade --all` |
| `pipx list` | `uv tool list` |
| `pipx ensurepath` | `uv tool update-shell` |

### From pyenv

| pyenv | uv |
|---|---|
| `pyenv install 3.13` | `uv python install 3.13` |
| `pyenv versions` | `uv python list --only-installed` |
| `pyenv local 3.13` | `uv python pin 3.13` |
| `pyenv global 3.13` | `uv python pin --global 3.13` (for uv) / `uv python install 3.13 --default` (for `python` on PATH) |
| `pyenv which python` | `uv python find` |

### From Poetry

| Poetry | uv |
|---|---|
| `poetry new` / `poetry init` | `uv init` / `uv init --lib` |
| `poetry add requests` | `uv add requests` |
| `poetry add --group dev pytest` | `uv add --dev pytest` |
| `poetry remove` | `uv remove` |
| `poetry install` | `uv sync` |
| `poetry lock` | `uv lock` |
| `poetry update` | `uv lock --upgrade` |
| `poetry run pytest` | `uv run pytest` |
| `poetry shell` | `source .venv/bin/activate` |
| `poetry show --tree` | `uv tree` |
| `poetry version minor` | `uv version --bump minor` |
| `poetry build` / `poetry publish` | `uv build` / `uv publish` |
| `poetry export -f requirements.txt` | `uv export` |

To convert an existing Poetry project automatically: `uvx migrate-to-uv` (a community tool) rewrites `[tool.poetry]` into standard `[project]` metadata and dependency groups.

### From Conda

uv manages **PyPI** packages and CPython builds; it does not install non-Python system libraries the way Conda does. For most pure-Python and wheel-based scientific stacks (NumPy, pandas, scikit-learn, PyTorch), `uv init -p 3.13 && uv add numpy pandas scikit-learn` is faster and gives you a cross-platform lockfile. If you rely on Conda-only packages (some GIS, CUDA toolkits, R), keep Conda for those and either use `uv pip` inside the activated Conda env (uv detects `CONDA_PREFIX`) or keep separate environments.

---

## 21. Gotchas and troubleshooting

| Symptom | Cause / fix |
|---|---|
| `uv init` created `src/…/__init__.py`, not `main.py` | Packaged layout has been the default since 0.12. Use `uv init --no-package` for the flat layout. |
| uv downloaded Python 3.15 when you expected 3.13 | 3.15 has been the default since 0.13. Pin with `uv python pin 3.13` or create projects with `-p 3.13`. |
| A package I installed disappeared | `uv sync` is exact: anything not in the lockfile or the selected groups is removed. Use `uv add`, or `--inexact`. |
| `python -m pip: No module named pip` | uv venvs don't include pip. Use `uv pip …`, or `uv venv --seed`. |
| `uv venv` refuses to overwrite `.venv` | Since 0.10 you must pass `--clear` (and `--force` for non-venv directories). |
| `warning: VIRTUAL_ENV=… does not match the project environment path` | You have another venv activated. `deactivate`, or pass `--active` to use it on purpose. |
| `uv run script.py` used the wrong project | Since 0.12, uv discovers the project from the script's directory. Use `--project .` to override. |
| "self-dependencies are not permitted" | You ran `uv add <your-own-project>`. Use `--dev`/`--optional`, or rename the project if it shadows a PyPI name. |
| Lock fails with "No solution found" | Read the explanation tree. Loosen a constraint, add an override, or declare `conflicts` for mutually exclusive extras/groups. |
| `uv format` / `check` / `audit` print "experimental" | They're preview commands. Add `--preview-features format-command` (etc.) or `preview-features = [...]` in config. |
| Certificate verify failed | Use `--system-certs` / `UV_SYSTEM_CERTS=1` (the old `--native-tls` / `UV_NATIVE_TLS` names are deprecated) or `SSL_CERT_FILE`. |
| `Failed to hardlink files; falling back to full copy` | Cache and project are on different filesystems. Set `UV_LINK_MODE=copy` to silence it. |
| `uvx tool` runs an old version | `uvx` reuses its cached environment. Use `uvx tool@latest` or `--refresh`. |
| `pytest` via `uvx` can't import my package | `uvx` runs in isolation. Use `uv run pytest` with pytest in the dev group. |
| Build works locally, fails for others | You rely on `tool.uv.sources`. Test with `uv build --no-sources`. |
| Need to see what uv is doing | Add `-v` / `-vv`, or `RUST_LOG=uv=debug`. |
| Stale or corrupted cache | `uv cache clean <pkg>` or `uv sync --refresh --reinstall`. |

---

## 22. Complete command reference

Every command and subcommand in uv 0.13.1, with the flags you'll actually use. Run `uv help <command>` for the exhaustive list.

### Global options (work with every command)

`-q/--quiet`, `-v/--verbose`, `--color auto|always|never`, `--offline`, `--no-progress`, `--directory DIR` (cd first), `--project DIR` (find the project here), `--config-file`, `--no-config`, `--no-cache` / `--cache-dir`, `--managed-python` / `--no-managed-python`, `--no-python-downloads`, `--system-certs`, `--allow-insecure-host`, `--preview` / `--preview-features`, `-h/--help`, `-V/--version`.

Shared groups of options appear on many commands:

- **Resolver:** `-U/--upgrade`, `-P/--upgrade-package`, `--upgrade-group`, `--resolution highest|lowest|lowest-direct`, `--prerelease if-necessary|allow|disallow|explicit`, `--fork-strategy`, `--exclude-newer`, `--exclude-newer-package`, `--no-sources`
- **Index:** `--index`, `--default-index`, `--index-url`, `--extra-index-url`, `--find-links`, `--no-index`, `--index-strategy`, `--keyring-provider`
- **Installer:** `--reinstall`, `--reinstall-package`, `--link-mode`, `--compile-bytecode`
- **Build:** `-C/--config-setting`, `--no-build-isolation`, `--no-build`, `--no-binary`, `--require-build-hashes`
- **Cache:** `--refresh`, `--refresh-package`

### Project commands

| Command | Purpose | Key options |
|---|---|---|
| `uv init [PATH]` | Create a project or script | `--app`, `--lib`, `--package`, `--no-package`, `--bare`, `--script`, `-p/--python`, `--build-backend`, `--vcs git\|none`, `--name`, `--description`, `--author-from`, `--no-readme`, `--no-pin-python`, `--no-workspace` |
| `uv add PKG…` | Add dependencies | `--dev`, `--group`, `--optional`, `-r/--requirements`, `-c/--constraints`, `--editable`, `--bounds`, `--tag/--branch/--rev`, `--extra`, `-m/--marker`, `--index`, `--script`, `--package`, `--no-sync`, `--frozen`, `--locked`, `--raw`, `--lfs` |
| `uv remove PKG…` | Remove dependencies | `--dev`, `--group`, `--optional`, `--script`, `--package`, `--no-sync` |
| `uv version [VALUE]` | Read/set/bump the project version | `--bump major\|minor\|patch\|stable\|alpha\|beta\|rc\|post\|dev`, `--dry-run`, `--short`, `--output-format json`, `--package`, `--frozen` |
| `uv sync` | Make `.venv` match the lockfile | `--locked`, `--frozen`, `--no-dev`, `--only-dev`, `--group`, `--all-groups`, `--no-default-groups`, `--extra`, `--all-extras`, `--inexact`, `--no-install-project`, `--no-install-workspace`, `--no-editable`, `--all-packages`, `--package`, `--script`, `--active`, `--check`, `--dry-run`, `--output-format json` |
| `uv lock` | Create/update `uv.lock` | `--check`, `--check-exists`, `--dry-run`, `--upgrade`, `--upgrade-package`, `--script` |
| `uv run CMD` | Run in the project environment | `--with`, `--with-editable`, `--with-requirements`, `-m/--module`, `-s/--script`, `--env-file`, `--isolated`, `--no-project`, `--no-sync`, `--exact`, `--locked`, `--frozen`, `--package`, `--all-packages`, `--active`, groups/extras flags, `-p/--python` |
| `uv export` | Lockfile → other formats | `--format requirements.txt\|pylock.toml\|cyclonedx1.5`, `-o`, `--no-hashes`, `--no-dev`, `--all-groups`, `--all-extras`, `--no-emit-project`, `--no-emit-workspace`, `--no-emit-package`, `--no-header`, `--no-annotate`, `--prune`, `--package`, `--all-packages`, `--script`, `--frozen` |
| `uv tree` | Show the dependency tree | `--depth`, `--outdated`, `--invert`, `--package`, `--prune`, `--universal`, `--show-sizes`, `--no-dedupe`, `--format json`, `--script`, groups flags |
| `uv format` *(preview)* | Format code with Ruff | `--check`, `--diff`, `--version`, `--no-project`, `-- <ruff args>` |
| `uv check` *(preview)* | Type-check with ty | `--fix`, `--all-packages`, `--package`, `--script`, `--ty-version`, groups/extras flags |
| `uv audit` *(preview)* | Scan dependencies for vulnerabilities (OSV) | `--output-format text\|json\|sarif`, `--ignore`, `--ignore-until-fixed`, `--script`, `--no-dev`, `--python-version`, `--python-platform` |
| `uv build [SRC]` | Build sdist + wheel | `--sdist`, `--wheel`, `-o/--out-dir`, `--package`, `--all-packages`, `--no-sources`, `--clear`, `-b/--build-constraints`, `--require-hashes` |
| `uv publish [FILES]` | Upload to an index | `--index`, `-t/--token`, `-u/--username`, `-p/--password`, `--publish-url`, `--check-url`, `--trusted-publishing`, `--dry-run`, `--no-attestations` |

### Workspace

| Command | Purpose |
|---|---|
| `uv workspace list [--paths]` | List members (`--scripts` lists inline-metadata scripts; preview) |
| `uv workspace dir [--package NAME]` | Path to the workspace root or a member |
| `uv workspace metadata` *(preview)* | JSON metadata about the workspace (`--script`, `--sync`) |

### Python

| Command | Purpose |
|---|---|
| `uv python list [REQ]` | Installed and downloadable versions (`--only-installed`, `--only-downloads`, `--all-versions`, `--all-platforms`, `--show-urls`, `--output-format json`) |
| `uv python install [VER…]` | Install (`--default`, `--reinstall`, `-U/--upgrade`, `--force`, `--no-bin`, `--mirror`, `--install-dir`, `--compile-bytecode`) |
| `uv python upgrade [VER…]` | Move to the latest patch release |
| `uv python find [REQ]` | Print the interpreter path (`--system`, `--show-version`, `--script`) |
| `uv python pin [REQ]` | Write `.python-version` (`--global`, `--rm`, `--resolved`) |
| `uv python dir [--bin]` | Where Pythons/executables are installed |
| `uv python uninstall VER… / --all` | Remove managed versions |
| `uv python update-shell` | Add the executable dir to `PATH` |

### Tools

| Command | Purpose |
|---|---|
| `uvx` / `uv tool run CMD` | Run a tool in a temporary env (`--from`, `--with`, `--python`, `--isolated`, `@version`, `@latest`) |
| `uv tool install PKG` | Install persistently (`--with`, `--with-executables-from`, `-e/--editable`, `--force`, `--python`) |
| `uv tool upgrade NAME… / --all` | Upgrade within the original constraints |
| `uv tool list` | List tools (`--show-paths`, `--show-version-specifiers`, `--show-with`, `--show-python`, `--outdated`) |
| `uv tool audit NAME… / --all` *(preview)* | Vulnerability scan of installed tools |
| `uv tool uninstall NAME…` | Remove a tool |
| `uv tool update-shell` | Add the tool bin dir to `PATH` |
| `uv tool dir [--bin]` | Where tools live |

### pip interface

| Command | Purpose |
|---|---|
| `uv venv [PATH]` | Create a venv (`-p`, `--seed`, `--clear`, `--prompt`, `--system-site-packages`, `--relocatable`) |
| `uv pip install` | Install (`-r`, `-e`, `-c`, `--overrides`, `--group`, `--extra`, `--system`, `--target`, `--prefix`, `--no-deps`, `--require-hashes`, `--torch-backend`, `--dry-run`, `--exact`, `--strict`) |
| `uv pip uninstall` | Uninstall (`-r`, `--system`, `--dry-run`) |
| `uv pip compile` | requirements.in/pyproject → requirements.txt or pylock.toml (`-o`, `--universal`, `--generate-hashes`, `--extra`, `--group`, `--python-version`, `--python-platform`, `--upgrade-package`, `--no-annotate`, `--no-header`) |
| `uv pip sync` | Make an env exactly match a file |
| `uv pip freeze` | Installed packages in requirements format |
| `uv pip list` | Table of installed packages (`--outdated`, `--format json`, `-e`) |
| `uv pip show` | Package details (`-f/--files`) |
| `uv pip tree` | Dependency tree of an environment (`--depth`, `--invert`, `--outdated`) |
| `uv pip check` | Verify dependency compatibility |

### Utility

| Command | Purpose |
|---|---|
| `uv auth login/logout/token/dir` | Manage stored credentials |
| `uv cache dir / size / prune [--ci] / clean [PKG]` | Manage the cache (`size` is preview) |
| `uv self update [VERSION] / version` | Update uv / show the version (`--dry-run`, `--token`, `--short`) |
| `uv generate-shell-completion SHELL` | Completion scripts |
| `uv help [COMMAND]` | Detailed help |

---

## 23. What changed recently (0.10 → 0.13)

If you learned uv in 2025, these are the changes most likely to surprise you:

**uv 0.13 (October 2026)**
- Python **3.15** is the default downloaded version.
- New cache format (expect one-time re-downloads/rebuilds).
- `--require-hashes` inside included constraints files is now honored; editable requirements in constraints files are rejected.
- Native ARM64 Python preferred on Windows ARM.
- Venvs for Python ≥ 3.10 no longer get the `_virtualenv.pth` distutils patch (faster startup).
- Option values like `-c "a.txt b.txt"` are now one path. Repeat the flag for multiple files.

**uv 0.12 (July 2026)**
- `uv init` creates **packaged `src/` projects with `uv_build`** by default.
- Pre-release handling: stable first, then fall back to pre-releases automatically (`if-necessary`).
- `uv run path/to/script.py` discovers the project from the script's location.
- `--require-hashes` in `requirements.txt` is respected; MD5-only hashes rejected.
- `uv venv` requires `--force` to clear non-venv directories.
- `uv check` (ty) gained `--fix`.

**uv 0.11 (March 2026)**
- New networking/TLS stack. `--native-tls` became `--system-certs` (`UV_SYSTEM_CERTS`).
- `uv check` (ty type checking) arrived as a preview command during the 0.11 series and gained `--script`, `--package` and `--all-packages` before 0.12. `uv audit` gained JSON/SARIF output and `--ignore` options.

**uv 0.10 (February 2026)**
- `uv audit` first appeared (preview) late in the 0.10 series.
- `uv venv` requires `--clear` to replace an existing environment.
- Stabilized: `uv python upgrade`, `uv python install --upgrade`, `uv add --bounds`, `uv workspace list/dir`, `extra-build-dependencies`.
- Only one index may set `default = true`; `explicit` indexes must be named.
- `uv format` moved to Ruff 0.15.

---

### Further reading

- uv documentation: <https://docs.astral.sh/uv/>
- uv changelog: <https://github.com/astral-sh/uv/blob/main/CHANGELOG.md>
- Ruff documentation: <https://docs.astral.sh/ruff/>
- ty documentation: <https://docs.astral.sh/ty/>
- Python packaging guide: <https://packaging.python.org/>
- PEP 723 (inline script metadata), PEP 735 (dependency groups), PEP 751 (`pylock.toml`)
