# uv pip interface and requirements.txt interop

Extracted from the uv Field Guide (verified against uv 0.13.1 and Ruff 0.17.0, October 2026).

## The pip-compatible interface: `uv venv` and `uv pip`

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


## Working with vanilla pip users: requirements.txt in both directions

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

**Keep it in sync automatically** with the official pre-commit hook (see §18):

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
