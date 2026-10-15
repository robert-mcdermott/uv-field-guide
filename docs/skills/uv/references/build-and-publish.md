# Building and publishing packages with uv

Extracted from the uv Field Guide (verified against uv 0.13.1 and Ruff 0.17.0, October 2026).

## Building and publishing packages to PyPI

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
