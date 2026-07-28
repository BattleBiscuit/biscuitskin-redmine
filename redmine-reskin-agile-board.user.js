// ==UserScript==
// @name         Redmine Reskin: Agile Board
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.1.0
// @description  Dark, decluttered agile board: quiet cards with details behind a toggle, sticky column headers, styled swimlanes. Runs on both the project boards (/<project>/agile/board) and the cross-project board (/agile/board). Requires "Redmine Reskin: Global Theme".
// @author       Benjamin Seidel
// @match        https://redmine.re-in.de/agile/board*
// @match        https://redmine.re-in.de/*/agile/board*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-agile-board.user.js
// @downloadURL  https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-agile-board.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Two @match lines above on purpose: a match pattern's path wildcard
  // cannot swallow the leading slash, so "/*/agile/board" matches
  // /projects/devops/agile/board but NOT the cross-project /agile/board.
  //
  // The board is table.list.issues-board, which means the global theme's
  // generic table.list rules land on it and are wrong here (uppercase 11px
  // headers, per-row borders, row hover). Most of this file's first half is
  // undoing that for the board specifically.
  const CSS = `
/* ----------------------------- board frame ----------------------------- */
html.rr-active .agile-board {
  border: none !important;
  background: none !important;
}
html.rr-active table.list.issues-board {
  border-spacing: 6px !important;
  border-collapse: separate !important;
}

/* ---- reset, then paint ----
   The agile plugin paints light backgrounds and borders on the table cells
   AND on individual card children (p.project renders as a white chip,
   p.name gets an underline, empty cells get a white drop-zone fill). Rather
   than playing whack-a-mole out-specifying each one, clear them all inside
   the board and then paint only what this design wants. Every paint rule
   below is scoped with .agile-board so it is at least as specific as this
   reset and, coming later, wins. */
html.rr-active .agile-board table.issues-board,
html.rr-active .agile-board table.issues-board tr,
html.rr-active .agile-board table.issues-board td,
html.rr-active .agile-board table.issues-board th,
html.rr-active .agile-board .issue-card,
html.rr-active .agile-board .issue-card *:not(input) {
  background: none !important;
  box-shadow: none !important;
}
/* inputs excluded: a checkbox needs its own background and border to look
   like a checkbox at all */
html.rr-active .agile-board .issue-card *:not(input) {
  border: none !important;
}

/* ---- column headers ----
   The plugin puts each status' colour on the th as an inline
   border-bottom. The global theme's table.list th rule overrides that with
   !important, so the width/style are restored here (higher specificity) and
   the colour is re-applied inline-important by JS below. */
html.rr-active .agile-board table.list.issues-board thead th {
  position: sticky !important;
  top: 0 !important;
  z-index: 5 !important;
  background: var(--rr-bg) !important;
  color: var(--rr-text) !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  text-align: left !important;
  padding: 10px 10px 8px !important;
  min-width: 240px !important;
  border-bottom-width: 4px !important;
  border-bottom-style: solid !important;
}
html.rr-active .agile-board table.list.issues-board thead th .count {
  color: var(--rr-muted) !important;
  font-weight: 500 !important;
}
html.rr-active .agile-board table.list.issues-board thead th .hours {
  float: right !important;
  color: var(--rr-muted) !important;
  font-size: 11px !important;
  font-weight: 500 !important;
}

/* ---- cells ---- */
html.rr-active .agile-board table.list.issues-board td {
  border: none !important;
  border-bottom: none !important;
  padding: 0 !important;
  font-size: inherit !important;
}
html.rr-active .agile-board table.list.issues-board td.issue-status-col {
  vertical-align: top !important;
  min-width: 240px !important;
  background: var(--rr-bg) !important;
  border-radius: 8px !important;
  padding: 6px !important;
}
html.rr-active .agile-board table.list.issues-board td.issue-status-col.empty {
  background: rgba(255, 255, 255, 0.015) !important;
}
/* row hover highlighting the entire swimlane is noise on a board */
html.rr-active .agile-board table.list.issues-board tbody tr:hover td,
html.rr-active .agile-board table.list.issues-board tr.odd td,
html.rr-active .agile-board table.list.issues-board tr.even td {
  background: var(--rr-bg) !important;
}
html.rr-active .agile-board table.list.issues-board tr:hover td.issue-status-col.empty,
html.rr-active .agile-board table.list.issues-board tr.odd td.issue-status-col.empty,
html.rr-active .agile-board table.list.issues-board tr.even td.issue-status-col.empty {
  background: rgba(255, 255, 255, 0.015) !important;
}

/* ---- swimlane group rows ---- */
html.rr-active .agile-board table.list.issues-board tr.group.swimlane td {
  background: none !important;
  padding: 18px 2px 6px !important;
}
html.rr-active tr.group.swimlane .name {
  color: var(--rr-text) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
}
html.rr-active tr.group.swimlane .expander { color: var(--rr-muted) !important; }
html.rr-active tr.group.swimlane .badge-count {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-muted) !important;
  border-radius: 999px !important;
  padding: 1px 8px !important;
  font-size: 11px !important;
}
html.rr-active tr.group.swimlane .totals,
html.rr-active tr.group.swimlane .toggle-all {
  color: var(--rr-muted) !important;
  font-size: 11px !important;
}

/* ----------------------------- cards -----------------------------
   The plugin ships pastel card backgrounds via bk-* classes (set per
   tracker/priority in its config). Filled pastels do not work on a dark
   surface, so the colour moves to a left stripe — same language as the My
   Page board's priority stripe — and the card body goes dark. */
html.rr-active .agile-board .issue-card {
  position: relative !important;
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-left: 3px solid var(--rr-card-accent, var(--rr-border)) !important;
  border-radius: 8px !important;
  box-shadow: var(--rr-shadow) !important;
  padding: 9px 10px !important;
  margin: 0 0 6px !important;
  color: var(--rr-text) !important;
  transition: box-shadow 0.1s ease !important;
}
html.rr-active .agile-board .issue-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45), inset 0 0 0 1px var(--rr-muted) !important;
}
html.rr-active .agile-board .issue-card.bk-red { --rr-card-accent: hsl(2, 70%, 55%); }
html.rr-active .agile-board .issue-card.bk-yellow { --rr-card-accent: hsl(45, 75%, 55%); }
html.rr-active .agile-board .issue-card.bk-turquoise { --rr-card-accent: hsl(175, 55%, 48%); }
html.rr-active .agile-board .issue-card.bk-blue { --rr-card-accent: hsl(215, 70%, 60%); }
html.rr-active .agile-board .issue-card.bk-gray { --rr-card-accent: var(--rr-muted); }

html.rr-active .agile-board .issue-card .fields { display: block !important; }

/* project name: context, not the point of the card */
html.rr-active .agile-board .issue-card p.project {
  margin: 0 0 3px !important;
  color: var(--rr-muted) !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
}
/* tracker + id line */
html.rr-active .agile-board .issue-card p.issue-id {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  margin: 0 0 4px !important;
  font-size: 11px !important;
}
html.rr-active .agile-board .issue-card p.issue-id strong {
  color: var(--rr-muted) !important;
  font-weight: 600 !important;
}
html.rr-active .agile-board .issue-card p.issue-id input.checkbox {
  margin: 0 !important;
  transform: scale(0.85);
}
/* story points, e.g. "(13sp)" — worth keeping on the minimal card */
html.rr-active .agile-board .issue-card p.issue-id .hours {
  float: none !important;
  margin-left: auto !important;
  color: var(--rr-muted) !important;
  font-size: 10px !important;
}
/* the subject is the card */
html.rr-active .agile-board .issue-card p.name {
  margin: 0 0 6px !important;
  font-size: 13px !important;
  line-height: 1.35 !important;
}
html.rr-active .agile-board .issue-card p.name a {
  color: var(--rr-text) !important;
  font-weight: 500 !important;
  text-decoration: none !important;
}
html.rr-active .agile-board .issue-card p.name a:hover { color: var(--rr-accent) !important; }

/* assignee footer */
html.rr-active .agile-board .issue-card p.info.assigned-user {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  margin: 0 !important;
  font-size: 11px !important;
  color: var(--rr-muted) !important;
}
html.rr-active .agile-board .issue-card p.info.assigned-user a { color: var(--rr-muted) !important; }
html.rr-active .agile-board .issue-card .gravatar { border-radius: 50% !important; }

/* ---- the verbose secondary blocks ----
   Each card ships 8+ "<b>Label</b>: value" lines (Autor, Zielversion,
   Angelegt, Aktualisiert, Zugehörige Tickets, Shops, Dringlichkeit, Teams,
   time-in-status) plus, separately, a div.sub-issues list of every subtask.
   Together these are the board's biggest source of noise, so both hide
   behind one board-level toggle rather than per card — and via a toggle
   rather than hover, so nothing shifts as the pointer moves. */
html.rr-active .agile-board .issue-card p.attributes,
html.rr-active .agile-board .issue-card .sub-issues {
  display: none !important;
}
html.rr-active.rr-cards-detailed .agile-board .issue-card p.attributes,
html.rr-active.rr-cards-detailed .agile-board .issue-card .sub-issues {
  display: block !important;
  margin: 0 0 6px !important;
  padding-top: 6px !important;
  /* re-asserted: the blanket reset above strips borders from card children */
  border-top: 1px solid var(--rr-border) !important;
  color: var(--rr-muted) !important;
  font-size: 11px !important;
  line-height: 1.5 !important;
}
html.rr-active.rr-cards-detailed .agile-board .issue-card p.attributes b {
  color: var(--rr-muted) !important;
  font-weight: 600 !important;
}
html.rr-active.rr-cards-detailed .agile-board .issue-card p.attributes a,
html.rr-active.rr-cards-detailed .agile-board .issue-card .sub-issues a {
  color: var(--rr-accent) !important;
}
html.rr-active.rr-cards-detailed .agile-board .issue-card .sub-issues ul {
  margin: 0 !important;
  padding-left: 16px !important;
}
html.rr-active.rr-cards-detailed .agile-board .issue-card .sub-issues li {
  list-style: disc !important;
}

/* quick-edit pencil: absolutely positioned so revealing it on hover cannot
   shift the card's content */
html.rr-active .agile-board .issue-card .quick-edit-card {
  position: absolute !important;
  top: 6px !important;
  right: 6px !important;
  opacity: 0 !important;
  transition: opacity 0.1s ease !important;
}
html.rr-active .agile-board .issue-card:hover .quick-edit-card { opacity: 1 !important; }
html.rr-active .agile-board .issue-card .quick-edit-card a { color: var(--rr-muted) !important; }
html.rr-active .agile-board .issue-card .quick-edit-card a:hover { color: var(--rr-text) !important; }

/* ----------------------------- board toolbar ----------------------------- */
html.rr-active #content > form#query_form > h2 {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  flex-wrap: wrap !important;
}
html.rr-active .live_search_field {
  background: var(--rr-bg) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: 6px !important;
  color: var(--rr-text) !important;
  font-size: 12px !important;
  padding: 4px 10px !important;
}
html.rr-active fieldset#filters {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: var(--rr-radius) !important;
  padding: 10px 14px !important;
  margin-bottom: 12px !important;
}
html.rr-active fieldset#filters legend {
  color: var(--rr-muted) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
}
html.rr-active p.query-totals {
  color: var(--rr-muted) !important;
  font-size: 12px !important;
}
html.rr-active p.query-totals .value { color: var(--rr-text) !important; }
html.rr-active #query_form_with_buttons p.buttons {
  display: flex !important;
  gap: 6px !important;
  flex-wrap: wrap !important;
}

/* control bar holding our card-detail toggle */
html.rr-active .rr-board-toolbar {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin: 0 0 10px !important;
}
`;
  GM_addStyle(CSS);
  // See the global theme script: re-injecting after DOMContentLoaded puts
  // our rules after Redmine's own stylesheets so ties resolve our way.
  document.addEventListener('DOMContentLoaded', () => GM_addStyle(CSS));

  const ROOT = document.documentElement;

  // The global theme's `table.list th { border-bottom: ... !important }`
  // outranks the plugin's inline border-bottom-color, which carries each
  // status' colour. Re-applying it inline *with* !important wins, since an
  // important inline declaration beats an important stylesheet one.
  function preserveColumnColors() {
    document.querySelectorAll('table.issues-board thead th').forEach((th) => {
      const color = th.style.borderBottomColor;
      if (color) th.style.setProperty('border-bottom-color', color, 'important');
    });
  }

  // One toggle for every card's attribute block. Session-only: the class
  // lives on <html>, nothing is persisted, so each load starts minimal.
  function addDetailToggle() {
    if (document.querySelector('.rr-board-toolbar')) return;
    const board = document.querySelector('.agile-board');
    if (!board) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rr-chip';
    const render = () => {
      const on = ROOT.classList.contains('rr-cards-detailed');
      btn.textContent = on ? '− Details' : '+ Details';
      btn.classList.toggle('rr-chip-on', on);
    };
    btn.addEventListener('click', () => {
      ROOT.classList.toggle('rr-cards-detailed');
      render();
    });
    render();

    const bar = document.createElement('div');
    bar.className = 'rr-board-toolbar';
    bar.appendChild(btn);

    const totals = document.querySelector('p.query-totals');
    if (totals) {
      totals.insertAdjacentElement('afterend', bar);
    } else {
      board.insertAdjacentElement('beforebegin', bar);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    preserveColumnColors();
    addDetailToggle();

    // The plugin re-renders the board over AJAX (drag/drop, filter apply,
    // live search), which replaces the thead and the cards.
    const board = document.querySelector('.agile-board');
    if (board) {
      new MutationObserver(preserveColumnColors).observe(board, {
        childList: true,
        subtree: true,
      });
    }
  });
})();
