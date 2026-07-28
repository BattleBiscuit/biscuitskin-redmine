// ==UserScript==
// @name         Redmine Reskin: Core Theme
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.0.0
// @description  Dark theme, consolidated header/nav, and shared component styling for redmine.re-in.de. Other Redmine Reskin scripts (board, add-block) build on top of this — install it first.
// @author       Benjamin Seidel
// @match        https://redmine.re-in.de/*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-core.user.js
// @downloadURL  https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-core.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // CSS — organized by region. Tweak variables in :root first; most
  // changes should be possible without touching the rules below them.
  // Everything except the toggle button itself is gated behind
  // html.rr-active, so flipping that one class fully reverts to stock
  // Redmine for A/B comparison. Other Redmine Reskin scripts (board,
  // add-block) rely on these --rr-* variables and on html.rr-active
  // being set — this script owns both.
  // ---------------------------------------------------------------------
  const CSS = `
:root {
  --rr-bg: #14171c;
  --rr-surface: #1c2128;
  --rr-border: #313742;
  --rr-text: #e6e8eb;
  --rr-muted: #9aa1ac;
  --rr-accent: #6ea8fe;
  --rr-accent-contrast: #0f1115;
  --rr-radius: 10px;
  --rr-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.35);
  --rr-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Toggle button (dev aid, not part of the "design") */
#rr-toggle-btn {
  position: fixed;
  bottom: 12px;
  right: 12px;
  z-index: 99999;
  font-family: var(--rr-font);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--rr-border);
  background: var(--rr-surface);
  color: var(--rr-text);
  box-shadow: var(--rr-shadow);
  cursor: pointer;
  opacity: 0.85;
}
#rr-toggle-btn:hover { opacity: 1; }

/* ----------------------------- base ----------------------------- */
html.rr-active {
  /* tells the browser to use its dark UA styling for things we can't
     reach with CSS alone: native select option lists, scrollbars, etc. */
  color-scheme: dark;
}
html.rr-active body {
  background: var(--rr-bg) !important;
  color: var(--rr-text) !important;
  font-family: var(--rr-font) !important;
}
html.rr-active a { color: var(--rr-accent); }
html.rr-active select option {
  background: var(--rr-bg) !important;
  color: var(--rr-text) !important;
}

/* ----------------------------- consolidated header -----------------------------
   #top-menu and #header used to be two stacked bars. consolidateHeaders()
   (JS below) splits #top-menu's content into a nav group (next to the
   brand, full-height tabs) and a user group (account, pushed right past
   search) inside #header; #top-menu itself is just hidden here. */
html.rr-active #top-menu {
  display: none !important;
}
html.rr-active #header {
  background: var(--rr-surface) !important;
  color: var(--rr-text) !important;
  border-bottom: 1px solid var(--rr-border) !important;
  box-shadow: none !important;
  padding: 0 20px !important;
  min-height: 52px !important;
  display: flex !important;
  align-items: stretch !important;
  gap: 28px !important;
}
html.rr-active #header h1 {
  color: var(--rr-text) !important;
  font-weight: 700 !important;
  font-size: 17px !important;
  letter-spacing: 0.01em !important;
  margin: 0 !important;
  order: 1;
  display: flex !important;
  align-items: center !important;
}

/* primary nav: big, full-height tabs, underlined on hover/active */
html.rr-active .rr-header-nav {
  order: 2;
  display: flex !important;
  align-items: stretch !important;
}
html.rr-active .rr-header-nav ul {
  display: flex !important;
  align-items: stretch !important;
  height: 100%;
  gap: 4px !important;
  list-style: none !important;
  margin: 0 !important;
  padding: 0 !important;
}
html.rr-active .rr-header-nav li {
  list-style: none !important;
  display: flex !important;
}
html.rr-active .rr-header-nav a {
  display: flex !important;
  align-items: center !important;
  padding: 0 12px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: var(--rr-muted) !important;
  border-bottom: 2px solid transparent !important;
  transition: color 0.15s ease, border-color 0.15s ease;
}
html.rr-active .rr-header-nav a:hover {
  color: var(--rr-text) !important;
  border-bottom-color: var(--rr-border) !important;
}
html.rr-active .rr-header-nav a.rr-nav-active {
  color: var(--rr-text) !important;
  border-bottom-color: var(--rr-accent) !important;
}

/* search + project jump, pushed toward the right edge */
html.rr-active #quick-search {
  order: 3;
  align-self: center;
  margin-left: auto !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}
html.rr-active #quick-search input,
html.rr-active #projects-quick-search {
  border: 1px solid var(--rr-border) !important;
  border-radius: 6px !important;
  background: var(--rr-bg) !important;
  color: var(--rr-text) !important;
}

/* account / logged-in-as, separated from search by a divider */
html.rr-active .rr-header-user {
  order: 4;
  align-self: center;
  display: flex !important;
  align-items: center !important;
  gap: 14px !important;
  padding-left: 18px !important;
  border-left: 1px solid var(--rr-border) !important;
  font-size: 12px !important;
}
html.rr-active .rr-header-user ul {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  list-style: none !important;
  margin: 0 !important;
  padding: 0 !important;
}
html.rr-active .rr-header-user li { list-style: none !important; }
html.rr-active .rr-header-user a {
  color: var(--rr-muted) !important;
  transition: color 0.1s ease;
}
html.rr-active .rr-header-user a:hover { color: var(--rr-accent) !important; }
html.rr-active .rr-header-user #loggedas { color: var(--rr-muted) !important; }

/* Dropdown component (drdn): styles "Zu einem Projekt springen..." and is
   reused as-is by the separate add-block script's custom "Hinzufügen"
   dropdown, so both look and behave identically without duplicating CSS —
   one pill trigger, one floating list panel. */
html.rr-active .drdn-trigger {
  display: inline-flex !important;
  align-items: center !important;
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: 999px !important;
  padding: 5px 14px !important;
  font-size: 12px !important;
  color: var(--rr-text) !important;
  cursor: pointer;
}
html.rr-active .drdn-content {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  box-shadow: var(--rr-shadow) !important;
  color: var(--rr-text) !important;
}
html.rr-active .drdn-items strong {
  display: block;
  color: var(--rr-muted) !important;
  background: transparent !important;
  border: none !important;
  padding: 8px 10px 4px !important;
}
html.rr-active .drdn-items a {
  display: block;
  color: var(--rr-text) !important;
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid var(--rr-border) !important;
  padding: 6px 10px !important;
}
html.rr-active .drdn-items a:hover {
  background: var(--rr-bg) !important;
  color: var(--rr-accent) !important;
}
html.rr-active .drdn-items .rr-drdn-disabled {
  display: block;
  color: var(--rr-muted) !important;
  opacity: 0.55;
  border-bottom: 1px solid var(--rr-border) !important;
  padding: 6px 10px !important;
  cursor: default;
}

/* Redmine's own form styling assumes a light page, so give inputs/selects
   a dark-appropriate look wherever they show up (settings panels etc.) */
html.rr-active input[type="text"],
html.rr-active input[type="search"],
html.rr-active input[type="password"],
html.rr-active select,
html.rr-active textarea {
  background: var(--rr-bg) !important;
  color: var(--rr-text) !important;
  border: 1px solid var(--rr-border) !important;
}

/* ----------------------------- layout ----------------------------- */
html.rr-active #main { background: var(--rr-bg) !important; }
html.rr-active #sidebar { background: transparent !important; }
html.rr-active #content {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
/* Redmine draws a dashed border on the sortable drop-target columns
   (#list-top/-left/-right) and on the scrollable table wrapper — neither
   is meaningful once the board script replaces the table view. */
html.rr-active .block-receiver,
html.rr-active .autoscroll {
  border: none !important;
}
html.rr-active #content h2 {
  font-weight: 600 !important;
  color: var(--rr-text) !important;
  border-bottom: none !important;
  margin-bottom: 16px !important;
}

/* Decluttering: things that add no value once you're already on My Page.
   Scoped to body.controller-my.action-page so it doesn't strip headings
   or sidebars from other Redmine pages that reuse these same ids. */
html.rr-active body.controller-my.action-page #content > h2 {
  display: none !important;
}
html.rr-active body.controller-my.action-page #sidebar {
  display: none !important;
}

/* "Hinzufügen" add-block control container: the add-block script hides
   the native form and builds its own dropdown, but this positioning is
   generic layout, not specific to that script, so it lives here. The h2
   that used to clear this float is gone, so clear it here instead. */
html.rr-active body.controller-my.action-page #content > .contextual {
  float: right;
  margin-bottom: 14px;
}
html.rr-active body.controller-my.action-page #my-page {
  clear: both;
}

/* ----------------------------- my-page boxes ----------------------------- */
html.rr-active .mypage-box {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: var(--rr-radius) !important;
  box-shadow: var(--rr-shadow) !important;
  padding: 16px !important;
  margin-bottom: 16px !important;
}
html.rr-active .mypage-box h3 {
  font-size: 14px !important;
  font-weight: 600 !important;
  color: var(--rr-text) !important;
  border-bottom: 1px solid var(--rr-border) !important;
  padding-bottom: 8px !important;
  margin-bottom: 12px !important;
}
html.rr-active .mypage-box h3 a { color: var(--rr-text) !important; }

/* ----------------------------- tables (fallback for blocks the board
   script doesn't touch, e.g. news/documents/calendar) ----------------------------- */
html.rr-active table.list {
  border: none !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  width: 100% !important;
}
html.rr-active table.list th {
  background: transparent !important;
  color: var(--rr-muted) !important;
  font-weight: 600 !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.03em !important;
  border-bottom: 1px solid var(--rr-border) !important;
  padding: 8px 10px !important;
}
html.rr-active table.list td {
  border-bottom: 1px solid var(--rr-border) !important;
  padding: 8px 10px !important;
  font-size: 13px !important;
}
html.rr-active table.list tbody tr:hover td {
  background: var(--rr-bg) !important;
}
html.rr-active table.list tr.odd td,
html.rr-active table.list tr.even td {
  background: transparent !important;
}
html.rr-active table.list tr:last-child td { border-bottom: none !important; }

/* ----------------------------- footer ----------------------------- */
html.rr-active #footer {
  display: none !important;
}
`;

  // ---------------------------------------------------------------------
  // Toggle: a single class on <html> gates every rule above (and every
  // rule in the board/add-block scripts too), so switching it here flips
  // the whole reskin at once without any cross-script messaging needed.
  // ---------------------------------------------------------------------
  const ROOT = document.documentElement;
  const STORAGE_KEY = 'rr-reskin-enabled';
  if (localStorage.getItem(STORAGE_KEY) !== 'off') {
    ROOT.classList.add('rr-active');
  }
  GM_addStyle(CSS);

  // ---------------------------------------------------------------------
  // #top-menu and #header are siblings, so a single flex row across both
  // isn't reachable with CSS alone — split #top-menu's content into a nav
  // group (the <ul> of links, styled as big tabs next to the brand) and a
  // user group (account + logged-in-as, pushed right past search), both
  // appended into #header once; #header's own flex rules lay them out.
  // ---------------------------------------------------------------------
  function markActiveNav(nav) {
    const here = location.pathname;
    nav.querySelectorAll('a[href]').forEach((a) => {
      try {
        if (new URL(a.getAttribute('href'), location.origin).pathname === here) {
          a.classList.add('rr-nav-active');
        }
      } catch (e) {
        /* malformed href, ignore */
      }
    });
  }

  function consolidateHeaders() {
    const topMenu = document.getElementById('top-menu');
    const header = document.getElementById('header');
    if (!topMenu || !header || topMenu.dataset.rrMerged) return;
    topMenu.dataset.rrMerged = '1';

    const nav = document.createElement('nav');
    nav.className = 'rr-header-nav';
    const user = document.createElement('div');
    user.className = 'rr-header-user';

    Array.from(topMenu.children).forEach((child) => {
      (child.tagName === 'UL' ? nav : user).appendChild(child);
    });

    header.appendChild(nav);
    header.appendChild(user);
    markActiveNav(nav);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.id = 'rr-toggle-btn';
    const updateLabel = () => {
      btn.textContent = ROOT.classList.contains('rr-active') ? 'Reskin: ON' : 'Reskin: OFF';
    };
    updateLabel();
    btn.addEventListener('click', () => {
      ROOT.classList.toggle('rr-active');
      localStorage.setItem(STORAGE_KEY, ROOT.classList.contains('rr-active') ? 'on' : 'off');
      updateLabel();
    });
    document.body.appendChild(btn);

    consolidateHeaders();
  });
})();
