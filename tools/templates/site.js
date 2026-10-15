/* uv Field Guide: theme, navigation, scroll-spy, copy buttons, highlighting and search. */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };

  /* ---------- theme ---------- */
  const saved = store.get("uvguide-theme");
  if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  const isDark = () => {
    const t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  };
  $("#themeToggle").addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store.set("uvguide-theme", next);
  });

  /* ---------- toast ---------- */
  const toast = $("#toast");
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 1600);
  }

  /* ---------- code: console highlighting + hljs ---------- */
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  $$('.code[data-lang="console"] code').forEach((code) => {
    const lines = code.textContent.replace(/\n$/, "").split("\n");
    code.innerHTML = lines
      .map((line) => {
        if (/^\$ /.test(line)) {
          return '<span class="c-prompt">$ </span><span class="c-cmd">' + escapeHtml(line.slice(2)) + "</span>";
        }
        if (/^PS> /.test(line)) {
          return '<span class="c-prompt">PS&gt; </span><span class="c-cmd">' + escapeHtml(line.slice(4)) + "</span>";
        }
        return '<span class="c-out">' + escapeHtml(line) + "</span>";
      })
      .join("\n");
  });
  if (window.hljs) {
    $$('.code:not([data-lang="console"]) pre code').forEach((el) => {
      try { window.hljs.highlightElement(el); } catch (e) { /* leave plain */ }
    });
  }

  /* ---------- copy buttons ---------- */
  function textToCopy(block) {
    const code = $("code", block);
    const raw = code.textContent.replace(/\n$/, "");
    if (block.dataset.lang === "console") {
      const cmds = raw.split("\n").filter((l) => /^(\$|PS>) /.test(l)).map((l) => l.replace(/^(\$|PS>) /, ""));
      if (cmds.length) return cmds.join("\n");
    }
    return raw;
  }
  function selectText(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  $$(".code").forEach((block) => {
    const btn = $(".copy", block);
    btn.addEventListener("click", () => {
      const text = textToCopy(block);
      const done = () => {
        btn.textContent = "Copied";
        btn.classList.add("done");
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => {
          selectText($("code", block));
          showToast("Selected. Press Ctrl/⌘+C to copy");
        });
      } else {
        selectText($("code", block));
        showToast("Selected. Press Ctrl/⌘+C to copy");
      }
    });
  });

  /* ---------- mobile nav drawer ---------- */
  const sidebar = $("#sidebar");
  const scrim = $("#scrim");
  const navToggle = $("#navToggle");
  function setNav(open) {
    sidebar.classList.toggle("open", open);
    scrim.hidden = !open;
    navToggle.setAttribute("aria-expanded", String(open));
  }
  navToggle.addEventListener("click", () => setNav(!sidebar.classList.contains("open")));
  scrim.addEventListener("click", () => setNav(false));
  sidebar.addEventListener("click", (e) => {
    if (e.target.closest("a") && window.matchMedia("(max-width: 900px)").matches) setNav(false);
  });

  /* ---------- scroll spy, on-this-page, progress ---------- */
  const h2s = $$(".doc h2[id]");
  const heads = $$(".doc h2[id], .doc h3[id]");
  const navLinks = new Map($$(".sidebar a[data-target]").map((a) => [a.dataset.target, a]));
  const onpageList = $("#onpageList");
  let currentH2 = null;

  function sectionOf(el) { return el.closest(".doc-section"); }

  function buildOnPage(h2) {
    const sec = sectionOf(h2);
    const subs = $$("h3[id]", sec);
    const items = [h2, ...subs];
    onpageList.innerHTML = items
      .map((h) => {
        const label = h.cloneNode(true);
        const a = label.querySelector(".anchor");
        if (a) a.remove();
        const text = h.tagName === "H2" ? label.textContent.replace(/^\d+\.\s*/, "") : label.textContent;
        return '<li><a href="#' + h.id + '" data-op="' + h.id + '">' + escapeHtml(text) + "</a></li>";
      })
      .join("");
  }

  function activate(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const h2 = el.tagName === "H2" ? el : $("h2[id]", sectionOf(el));
    if (h2 && h2 !== currentH2) {
      currentH2 = h2;
      $$(".nav-sec").forEach((li) => li.classList.remove("open"));
      $$(".sidebar a.active").forEach((a) => a.classList.remove("active"));
      const link = navLinks.get(h2.id);
      if (link) {
        link.classList.add("active");
        link.parentElement.classList.add("open");
        const box = sidebar;
        const r = link.getBoundingClientRect();
        const br = box.getBoundingClientRect();
        if (r.top < br.top + 40 || r.bottom > br.bottom - 40) {
          box.scrollTop += r.top - br.top - br.height / 3;
        }
      }
      buildOnPage(h2);
    }
    $$(".nav-sub a.active, .onpage a.active").forEach((a) => a.classList.remove("active"));
    const sub = navLinks.get(id);
    if (sub && el.tagName === "H3") sub.classList.add("active");
    const op = onpageList.querySelector('[data-op="' + id + '"]');
    if (op) op.classList.add("active");
  }

  function onScroll() {
    const y = window.scrollY + 120;
    let current = heads[0];
    for (const h of heads) {
      if (h.getBoundingClientRect().top + window.scrollY <= y) current = h;
      else break;
    }
    if (current) activate(current.id);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    $("#progressBar").style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + "%";
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { onScroll(); ticking = false; });
    }
  }, { passive: true });
  if (h2s.length) { activate(h2s[0].id); onScroll(); }
  // Web fonts change heading positions; re-apply a deep link once they have loaded.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = id && document.getElementById(id);
      if (el) el.scrollIntoView({ block: "start" });
      onScroll();
    });
  }

  /* ---------- search ---------- */
  const INDEX = (window.UV_SEARCH_INDEX || []).map((e) => ({
    ...e,
    _t: e.t.toLowerCase(),
    _x: e.x.toLowerCase(),
    _c: e.c.join(" ").toLowerCase(),
    _s: (e.s || "").toLowerCase(),
  }));
  const overlay = $("#searchOverlay");
  const input = $("#searchInput");
  const results = $("#searchResults");
  let selected = 0;
  let lastFocus = null;

  function openSearch(prefill) {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    if (typeof prefill === "string") input.value = prefill;
    render(input.value);
    setTimeout(() => input.focus(), 0);
  }
  function closeSearch() {
    overlay.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function score(e, terms, phrase) {
    let s = 0;
    if (phrase.length > 2) {
      if (e._t.includes(phrase)) s += 40;
      if (e._c.includes(phrase)) s += 30;
      if (e._x.includes(phrase)) s += 12;
    }
    for (const t of terms) {
      let hit = false;
      if (e._t.includes(t)) { s += e._t.split(/[^a-z0-9\-]+/).includes(t) ? 14 : 9; hit = true; }
      if (e._c.includes(t)) { s += 6; hit = true; }
      if (e._s.includes(t)) { s += 2; hit = true; }
      if (e._x.includes(t)) {
        const n = e._x.split(t).length - 1;
        s += Math.min(6, 1 + n);
        hit = true;
      }
      if (!hit) return 0;
    }
    return s;
  }

  function highlight(text, terms) {
    let out = escapeHtml(text);
    for (const t of terms) {
      if (t.length < 2) continue;
      const re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      out = out.replace(re, "<mark>$1</mark>");
    }
    return out;
  }

  function snippet(e, terms) {
    const x = e.x;
    const lx = e._x;
    let pos = -1;
    for (const t of terms) { pos = lx.indexOf(t); if (pos >= 0) break; }
    const start = Math.max(0, pos - 60);
    return (start > 0 ? "…" : "") + x.slice(start, start + 180) + (x.length > start + 180 ? "…" : "");
  }

  function render(q) {
    const phrase = q.trim().toLowerCase();
    const terms = phrase.split(/\s+/).filter(Boolean);
    let list;
    if (!terms.length) {
      list = INDEX.filter((e) => !e.s).slice(0, 23);
    } else {
      list = INDEX.map((e) => [score(e, terms, phrase), e])
        .filter(([s]) => s > 0)
        .sort((a, b) => b[0] - a[0])
        .slice(0, 30)
        .map(([, e]) => e);
    }
    selected = 0;
    if (!list.length) {
      results.innerHTML = '<li class="search-empty">No matches for “' + escapeHtml(q) + '”. Try a command name such as <code>sync</code> or <code>export</code>.</li>';
      return;
    }
    results.innerHTML = list
      .map((e, i) =>
        '<li><a href="#' + e.id + '" role="option" aria-selected="' + (i === 0) + '">' +
        (e.s ? '<span class="sr-sec">' + escapeHtml(e.s) + "</span>" : "") +
        '<span class="sr-title">' + highlight(e.t, terms) + "</span>" +
        (terms.length ? '<span class="sr-snip">' + highlight(snippet(e, terms), terms) + "</span>" : "") +
        "</a></li>")
      .join("");
  }

  function move(d) {
    const items = $$("a", results);
    if (!items.length) return;
    items[selected].setAttribute("aria-selected", "false");
    selected = (selected + d + items.length) % items.length;
    items[selected].setAttribute("aria-selected", "true");
    items[selected].scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") {
      const a = $$("a", results)[selected];
      if (a) { e.preventDefault(); a.click(); }
    } else if (e.key === "Escape") { closeSearch(); }
  });
  results.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute("href").slice(1);
    closeSearch();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ block: "start" });
      try { history.replaceState(null, "", "#" + id); } catch (err) { /* ignore */ }
    }
  });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSearch(); });
  $("#searchOpen").addEventListener("click", () => openSearch());
  $("#searchClose").addEventListener("click", closeSearch);

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((e.key === "k" || e.key === "K") && (isMac ? e.metaKey : e.ctrlKey)) {
      e.preventDefault();
      overlay.hidden ? openSearch() : closeSearch();
    } else if (e.key === "/" && !typing && overlay.hidden) {
      e.preventDefault();
      openSearch();
    } else if (e.key === "Escape" && !overlay.hidden) {
      closeSearch();
    }
  });
})();
