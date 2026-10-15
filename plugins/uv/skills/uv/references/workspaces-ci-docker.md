# Workspaces, CI/CD, Docker and pre-commit

Extracted from the uv Field Guide (verified against uv 0.13.1 and Ruff 0.17.0, October 2026).

## Workspaces (monorepos)

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


## CI/CD, Docker and pre-commit

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
