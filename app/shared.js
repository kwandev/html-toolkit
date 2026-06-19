// shared.js — tool registry + <app-shell> web component. Lives in app/.
// Classic script (no ES modules) so it loads over file:// AND http(s) —
// double-click a tool and it just opens, no server needed.
// window.TOOLS is the single source of truth for the nav and the landing grid:
// add a tool here, then create app/<slug>.html beside this file.

// This script always resolves to <root>/app/shared.js no matter which page
// loads it (index.html in the root, tools in app/), so we derive every link
// from its own URL. ROOT = the project root (parent of app/); hrefs in TOOLS
// are written relative to that root and resolved to absolute URLs below.
const ROOT = new URL("../", document.currentScript.src).href;
const INDEX_HREF = new URL("index.html", ROOT).href;

// Theme: "system" | "light" | "dark". Stored in localStorage and applied to
// <html data-theme> — the design-system CSS has [data-theme] overrides that beat
// the prefers-color-scheme media query. "system" removes the attribute so the OS
// preference (the media query) takes over. This script runs synchronously in the
// <head>, so applying the saved theme here (before <body> paints) avoids a flash.
const THEME_KEY = "toolkit-theme";
const THEME_MODES = ["system", "light", "dark"];
function getTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return THEME_MODES.includes(v) ? v : "system";
  } catch {
    return "system"; // localStorage can be unavailable under file://
  }
}
function applyTheme(mode) {
  const el = document.documentElement;
  if (mode === "light" || mode === "dark") el.setAttribute("data-theme", mode);
  else el.removeAttribute("data-theme"); // system → defer to the media query
}
function setTheme(mode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // ignore — apply for this session even if persistence fails
  }
  applyTheme(mode);
}
applyTheme(getTheme());

window.TOOLS = [
  {
    slug: "text-diff",
    name: "Text Diff",
    href: "app/text-diff.html",
    tag: "text",
    blurb: "Compare two blocks of text line by line - any format, original formatting preserved.",
  },
  {
    slug: "color-contrast",
    name: "Color & Contrast",
    href: "app/color-contrast.html",
    tag: "color",
    blurb: "Convert hex / rgb / hsl / oklch and check WCAG contrast with a live preview.",
  },
  {
    slug: "box-shadow",
    name: "Box Shadow",
    href: "app/box-shadow.html",
    tag: "css",
    blurb: "Tune a CSS box-shadow with live preview and copy-ready output.",
  },
  {
    slug: "favicon-generator",
    name: "Favicon Generator",
    href: "app/favicon-generator.html",
    tag: "web",
    blurb:
      "Upload one SVG → get favicon.ico, apple-touch-icon, PWA icons & manifest, plus a ready-to-paste head snippet.",
  },
  // Add a tool: copy the block above, then create app/<slug>.html beside this file.
];

const TOOLS = window.TOOLS;
// Resolve each tool href (root-relative) to an absolute URL so the landing
// grid links work from the root while the tool files live under app/.
TOOLS.forEach((t) => {
  t.href = new URL(t.href, ROOT).href;
});

class AppShell extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute("tool") || "";
    const meta = TOOLS.find((t) => t.slug === active);
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        /* box-sizing은 상속되지 않고 문서 스타일은 shadow 경계를 못 넘으므로 여기서 직접 선언 */
        :host, *, *::before, *::after { box-sizing: border-box; }
        :host { display: flex; flex-direction: column; min-height: 100vh; }
        .eyebrow { font-family: var(--font-mono); font-size: 0.72rem; color: var(--muted); }
        .bar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; padding: 14px var(--pad);
          border-bottom: 1px solid var(--line);
          background: color-mix(in oklab, var(--surface) 78%, transparent);
          backdrop-filter: blur(8px);
          position: sticky; top: 0; z-index: 10;
        }
        .brand {
          font-family: var(--font-mono); font-weight: 600; font-size: 0.98rem;
          letter-spacing: -0.01em; text-decoration: none; color: var(--ink);
          display: inline-flex; align-items: center; gap: 0.5ch;
        }
        .brand .prompt { color: var(--accent); }
        main { flex: 1; width: 100%; max-width: var(--maxw); margin: 0 auto; padding: var(--pad); }
        .head { margin-bottom: 28px; }
        .head h1 { margin: 4px 0 6px; font-size: clamp(1.5rem, 4vw, 2.1rem); letter-spacing: -0.02em; }
        .head p { margin: 0; color: var(--muted); max-width: 60ch; }
        footer {
          border-top: 1px solid var(--line); padding: 20px var(--pad);
          font-family: var(--font-mono); font-size: 0.74rem; color: var(--muted);
          display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
        }
        footer a { color: var(--muted); }
        :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .theme-switch {
          display: inline-flex; background: var(--surface);
          border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden;
        }
        .theme-switch button {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 30px; padding: 0; border: 0; background: transparent;
          color: var(--muted); cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .theme-switch button + button { border-left: 1px solid var(--line); }
        .theme-switch button:hover { color: var(--ink); }
        .theme-switch button[aria-pressed="true"] { background: var(--accent); color: var(--on-accent); }
        .theme-switch svg { width: 15px; height: 15px; display: block; }
      </style>
      <header class="bar">
        <a class="brand" href="${INDEX_HREF}"><span class="prompt">&gt;_</span>toolkit</a>
        <div class="theme-switch" role="group" aria-label="테마 선택">
          <button type="button" data-mode="system" aria-label="시스템 테마" title="시스템 테마">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg>
          </button>
          <button type="button" data-mode="light" aria-label="라이트 테마" title="라이트 테마">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          </button>
          <button type="button" data-mode="dark" aria-label="다크 테마" title="다크 테마">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          </button>
        </div>
      </header>
      <main>
        ${
          meta
            ? `<div class="head"><div class="eyebrow">// ${meta.tag}</div><h1>${meta.name}</h1><p>${meta.blurb}</p></div>`
            : ""
        }
        <slot></slot>
      </main>
      <footer>
        <span>built in the open · single-file tools</span>
        <a href="https://github.com/kwandev/html-tools" target="_blank" rel="noopener">github →</a>
      </footer>
    `;

    // Theme switch: highlight the active mode, persist + apply on click.
    const sw = root.querySelector(".theme-switch");
    const buttons = sw.querySelectorAll("button");
    const sync = (current = getTheme()) =>
      buttons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === current));
    sync();
    sw.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      setTheme(b.dataset.mode);
      sync(b.dataset.mode);
    });
  }
}

customElements.define("app-shell", AppShell);
