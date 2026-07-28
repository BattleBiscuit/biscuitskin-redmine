// ==UserScript==
// @name         Redmine Reskin: Global Theme
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.6.0
// @description  Dark theme, consolidated header/nav, and shared component styling that applies on every redmine.re-in.de page. Page-specific scripts (My Page layout, Kanban board, add-block dropdown) build on top of this — install it first.
// @author       Benjamin Seidel
// @match        https://redmine.re-in.de/*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-global.user.js
// @downloadURL  https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-global.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Only rules for elements present on EVERY Redmine page live here:
  // header/top-menu/footer chrome, generic layout containers (#main,
  // #sidebar, #content), generic form controls, and the shared dropdown
  // component. Anything specific to one page (My Page's boxes, the
  // board, the add-block control) lives in its own separately-matched
  // script, so a page-specific bug can't affect pages that don't use it.
  //
  // Everything except the toggle button itself is gated behind
  // html.rr-active, so flipping that one class fully reverts to stock
  // Redmine for A/B comparison. Page-specific scripts rely on these
  // --rr-* variables and on html.rr-active being set — this script owns
  // both.
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

/* Toggle button (dev aid, not part of the "design"). Lives inline in the
   .rr-header-user cluster on the right of the header; .rr-floating is a
   fallback only used if #header couldn't be found. */
#rr-toggle-btn {
  font-family: var(--rr-font);
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--rr-border);
  background: var(--rr-surface);
  color: var(--rr-text);
  cursor: pointer;
  opacity: 0.85;
}
#rr-toggle-btn:hover { opacity: 1; }
#rr-toggle-btn.rr-floating {
  position: fixed;
  bottom: 12px;
  right: 12px;
  z-index: 99999;
  box-shadow: var(--rr-shadow);
}

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
   #top-menu and #header used to be two stacked bars, on every page.
   consolidateHeaders() (JS below) splits #top-menu's content into a nav
   group (next to the brand, full-height tabs) and a user group (account,
   pushed right past search) inside #header; #top-menu itself is hidden. */
html.rr-active #top-menu {
  display: none !important;
}
html.rr-active #header {
  background: var(--rr-surface) !important;
  color: var(--rr-text) !important;
  border-bottom: 1px solid var(--rr-border) !important;
  box-shadow: none !important;
  padding: 0 20px !important;
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: stretch !important;
  /* row-gap 0: the project tab bar becomes a second row (see #main-menu
     below) and must sit flush against the first, not 28px below it. */
  gap: 0 28px !important;
  /* Redmine gives #header a fixed height (5.3em) sized for its own
     absolutely-positioned tab bar; that would clip our second row. */
  height: auto !important;
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
  /* sets the height of the header's first row */
  min-height: 52px !important;
}
html.rr-active #header h1 .breadcrumbs {
  color: var(--rr-muted) !important;
  font-weight: 400 !important;
}
html.rr-active #header h1 .breadcrumbs a { color: var(--rr-muted) !important; }
html.rr-active #header h1 .current-project { color: var(--rr-text) !important; }

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

/* ----------------------------- project tab bar -----------------------------
   #main-menu (Übersicht/Tickets/Wiki/...) is present inside #header on every
   project-scoped page — project overview, issue lists, wiki, and a single
   issue. Since #header is a flex row, #main-menu without an explicit order
   defaults to order:0, i.e. AHEAD of the brand(1)/nav(2)/search(3)/user(4),
   where it consumes the whole row and pushes the actual nav off-screen.
   Give it a high order and full-width basis so it wraps onto its own second
   row beneath them. Negative side margins cancel #header's padding so its
   divider spans the full width.

   position:static is the load-bearing part: Redmine's own CSS sets
   #main-menu to position:absolute; bottom:0 inside #header. Absolutely
   positioned elements are out of flow, so they ignore order/flex-basis
   entirely and just overlay the first row — which is exactly what the
   overlapping header looked like. */
html.rr-active #main-menu {
  position: static !important;
  order: 5 !important;
  flex: 1 0 100% !important;
  margin: 0 -20px !important;
  padding: 0 20px !important;
  border-top: 1px solid var(--rr-border) !important;
  background: none !important;
  width: auto !important;
  height: auto !important;
}

/* Redmine's stock .tabs component — used by #main-menu here and by the
   issue page's #history tabs — draws its own "file folder" look
   (background/border/float per li/a) that clashes with dark mode. Reset it
   explicitly rather than layering colors on top. Direct-child combinators
   only: the "+" tab nests a .menu-children <ul> inside its <li>, and
   descendant selectors would restyle that dropdown as a tab row. */
html.rr-active .tabs,
html.rr-active .tabs > ul {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
}
html.rr-active .tabs > ul {
  display: flex !important;
  flex-wrap: wrap !important;
  list-style: none !important;
  margin: 0 !important;
  padding: 0 !important;
  gap: 4px !important;
}
html.rr-active .tabs > ul > li {
  /* deliberately NOT display:flex — the parent ul is already flex, so each
     li is a flex item automatically. Making the li a flex container turns
     the "+" tab's nested dropdown into a flex item beside the "+" link,
     laying the menu out sideways. */
  float: none !important;
  list-style: none !important;
  margin: 0 !important;
  position: relative !important;
}
html.rr-active .tabs > ul > li > a {
  display: flex !important;
  align-items: center !important;
  padding: 9px 12px !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  color: var(--rr-muted) !important;
  background: none !important;
  border: none !important;
  border-bottom: 2px solid transparent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  text-decoration: none !important;
  white-space: nowrap !important;
  transition: color 0.15s ease, border-color 0.15s ease;
}
html.rr-active .tabs > ul > li > a:hover {
  color: var(--rr-text) !important;
  background: none !important;
  border-bottom-color: var(--rr-border) !important;
}
html.rr-active .tabs > ul > li > a.selected {
  color: var(--rr-text) !important;
  background: none !important;
  border-bottom-color: var(--rr-accent) !important;
  font-weight: 600 !important;
}
html.rr-active .tabs-buttons button {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
}

/* ----- the "+" tab's flyout menu -----
   IMPORTANT: never set 'display' on .menu-children itself. Redmine toggles
   this menu open/closed by changing display (via toggleNewObjectDropdown),
   possibly as an inline style — and an inline style LOSES to a stylesheet
   !important, so forcing display here can make the menu impossible to open.
   Only position/size/skin it, and force the stacking on the <li> children
   instead, which Redmine never touches.

   The children are made to stack defensively: flex-direction:column covers
   the case where something makes the <ul> a flex container, while
   display:block + width:100% + float:none on each <li> covers the inline,
   inline-block, float and flex-item cases. width:max-content stops the menu
   inheriting the full-width sizing of the tab row it lives in. */
html.rr-active #main-menu ul.menu-children {
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  right: auto !important;
  bottom: auto !important;
  z-index: 10000 !important;
  width: max-content !important;
  min-width: 190px !important;
  max-width: none !important;
  flex-direction: column !important;
  align-items: stretch !important;
  flex-wrap: nowrap !important;
  gap: 0 !important;
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: 8px !important;
  box-shadow: var(--rr-shadow) !important;
  list-style: none !important;
  margin: 0 !important;
  padding: 4px !important;
}
html.rr-active #main-menu ul.menu-children > li {
  display: block !important;
  float: none !important;
  width: 100% !important;
  flex: none !important;
  list-style: none !important;
  margin: 0 !important;
  padding: 0 !important;
  position: static !important;
}
html.rr-active #main-menu ul.menu-children > li > a {
  display: block !important;
  width: auto !important;
  color: var(--rr-text) !important;
  background: none !important;
  border: none !important;
  border-radius: 4px !important;
  padding: 6px 10px !important;
  margin: 0 !important;
  font-size: 13px !important;
  text-decoration: none !important;
  white-space: nowrap !important;
}
html.rr-active #main-menu ul.menu-children > li > a:hover {
  background: var(--rr-bg) !important;
  color: var(--rr-accent) !important;
}

/* Dropdown component (drdn): styles "Zu einem Projekt springen..." (present
   in the header on every page) and is reused as-is by the separate
   add-block script's custom "Hinzufügen" dropdown (My Page only), so both
   look and behave identically without duplicating CSS. */
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
   a dark-appropriate look wherever they show up, on any page. Issue edit
   forms in particular use date/number fields too, not just text. */
html.rr-active input[type="text"],
html.rr-active input[type="search"],
html.rr-active input[type="password"],
html.rr-active input[type="date"],
html.rr-active input[type="number"],
html.rr-active input[type="email"],
html.rr-active input[type="url"],
html.rr-active input[type="tel"],
html.rr-active select,
html.rr-active textarea {
  background: var(--rr-bg) !important;
  color: var(--rr-text) !important;
  border: 1px solid var(--rr-border) !important;
}
html.rr-active input[type="checkbox"],
html.rr-active input[type="radio"] {
  accent-color: var(--rr-accent);
}
html.rr-active input[type="submit"],
html.rr-active input[type="button"],
html.rr-active button {
  background: var(--rr-surface) !important;
  color: var(--rr-text) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: 6px !important;
}
html.rr-active input[type="submit"]:hover,
html.rr-active input[type="button"]:hover,
html.rr-active button:hover {
  background: var(--rr-bg) !important;
}

/* jQuery UI datepicker popup — date fields get datepickerFallback()'d
   into this widget, which draws its own light-themed calendar. */
html.rr-active .ui-datepicker {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  box-shadow: var(--rr-shadow) !important;
  color: var(--rr-text) !important;
  padding: 8px !important;
}
html.rr-active .ui-datepicker-header {
  background: none !important;
  border: none !important;
  color: var(--rr-text) !important;
}
html.rr-active .ui-datepicker-title,
html.rr-active .ui-datepicker td,
html.rr-active .ui-datepicker th {
  color: var(--rr-text) !important;
}
html.rr-active .ui-datepicker .ui-state-default {
  background: var(--rr-bg) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
}
html.rr-active .ui-datepicker .ui-state-active,
html.rr-active .ui-datepicker .ui-state-hover {
  background: var(--rr-accent) !important;
  color: var(--rr-accent-contrast) !important;
  border-color: var(--rr-accent) !important;
}
html.rr-active .ui-datepicker select {
  background: var(--rr-bg) !important;
  color: var(--rr-text) !important;
  border: 1px solid var(--rr-border) !important;
}

/* select2 widget (e.g. the Tags field) */
html.rr-active .select2-container .select2-selection {
  background: var(--rr-bg) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
}
html.rr-active .select2-selection__rendered { color: var(--rr-text) !important; }
html.rr-active .select2-selection__choice {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
}
html.rr-active .select2-dropdown {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
}
html.rr-active .select2-search__field {
  background: var(--rr-bg) !important;
  color: var(--rr-text) !important;
  border: 1px solid var(--rr-border) !important;
}
html.rr-active .select2-results__option { color: var(--rr-text) !important; }
html.rr-active .select2-results__option--highlighted {
  background: var(--rr-accent) !important;
  color: var(--rr-accent-contrast) !important;
}
/* select2 3.x (older API, different class names entirely from the 4.x
   ones above — the redmineup plugin bundle appears to use this version) */
html.rr-active .select2-container .select2-choices,
html.rr-active .select2-container .select2-choice {
  background: var(--rr-bg) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
}
html.rr-active .select2-search-choice {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
}
html.rr-active .select2-input {
  background: transparent !important;
  color: var(--rr-text) !important;
}
html.rr-active .select2-drop,
html.rr-active .select2-drop-active {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
  box-shadow: var(--rr-shadow) !important;
}
html.rr-active .select2-results {
  background: none !important;
  color: var(--rr-text) !important;
}
html.rr-active .select2-results .select2-highlighted {
  background: var(--rr-accent) !important;
  color: var(--rr-accent-contrast) !important;
}

/* Custom-field checkbox/radio groups render as a scrollable bordered box
   (Redmine's own emulation of a multi-select), not a plain <input> — the
   generic input rule above never reaches it. */
html.rr-active .check_box_group {
  background: var(--rr-bg) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
}
html.rr-active .check_box_group label {
  color: var(--rr-text) !important;
}

/* ----------------------------- generic layout ----------------------------- */
html.rr-active #main { background: var(--rr-bg) !important; }
html.rr-active #sidebar { background: transparent !important; }
html.rr-active #content {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
/* Redmine draws a dashed border around scrollable table wrappers on many
   pages (issue lists, etc.) — never meaningful for our reskin. */
html.rr-active .autoscroll {
  border: none !important;
}
html.rr-active #content h2 {
  font-weight: 600 !important;
  color: var(--rr-text) !important;
  border-bottom: none !important;
  margin-bottom: 16px !important;
}

/* ----------------------------- generic tables -----------------------------
   table.list is Redmine's shared list-table class, used on issue lists,
   project lists, etc. across many pages — not just My Page. */
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
  // rule in the page-specific scripts too), so switching it here flips
  // the whole reskin at once without any cross-script messaging needed.
  // ---------------------------------------------------------------------
  const ROOT = document.documentElement;
  const STORAGE_KEY = 'rr-reskin-enabled';
  if (localStorage.getItem(STORAGE_KEY) !== 'off') {
    ROOT.classList.add('rr-active');
  }
  GM_addStyle(CSS);
  // @run-at document-start means this <style> lands in <head> before
  // Redmine's own stylesheets do. If any of Redmine's rules also use
  // !important, a tied specificity is resolved by DOM order — and theirs,
  // appended later, would win. Re-injecting once DOMContentLoaded fires
  // (Redmine's stylesheets are already in the DOM by then) guarantees our
  // rules win any such tie, without having to keep escalating selectors.
  document.addEventListener('DOMContentLoaded', () => GM_addStyle(CSS));

  // ---------------------------------------------------------------------
  // #top-menu and #header are siblings, so a single flex row across both
  // isn't reachable with CSS alone — split #top-menu's content into a nav
  // group (the <ul> of links, styled as big tabs next to the brand) and a
  // user group (account + logged-in-as, pushed right past search), both
  // appended into #header once; #header's own flex rules lay them out.
  // Runs on every page since #top-menu/#header exist on every page.
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
    consolidateHeaders();

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

    const userGroup = document.querySelector('.rr-header-user');
    if (userGroup) {
      userGroup.appendChild(btn);
    } else {
      btn.classList.add('rr-floating');
      document.body.appendChild(btn);
    }
  });
})();
