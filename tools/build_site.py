#!/usr/bin/env python3
"""Build the uv Field Guide website from the Markdown guide.

Run from anywhere:   uv run --no-project --with markdown build_site.py

Reads:   ../uv-guide.md      (the single source of truth for the text)
         ./templates/        (page layout, CSS, JS, favicon)
Writes:  ../docs/            (the finished website; GitHub Pages serves this folder)
"""

import html
import json
import re
import shutil
import zipfile
from pathlib import Path

import markdown

ROOT = Path(__file__).parent
MD = ROOT.parent / "uv-guide.md"
SRC = ROOT / "templates"
OUT = ROOT.parent / "docs"

UV_VERSION = "0.13.1"
RUFF_VERSION = "0.17.0"
UPDATED = "October 2026"

GROUPS = [
    ("Start here", range(1, 4)),
    ("Everyday workflow", range(4, 10)),
    ("pip and interop", range(10, 12)),
    ("Shipping code", range(12, 14)),
    ("Quality and config", range(14, 18)),
    ("Team and reference", range(18, 25)),
]


def slugify(text: str, seen: dict) -> str:
    s = re.sub(r"<[^>]+>", "", text)
    s = html.unescape(s).strip().lower()
    s = re.sub(r"[^\w\- ]", "", s)
    s = s.replace(" ", "-")
    base = s
    n = seen.get(base, 0)
    seen[base] = n + 1
    return base if n == 0 else f"{base}-{n}"


def strip_tags(s: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", " ", s))


def main() -> None:
    text = MD.read_text()

    # Drop the H1 header block and the Markdown table of contents; the site has its own nav.
    start = text.index("## 1. What uv is")
    text = text[start:]

    # Preview badges.
    text = text.replace("*(preview)*", '<span class="badge badge-preview">preview</span>')

    body = markdown.markdown(
        text,
        extensions=["fenced_code", "tables", "sane_lists"],
        output_format="html5",
    )

    # Headings: ids + self-links.
    seen: dict = {}
    headings = []

    def heading(m):
        level, inner = int(m.group(1)), m.group(2)
        hid = slugify(inner, seen)
        headings.append((level, hid, inner))
        return (
            f'<h{level} id="{hid}">{inner}'
            f'<a class="anchor" href="#{hid}" aria-label="Link to this section">#</a></h{level}>'
        )

    body = re.sub(r"<h([23])>(.*?)</h\1>", heading, body)

    # Tables scroll inside their own container.
    body = body.replace("<table>", '<div class="table-wrap"><table>').replace(
        "</table>", "</table></div>"
    )

    # Code blocks get a toolbar with a language label and a copy button.
    def codeblock(m):
        lang = m.group(1) or "text"
        code = m.group(2)
        label = {
            "console": "terminal",
            "bash": "shell",
            "powershell": "powershell",
            "toml": "toml",
            "python": "python",
            "yaml": "yaml",
            "dockerfile": "dockerfile",
            "gitignore": ".gitignore",
            "text": "text",
        }.get(lang, lang)
        hl = {"toml": "ini", "gitignore": "plaintext", "text": "plaintext"}.get(lang, lang)
        return (
            f'<div class="code" data-lang="{lang}">'
            f'<div class="code-bar"><span class="code-lang">{label}</span>'
            f'<button class="copy" type="button" aria-label="Copy code">Copy</button></div>'
            f'<pre><code class="language-{hl}">{code}</code></pre></div>'
        )

    body = re.sub(
        r'<pre><code(?: class="language-([\w-]+)")?>(.*?)</code></pre>', codeblock, body, flags=re.S
    )
    # Bare <pre><code> left over (shouldn't happen) are fine as-is.

    # Callouts.
    def callout(m):
        inner = m.group(1)
        kind = "tip" if re.search(r"<strong>Tip", inner) else "note"
        if re.search(r"Heads up|Gotchas|Default Python", inner):
            kind = "warn"
        return f'<aside class="callout callout-{kind}">{inner}</aside>'

    body = re.sub(r"<blockquote>(.*?)</blockquote>", callout, body, flags=re.S)

    # External links open in a new tab.
    body = re.sub(
        r'<a href="(https?://[^"]+)">', r'<a href="\1" target="_blank" rel="noopener">', body
    )

    # Split into <section>s at each h2, and drop the trailing <hr>s that separated them.
    body = re.sub(r"<hr\s*/?>", "", body)
    parts = re.split(r'(?=<h2 id=")', body)
    sections_html = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        m = re.match(r'<h2 id="([^"]+)">', p)
        sid = m.group(1) if m else "intro"
        sections_html.append(f'<section class="doc-section" data-section="{sid}">\n{p}\n</section>')
    content = "\n".join(sections_html)

    # Navigation tree.
    h2s = []
    for level, hid, inner in headings:
        if level == 2:
            h2s.append({"id": hid, "title": inner, "children": []})
        elif h2s:
            h2s[-1]["children"].append({"id": hid, "title": inner})

    def clean_title(t):
        return re.sub(r"^\d+\.\s*", "", t)

    def num(t):
        m = re.match(r"^(\d+)\.", strip_tags(t))
        return int(m.group(1)) if m else 0

    nav = []
    for gname, rng in GROUPS:
        items = [h for h in h2s if num(h["title"]) in rng]
        lis = []
        for h in items:
            kids = "".join(
                f'<li><a href="#{c["id"]}" data-target="{c["id"]}">{c["title"]}</a></li>'
                for c in h["children"]
            )
            lis.append(
                f'<li class="nav-sec"><a href="#{h["id"]}" data-target="{h["id"]}">'
                f'<span class="nav-num">{num(h["title"]):02d}</span>'
                f'<span>{clean_title(h["title"])}</span></a>'
                + (f'<ul class="nav-sub">{kids}</ul>' if kids else "")
                + "</li>"
            )
        nav.append(
            f'<div class="nav-group"><p class="nav-label">{gname}</p><ul>{"".join(lis)}</ul></div>'
        )
    nav_html = "\n".join(nav)

    # Search index: one entry per h2 and h3 region.
    index = []
    chunks = re.split(r'(?=<h[23] id=")', body)
    current_h2 = ""
    for c in chunks:
        m = re.match(r'<h([23]) id="([^"]+)">(.*?)<a class="anchor"', c, flags=re.S)
        if not m:
            continue
        level, hid, title = int(m.group(1)), m.group(2), re.sub(r"\s+", " ", strip_tags(m.group(3))).strip()
        if level == 2:
            current_h2 = clean_title(title)
        c_body = re.sub(r"<h[23][^>]*>.*?</h[23]>", "", c, count=1, flags=re.S)
        c_body = re.sub(r'<div class="code-bar">.*?</div>', "", c_body, flags=re.S)
        plain = re.sub(r"\s+", " ", strip_tags(c_body)).strip()
        subs = "auth|run|init|add|remove|version|sync|lock|export|tree|format|check|audit|tool|python|pip|venv|build|publish|workspace|cache|self|help"
        found = re.findall(r"\b(uvx(?: [a-z][\w\-@.]*)?|uv (?:" + subs + r")(?: [a-z][\w\-]*)?)", plain)
        cmds = sorted(set(found))[:14]
        index.append(
            {
                "id": hid,
                "t": clean_title(title),
                "s": current_h2 if level == 3 else "",
                "x": plain[:900],
                "c": cmds,
            }
        )

    OUT.mkdir(exist_ok=True)
    (OUT / "assets" / "css").mkdir(parents=True, exist_ok=True)
    (OUT / "assets" / "js").mkdir(parents=True, exist_ok=True)
    shutil.copy(SRC / "site.css", OUT / "assets" / "css" / "site.css")
    shutil.copy(SRC / "site.js", OUT / "assets" / "js" / "site.js")
    shutil.copy(SRC / "favicon.svg", OUT / "favicon.svg")
    (OUT / "assets" / "js" / "search-index.js").write_text(
        "window.UV_SEARCH_INDEX = " + json.dumps(index, ensure_ascii=False) + ";\n"
    )
    (OUT / ".nojekyll").write_text("")
    shutil.copy(MD, OUT / "uv-guide.md")
    # Package the agent skill as a downloadable zip (one top-level "uv/" folder).
    skill_dir = ROOT.parent / "plugins" / "uv" / "skills" / "uv"
    if skill_dir.exists():
        (OUT / "downloads").mkdir(exist_ok=True)
        with zipfile.ZipFile(OUT / "downloads" / "uv-skill.zip", "w", zipfile.ZIP_DEFLATED) as zf:
            for f in sorted(skill_dir.rglob("*")):
                if f.is_file():
                    info = zipfile.ZipInfo(str(Path("uv") / f.relative_to(skill_dir)), date_time=(2026, 1, 1, 0, 0, 0))
                    info.compress_type = zipfile.ZIP_DEFLATED
                    info.external_attr = 0o644 << 16
                    zf.writestr(info, f.read_bytes())

    page = (SRC / "page.html").read_text()
    page = (
        page.replace("{{NAV}}", nav_html)
        .replace("{{CONTENT}}", content)
        .replace("{{UV_VERSION}}", UV_VERSION)
        .replace("{{RUFF_VERSION}}", RUFF_VERSION)
        .replace("{{UPDATED}}", UPDATED)
    )

    head = (SRC / "head.html").read_text()
    full = (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + head
        + '<link rel="icon" href="favicon.svg" type="image/svg+xml">\n'
        '<link rel="stylesheet" href="assets/css/site.css">\n'
        "</head>\n<body>\n"
        + page
        + '\n<script src="assets/js/search-index.js"></script>\n'
        '<script src="assets/js/site.js"></script>\n</body>\n</html>\n'
    )
    (OUT / "index.html").write_text(full)

    print(f"built: {len(h2s)} sections, {len(index)} search entries, {len(full)//1024} KiB html")


if __name__ == "__main__":
    main()
