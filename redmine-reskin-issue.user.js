// ==UserScript==
// @name         Redmine Reskin: Issue View
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.7.0
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
  // page (attributes grid, description, history/journals, edit form) —
  // @match already scopes this to /issues/*, so none of it can collide
  // with My Page or any other view.
  //
  // NOTE: the project tab bar (#main-menu), the shared .tabs component,
  // and the header breadcrumbs are NOT here — they appear on every
  // project-scoped page (project overview, wiki, issue lists), so they
  // are owned by the global theme script instead.
  const CSS = `
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

/* Condensed title bar that replaces the subject once you scroll past it
   (sticky-issue-header Stimulus controller). Theming it didn't turn out
   well — simplest fix is to just not show it. */
html.rr-active #sticky-issue-header {
  display: none !important;
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
html.rr-active .journal {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: var(--rr-radius) !important;
  padding: 12px 14px !important;
  margin-bottom: 10px !important;
}

/* .journal-header (an <h4>) carries browser default heading margin/weight,
   and its two children (.journal-info with the avatar+"Von X..." text,
   .journal-meta with the action icons + "#N" link) aren't flex-aligned by
   Redmine's own CSS — reset the heading itself, then lay out each level. */
html.rr-active .journal-header {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  margin: 0 0 8px !important;
  padding: 0 !important;
  border: none !important;
  background: none !important;
  color: var(--rr-muted) !important;
  font-size: 12px !important;
  font-weight: 400 !important;
}
html.rr-active .journal-info {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  flex: 1 1 auto !important;
}
html.rr-active .journal-info .gravatar {
  border-radius: 50% !important;
}
html.rr-active .journal-info a {
  color: var(--rr-text) !important;
  font-weight: 500 !important;
}
html.rr-active .journal-meta {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin-left: auto !important;
}
html.rr-active .journal-actions {
  display: flex !important;
  align-items: center !important;
  gap: 2px !important;
}
html.rr-active .journal-actions a,
html.rr-active .journal-actions .drdn-trigger {
  display: inline-flex !important;
  align-items: center !important;
  padding: 3px 6px !important;
  border-radius: 6px !important;
  color: var(--rr-muted) !important;
  background: none !important;
}
html.rr-active .journal-actions a:hover,
html.rr-active .journal-actions .drdn-trigger:hover {
  background: var(--rr-bg) !important;
  color: var(--rr-text) !important;
}
html.rr-active .journal-link {
  color: var(--rr-muted) !important;
  font-size: 11px !important;
  white-space: nowrap !important;
}

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
  // See the global theme script for why: re-injecting after
  // DOMContentLoaded guarantees we win any specificity tie against
  // Redmine's own (later-loading) stylesheets.
  document.addEventListener('DOMContentLoaded', () => GM_addStyle(CSS));
})();
