# Ruff, uv format, uv check and uv audit

Extracted from the uv Field Guide (verified against uv 0.13.1 and Ruff 0.17.0, October 2026).

## Code quality: Ruff, `uv format`, `uv check` and `uv audit`

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
