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

window.TOOLS = [
  {
    slug: "box-shadow",
    name: "Box Shadow",
    href: "app/box-shadow.html",
    tag: "css",
    blurb: "Tune a CSS box-shadow with live preview and copy-ready output.",
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
      </style>
      <header class="bar">
        <a class="brand" href="${INDEX_HREF}"><span class="prompt">&gt;_</span>toolkit</a>
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
  }
}

customElements.define("app-shell", AppShell);
