// ==UserScript==
// @name         Redmine Reskin: Issue View
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.0.0
// @description  Card-styled ticket view (attributes, description, history) matching the My Page design. Only runs on /issues/*. Requires "Redmine Reskin: Global Theme" for colors/toggle.
// @author       Benjamin Seidel
// @match        https://redmine.re-in.de/issues/*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-issue.user.js
// @downloadURL  https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-issue.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Everything here targets elements that only exist on an issue's own
  // page (breadcrumb h1, project tab bar, attributes grid, description,
  // history/journals) — @match already scopes this to /issues/*, so none
  // of it can collide with My Page or any other view.
  const CSS = `
/* ----------------------------- project breadcrumb + tabs -----------------------------
   #main-menu (Übersicht/Tickets/Wiki/...) sits below the consolidated
   header (built by the global script) on every project-scoped page; here
   it just gets the same "big underline tab" treatment as the main nav. */
html.rr-active #header h1 .breadcrumbs {
  color: var(--rr-muted) !important;
  font-weight: 400 !important;
}
html.rr-active #header h1 .breadcrumbs a { color: var(--rr-muted) !important; }
html.rr-active #header h1 .current-project {
  color: var(--rr-text) !important;
}

html.rr-active #main-menu.tabs {
  background: var(--rr-surface) !important;
  border-bottom: 1px solid var(--rr-border) !important;
  padding: 0 20px !important;
}
html.rr-active #main-menu.tabs ul {
  display: flex !important;
  gap: 4px !important;
}
html.rr-active #main-menu.tabs a {
  display: flex !important;
  align-items: center !important;
  padding: 9px 12px !important;
  font-size: 13px !important;
  color: var(--rr-muted) !important;
  border-bottom: 2px solid transparent !important;
  transition: color 0.15s ease, border-color 0.15s ease;
}
html.rr-active #main-menu.tabs a:hover {
  color: var(--rr-text) !important;
  border-bottom-color: var(--rr-border) !important;
}
html.rr-active #main-menu.tabs a.selected {
  color: var(--rr-text) !important;
  border-bottom-color: var(--rr-accent) !important;
  font-weight: 600 !important;
}
html.rr-active #main-menu .menu-children {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  box-shadow: var(--rr-shadow) !important;
}
html.rr-active #main-menu .menu-children a {
  color: var(--rr-text) !important;
  border-bottom: none !important;
}
html.rr-active #main-menu .menu-children a:hover {
  background: var(--rr-bg) !important;
}

/* ----------------------------- sidebar content ----------------------------- */
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

/* ----------------------------- action icons row ----------------------------- */
html.rr-active #content > .contextual {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 4px !important;
  margin-bottom: 10px !important;
}
html.rr-active #content > .contextual > a,
html.rr-active #content > .contextual > span.drdn > .drdn-trigger {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  padding: 5px 10px !important;
  border-radius: 6px !important;
  color: var(--rr-muted) !important;
  transition: background-color 0.1s ease, color 0.1s ease;
}
html.rr-active #content > .contextual > a:hover,
html.rr-active #content > .contextual > span.drdn > .drdn-trigger:hover {
  background: var(--rr-surface) !important;
  color: var(--rr-text) !important;
}

/* ----------------------------- title + status badge ----------------------------- */
html.rr-active #content h2.inline-block {
  color: var(--rr-text) !important;
  margin-bottom: 0 !important;
}
html.rr-active .badge {
  border-radius: 999px !important;
  padding: 2px 10px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  border: 1px solid transparent !important;
}
html.rr-active .badge-status-open {
  background: hsla(140, 60%, 45%, 0.16) !important;
  color: hsl(140, 65%, 68%) !important;
  border-color: hsla(140, 60%, 45%, 0.4) !important;
}
html.rr-active .badge-status-closed,
html.rr-active .badge-status-locked {
  background: var(--rr-bg) !important;
  color: var(--rr-muted) !important;
  border-color: var(--rr-border) !important;
}

/* ----------------------------- issue details card ----------------------------- */
html.rr-active div.issue.details {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: var(--rr-radius) !important;
  box-shadow: var(--rr-shadow) !important;
  padding: 16px !important;
  margin-top: 10px !important;
}
html.rr-active div.issue.details .subject h3 {
  color: var(--rr-text) !important;
  font-size: 16px !important;
}
html.rr-active div.issue.details .subject p {
  color: var(--rr-muted) !important;
}
html.rr-active div.issue.details .subject a {
  color: var(--rr-accent) !important;
}
html.rr-active p.author {
  color: var(--rr-muted) !important;
  font-size: 12px !important;
}

/* attributes grid: label muted, value prominent */
html.rr-active .attributes .attribute {
  padding: 4px 0 !important;
}
html.rr-active .attributes .attribute .label {
  color: var(--rr-muted) !important;
  font-size: 12px !important;
  display: inline-block !important;
  min-width: 130px !important;
}
html.rr-active .attributes .attribute .value {
  color: var(--rr-text) !important;
  font-weight: 500 !important;
}
html.rr-active table.progress {
  background: var(--rr-bg) !important;
  border-radius: 4px !important;
  overflow: hidden !important;
  border: none !important;
}
html.rr-active table.progress .closed { background: var(--rr-accent) !important; }
html.rr-active table.progress .todo { background: transparent !important; }
html.rr-active table.progress td { border: none !important; }
html.rr-active p.percent {
  color: var(--rr-muted) !important;
  font-size: 11px !important;
}

/* ----------------------------- description ----------------------------- */
html.rr-active .description {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: var(--rr-radius) !important;
  padding: 16px !important;
  margin-top: 14px !important;
}
html.rr-active .description > p > strong {
  color: var(--rr-muted) !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.03em !important;
}
html.rr-active .description .wiki { color: var(--rr-text) !important; }
html.rr-active .description .wiki pre,
html.rr-active .description .wiki code {
  background: var(--rr-bg) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
}

/* hr dividers between description/subtasks/relations sections */
html.rr-active #content hr {
  border: none !important;
  border-top: 1px solid var(--rr-border) !important;
  margin: 18px 0 !important;
}
html.rr-active #issue_tree > p strong,
html.rr-active #relations > p strong {
  color: var(--rr-text) !important;
  font-size: 13px !important;
}

/* ----------------------------- history / journals ----------------------------- */
html.rr-active #history .tabs ul {
  display: flex !important;
  gap: 4px !important;
}
html.rr-active #history .tabs a {
  display: inline-flex !important;
  padding: 7px 12px !important;
  font-size: 12px !important;
  color: var(--rr-muted) !important;
  border-bottom: 2px solid transparent !important;
}
html.rr-active #history .tabs a:hover { color: var(--rr-text) !important; }
html.rr-active #history .tabs a.selected {
  color: var(--rr-text) !important;
  border-bottom-color: var(--rr-accent) !important;
  font-weight: 600 !important;
}

html.rr-active .journal {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: var(--rr-radius) !important;
  padding: 12px 14px !important;
  margin-bottom: 10px !important;
}
html.rr-active .journal-header {
  color: var(--rr-muted) !important;
  font-size: 12px !important;
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 6px !important;
}
html.rr-active .journal-header a { color: var(--rr-text) !important; }
html.rr-active .journal-link { color: var(--rr-muted) !important; margin-left: auto !important; }
html.rr-active .journal-details {
  color: var(--rr-muted) !important;
  font-size: 13px !important;
}
html.rr-active .journal-details i { color: var(--rr-text) !important; font-style: normal !important; }
html.rr-active .journal-content .wiki { color: var(--rr-text) !important; }

/* ----------------------------- edit form boxes ----------------------------- */
html.rr-active fieldset.tabular,
html.rr-active #update .box,
html.rr-active #log_time,
html.rr-active #add_notes,
html.rr-active #add_attachments {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: var(--rr-radius) !important;
  padding: 14px !important;
  margin-bottom: 14px !important;
}
html.rr-active fieldset.tabular legend {
  color: var(--rr-text) !important;
  font-weight: 600 !important;
  padding: 0 6px !important;
}
`;
  GM_addStyle(CSS);
})();
