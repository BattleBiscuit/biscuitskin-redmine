// ==UserScript==
// @name         Redmine Reskin: Global Theme
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.13.0
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
  --rr-blocked: hsl(8, 78%, 60%);
  --rr-blocked-soft: hsla(8, 78%, 60%, 0.15);
  --rr-blocked-line: hsla(8, 78%, 60%, 0.5);
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

/* ----------------------------- reskin off -----------------------------
   Everything styled below is gated behind html.rr-active, so switching off
   reverts it. Two things do not revert by themselves and are handled here:

   - Controls we inject (chips, the blocked/priority toggles) are meaningless
     with the reskin off, since whatever they hide is visible again. Keep
     them out of the stock layout entirely.
   - Wrappers we add around existing markup would otherwise change the stock
     layout just by being block-level boxes. display:contents makes them
     behave as though they were not there. */
html:not(.rr-active) .rr-chip,
html:not(.rr-active) .rr-chips,
html:not(.rr-active) .rr-block-btn,
html:not(.rr-active) .rr-prio-btn,
html:not(.rr-active) .rr-block-toggle,
html:not(.rr-active) .rr-blocked-badge,
html:not(.rr-active) .rr-board-toolbar {
  display: none !important;
}
html:not(.rr-active) .rr-side-body {
  display: contents !important;
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

/* ----------------------------- shared disclosure chip -----------------------------
   Small pill button used wherever content is tucked away and needs a way
   back ("+3 leere Felder", "+ alle 30 Tags"). Defined here so every
   page-specific script can reuse it, same as the .drdn-* component. */
html.rr-active .rr-hidden { display: none !important; }
html.rr-active .rr-chips {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 6px !important;
  margin-top: 10px !important;
}
html.rr-active .rr-chip {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  padding: 3px 11px !important;
  border-radius: 999px !important;
  border: 1px solid var(--rr-border) !important;
  background: var(--rr-bg) !important;
  color: var(--rr-muted) !important;
  font-family: var(--rr-font) !important;
  font-size: 11px !important;
  cursor: pointer !important;
  transition: color 0.1s ease, border-color 0.1s ease;
}
html.rr-active .rr-chip:hover {
  color: var(--rr-text) !important;
  border-color: var(--rr-muted) !important;
}
html.rr-active .rr-chip.rr-chip-on {
  color: var(--rr-accent) !important;
  border-color: var(--rr-accent) !important;
}

/* ----------------------------- "blocked" marker -----------------------------
   A purely local annotation: which tickets you consider blocked is kept in
   localStorage, never sent to Redmine. Shared styling lives here so the My
   Page board and the issue view render the same marker.

   NB: the read/write helpers cannot be shared — userscripts run in isolated
   scopes, so each script that needs the state carries its own copy. Only the
   CSS is genuinely shared, via the document. The storage key is
   "rr-blocked-issues": a JSON array of issue ids as strings. */
/* The "Blockiert" badge itself is NOT defined here. It has a single consumer
   (the My Page board), and setting its display property here meant this rule
   — html.rr-active .rr-blocked-badge, specificity 0,2,1 — outranked the
   board's .rr-card .rr-blocked-badge hide rule at 0,2,0, so the badge showed
   on every card. Keeping single-consumer visuals in their owning script
   avoids that class of cross-script fight; only genuinely shared components
   (chips, the control pair below) belong here. */
/* ---- compact card controls ----
   The blocked toggle and the board's local-priority stepper share one box so
   they read as a matched pair rather than two differently-sized glyphs. Both
   are <span role="button">, not <button>: on the My Page board they sit
   inside the card's <a>, where a nested button would be invalid markup — and
   it also sidesteps the global button rule above.

   Borderless with a hover fill, rather than a permanently outlined box: at
   this size a border around a single character reads as cramped. */
html.rr-active .rr-block-btn,
html.rr-active .rr-prio-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 auto !important;
  box-sizing: border-box !important;
  min-width: 20px !important;
  height: 20px !important;
  padding: 0 5px !important;
  background: none !important;
  border: none !important;
  border-radius: 6px !important;
  line-height: 1 !important;
  cursor: pointer !important;
  transition: background-color 0.1s ease, color 0.1s ease, opacity 0.1s ease;
}

html.rr-active .rr-block-btn {
  color: var(--rr-muted) !important;
  font-size: 14px !important;
  opacity: 0.55;
}
html.rr-active .rr-block-btn:hover {
  color: var(--rr-blocked) !important;
  background: var(--rr-bg) !important;
  opacity: 1;
}
html.rr-active .rr-block-btn.rr-on {
  color: var(--rr-blocked) !important;
  opacity: 1;
}

/* Labelled variant, for places with room for one self-describing control
   (the issue view) instead of a separate icon plus state pill: quiet glyph
   while unset, red pill carrying its own label once set. One element, so
   there is nothing to duplicate. */
html.rr-active .rr-block-toggle {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  flex: 0 0 auto !important;
  padding: 0 4px !important;
  border: 1px solid transparent !important;
  border-radius: 999px !important;
  background: none !important;
  color: var(--rr-muted) !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  cursor: pointer !important;
  opacity: 0.55;
  transition: background-color 0.1s ease, color 0.1s ease, opacity 0.1s ease;
}
html.rr-active .rr-block-toggle:hover {
  color: var(--rr-blocked) !important;
  opacity: 1;
}
html.rr-active .rr-block-toggle.rr-on {
  padding: 1px 10px !important;
  background: var(--rr-blocked-soft) !important;
  border-color: var(--rr-blocked-line) !important;
  color: var(--rr-blocked) !important;
  opacity: 1;
}
html.rr-active .rr-block-toggle .rr-block-label {
  font-size: 10px !important;
  font-weight: 700 !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase !important;
}

/* Local priority: a faint dot while unset, a filled chip with the number
   once set. The dot is set larger than the digit so it stays visible. */
html.rr-active .rr-prio-btn {
  color: var(--rr-muted) !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  opacity: 0.5;
}
html.rr-active .rr-prio-btn:not(.rr-set) {
  font-size: 15px !important;
}
html.rr-active .rr-prio-btn:hover {
  color: var(--rr-text) !important;
  background: var(--rr-bg) !important;
  opacity: 1;
}
html.rr-active .rr-prio-btn.rr-set {
  color: var(--rr-accent-contrast) !important;
  background: var(--rr-accent) !important;
  opacity: 1;
}

/* ----------------------------- sidebar -----------------------------
   Present on all project-scoped pages. Section headings become click
   targets that collapse their content; collapsed by default so a page
   starts on its actual content, one click away from the navigation.
   Session-only — nothing persisted, so every load starts minimal. */
html.rr-active #sidebar h3 {
  color: var(--rr-muted) !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.03em !important;
  border-bottom: 1px solid var(--rr-border) !important;
  padding-bottom: 6px !important;
}
html.rr-active #sidebar .queries a { color: var(--rr-text) !important; }
html.rr-active #sidebar a:hover { color: var(--rr-accent) !important; }

html.rr-active .rr-side-toggle {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  cursor: pointer !important;
  user-select: none;
}
html.rr-active .rr-side-toggle::after {
  content: "";
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  margin-bottom: 4px;
  border-right: 1.5px solid var(--rr-muted);
  border-bottom: 1.5px solid var(--rr-muted);
  transform: rotate(45deg);
  transition: transform 0.15s ease;
}
html.rr-active .rr-side-toggle.rr-side-closed::after {
  transform: rotate(-45deg);
}
html.rr-active .rr-side-body.rr-side-closed { display: none !important; }
html.rr-active .rr-tag-hidden { display: none !important; }
html.rr-active .tags-cloud + .rr-chip { margin-top: 6px !important; }

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

/* ----------------------------- formatted text (.wiki) -----------------------------
   .wiki is Redmine's shared wrapper for all rendered text — issue
   descriptions, journal comments, wiki pages, news, forum posts. Styling it
   here rather than per-container is why code blocks in comments were still
   light: the previous rules were scoped to the issue description only. */
html.rr-active .wiki {
  color: var(--rr-text) !important;
}
html.rr-active .wiki pre,
html.rr-active .wiki code,
html.rr-active .wiki tt {
  background: var(--rr-bg) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: 6px !important;
  color: var(--rr-text) !important;
}
html.rr-active .wiki code,
html.rr-active .wiki tt {
  padding: 1px 5px !important;
}
html.rr-active .wiki pre {
  padding: 10px 12px !important;
  overflow-x: auto !important;
}
/* a <code> inside a <pre> would otherwise draw a second box inside the block */
html.rr-active .wiki pre code {
  background: none !important;
  border: none !important;
  padding: 0 !important;
}
html.rr-active .wiki blockquote {
  border-left: 3px solid var(--rr-border) !important;
  background: rgba(255, 255, 255, 0.02) !important;
  color: var(--rr-muted) !important;
  padding: 6px 12px !important;
  margin-left: 0 !important;
}
html.rr-active .wiki table,
html.rr-active .wiki th,
html.rr-active .wiki td {
  border-color: var(--rr-border) !important;
  color: var(--rr-text) !important;
}
html.rr-active .wiki th { background: var(--rr-bg) !important; }
html.rr-active .wiki hr {
  border: none !important;
  border-top: 1px solid var(--rr-border) !important;
}

/* Syntax highlighting: Redmine ships Rouge with a light theme, whose token
   colours are dark and therefore illegible on a dark code block. Remapped by
   token group and scoped under .wiki pre so these very short class names
   (.k, .s, .c ...) cannot leak anywhere else. Best-effort against Rouge's
   default class names — easy to extend if some tokens still read wrong. */
html.rr-active .wiki pre .c,
html.rr-active .wiki pre .c1,
html.rr-active .wiki pre .cm,
html.rr-active .wiki pre .cp,
html.rr-active .wiki pre .cs {
  color: #7d8896 !important;
  font-style: italic !important;
}
html.rr-active .wiki pre .k,
html.rr-active .wiki pre .kc,
html.rr-active .wiki pre .kd,
html.rr-active .wiki pre .kn,
html.rr-active .wiki pre .kp,
html.rr-active .wiki pre .kr,
html.rr-active .wiki pre .kt,
html.rr-active .wiki pre .ow {
  color: #c79bf0 !important;
}
html.rr-active .wiki pre .s,
html.rr-active .wiki pre .s1,
html.rr-active .wiki pre .s2,
html.rr-active .wiki pre .sb,
html.rr-active .wiki pre .sc,
html.rr-active .wiki pre .sd,
html.rr-active .wiki pre .se,
html.rr-active .wiki pre .sh,
html.rr-active .wiki pre .si,
html.rr-active .wiki pre .sr,
html.rr-active .wiki pre .ss,
html.rr-active .wiki pre .sx {
  color: #9dd17b !important;
}
html.rr-active .wiki pre .m,
html.rr-active .wiki pre .mf,
html.rr-active .wiki pre .mh,
html.rr-active .wiki pre .mi,
html.rr-active .wiki pre .mo,
html.rr-active .wiki pre .il {
  color: #f0a26a !important;
}
html.rr-active .wiki pre .nc,
html.rr-active .wiki pre .nf,
html.rr-active .wiki pre .nn,
html.rr-active .wiki pre .nt {
  color: #82aaff !important;
}
html.rr-active .wiki pre .na,
html.rr-active .wiki pre .nv,
html.rr-active .wiki pre .no {
  color: #f0cb6b !important;
}

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

  // Merging the headers is a DOM move, so unlike every CSS rule here it does
  // not undo itself when the reskin is switched off — which left the stock
  // header malformed. Remembering the original children lets restoreHeaders()
  // put them back, so the toggle really does return the page to stock.
  let headerState = null;

  function consolidateHeaders() {
    const topMenu = document.getElementById('top-menu');
    const header = document.getElementById('header');
    if (!topMenu || !header || headerState) return;

    const originalChildren = Array.from(topMenu.children);
    const nav = document.createElement('nav');
    nav.className = 'rr-header-nav';
    const user = document.createElement('div');
    user.className = 'rr-header-user';

    originalChildren.forEach((child) => {
      (child.tagName === 'UL' ? nav : user).appendChild(child);
    });

    header.appendChild(nav);
    header.appendChild(user);
    markActiveNav(nav);
    headerState = { topMenu, nav, user, originalChildren };
  }

  function restoreHeaders() {
    if (!headerState) return;
    const { topMenu, nav, user, originalChildren } = headerState;

    // Re-appending in the original order restores it, since appendChild moves.
    originalChildren.forEach((child) => topMenu.appendChild(child));
    nav.querySelectorAll('.rr-nav-active').forEach((a) => a.classList.remove('rr-nav-active'));
    nav.remove();
    user.remove();
    headerState = null;
  }

  // ---------------------------------------------------------------------
  // Sidebar: turn each section heading into a collapse toggle, closed by
  // default. Sidebar content is navigation (saved queries, taskboards,
  // tag clouds) that is rarely needed while reading the page itself.
  // Session-only: state lives in the DOM, so every load starts closed.
  // ---------------------------------------------------------------------
  function collapsibleSidebar() {
    const wrapper = document.getElementById('sidebar-wrapper');
    if (!wrapper) return;

    wrapper.querySelectorAll('h3').forEach((heading) => {
      if (heading.dataset.rrCollapsible) return;
      // #watchers is handled by the issue script (it collapses the whole
      // block when there are none) — don't fight it for the same heading.
      if (heading.closest('#watchers')) return;

      const body = document.createElement('div');
      body.className = 'rr-side-body';
      // Absorb everything up to the next heading. A sibling that *contains*
      // an h3 (e.g. div.sidebar-tags) starts its own section, so stop there
      // rather than swallowing it into this one.
      let node = heading.nextElementSibling;
      while (node && node.tagName !== 'H3' && !node.querySelector('h3')) {
        const next = node.nextElementSibling;
        body.appendChild(node);
        node = next;
      }
      if (!body.childElementCount) return;

      heading.dataset.rrCollapsible = '1';
      heading.classList.add('rr-side-toggle', 'rr-side-closed');
      body.classList.add('rr-side-closed');
      heading.after(body);

      heading.addEventListener('click', () => {
        const closed = body.classList.toggle('rr-side-closed');
        heading.classList.toggle('rr-side-closed', closed);
      });
    });
  }

  // The tag cloud can run to dozens of entries; show a handful and put the
  // rest behind a chip.
  function clampTagCloud() {
    const LIMIT = 8;
    document.querySelectorAll('.tags-cloud').forEach((cloud) => {
      if (cloud.dataset.rrClamped) return;
      const tags = Array.from(cloud.children).filter((el) => el.tagName === 'SPAN');
      if (tags.length <= LIMIT) return;
      cloud.dataset.rrClamped = '1';

      const rest = tags.slice(LIMIT);
      rest.forEach((tag) => tag.classList.add('rr-tag-hidden'));

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rr-chip';
      let open = false;
      const render = () => {
        btn.textContent = open ? '− weniger' : `+ alle ${tags.length} Tags`;
        btn.classList.toggle('rr-chip-on', open);
      };
      btn.addEventListener('click', () => {
        open = !open;
        rest.forEach((tag) => tag.classList.toggle('rr-tag-hidden', !open));
        render();
      });
      render();
      cloud.after(btn);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Only touch the header when the reskin is actually on, so a page loaded
    // with it off keeps Redmine's stock two-bar header untouched.
    if (ROOT.classList.contains('rr-active')) consolidateHeaders();
    clampTagCloud();
    collapsibleSidebar();

    const btn = document.createElement('button');
    btn.id = 'rr-toggle-btn';
    const updateLabel = () => {
      btn.textContent = ROOT.classList.contains('rr-active') ? 'Reskin: ON' : 'Reskin: OFF';
    };

    // With the reskin on the button sits in the header's account cluster;
    // with it off that cluster no longer exists, so it falls back to
    // floating — the stock header has no sensible slot for it.
    const placeToggle = () => {
      const userGroup = document.querySelector('.rr-header-user');
      if (ROOT.classList.contains('rr-active') && userGroup) {
        btn.classList.remove('rr-floating');
        userGroup.appendChild(btn);
      } else {
        btn.classList.add('rr-floating');
        document.body.appendChild(btn);
      }
    };

    btn.addEventListener('click', () => {
      const turningOn = !ROOT.classList.contains('rr-active');

      // Park the button on <body> first: it currently lives inside
      // .rr-header-user, which restoreHeaders() removes — taking the button
      // with it if we don't move it out beforehand.
      btn.classList.add('rr-floating');
      document.body.appendChild(btn);

      if (turningOn) {
        ROOT.classList.add('rr-active');
        consolidateHeaders();
      } else {
        ROOT.classList.remove('rr-active');
        restoreHeaders();
      }

      localStorage.setItem(STORAGE_KEY, turningOn ? 'on' : 'off');
      updateLabel();
      placeToggle();
    });

    updateLabel();
    placeToggle();
  });
})();
