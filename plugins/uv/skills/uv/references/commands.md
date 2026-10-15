# uv command reference (uv 0.13.1)

Extracted from the uv Field Guide (verified against uv 0.13.1 and Ruff 0.17.0, October 2026).

## Complete command reference

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


## What changed recently (0.10 → 0.13)

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
