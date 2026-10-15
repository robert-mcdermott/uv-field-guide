# Configuration, package indexes, authentication and cache

Extracted from the uv Field Guide (verified against uv 0.13.1 and Ruff 0.17.0, October 2026).

## Configuration and environment variables

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


## Package indexes and authentication

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


## The cache

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
