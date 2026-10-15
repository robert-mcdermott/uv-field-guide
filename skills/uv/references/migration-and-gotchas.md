# Migration tables and troubleshooting

Extracted from the uv Field Guide (verified against uv 0.13.1 and Ruff 0.17.0, October 2026).

## Migration cheat sheet

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


## Gotchas and troubleshooting

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


## Recommended team conventions

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
