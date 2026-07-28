// ==UserScript==
// @name         Redmine Reskin (re-in.de)
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      0.3.0
// @description  Iteratively redesigned look for redmine.re-in.de. Edit, save, reload — repeat.
// @author       Benjamin Seidel
// @match        https://redmine.re-in.de/*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin.user.js
// @downloadURL  https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // CSS — organized by region. Tweak variables in :root first; most
  // changes should be possible without touching the rules below them.
  // Everything except the toggle button itself is gated behind
  // html.rr-active, so flipping that one class fully reverts to stock
  // Redmine (table view included) for A/B comparison.
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

/* Dropdown component (drdn): shared by "Zu einem Projekt springen..." and
   our custom-built "Hinzufügen" replacement below, so both look and
   behave identically — one pill trigger, one floating list panel. */
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

/* Custom "Hinzufügen" dropdown: replaces the native <select> visually so
   it can share the .drdn-content panel styling above; the original
   select/form stays in the DOM (hidden) and still does the real submit. */
.rr-native-select-hidden {
  display: none !important;
}
.rr-block-dropdown {
  position: relative;
  display: inline-block;
}
.rr-block-dropdown .drdn-content {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  z-index: 9999;
  display: none;
}
.rr-block-dropdown.rr-open .drdn-content {
  display: block;
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
   is meaningful in the board view. */
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

/* "Hinzufügen" add-block control: the original label+select form is
   hidden (see rr-native-select-hidden) and replaced by a .rr-block-dropdown
   built in JS, sharing the .drdn-trigger/.drdn-content styling above.
   The h2 that used to clear this float is gone, so clear it here instead. */
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

/* ----------------------------- tables (fallback / non-issue blocks) ----------------------------- */
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

/* Issue tables specifically get replaced by the board view below */
html.rr-active .rr-table-wrapper {
  display: none !important;
}

/* ----------------------------- board view ----------------------------- */
.rr-board-generated {
  display: none;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 6px;
}
html.rr-active .rr-board-generated {
  display: flex;
}
.rr-board-col {
  flex: 0 0 250px;
  min-width: 250px;
  display: flex;
  flex-direction: column;
  background: var(--rr-bg);
  border-radius: var(--rr-radius);
  border: 1px solid var(--rr-border);
}
.rr-board-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 11px;
  font-size: 12px;
  font-weight: 600;
  color: var(--rr-text);
  border-bottom: 2px solid hsl(var(--rr-col-hue, 210), 55%, 55%);
  border-radius: var(--rr-radius) var(--rr-radius) 0 0;
}
.rr-board-col-header span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rr-board-col-count {
  flex: 0 0 auto;
  background: var(--rr-surface);
  border: 1px solid var(--rr-border);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  color: var(--rr-muted);
}
.rr-board-col-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  min-height: 40px;
  border-radius: 0 0 var(--rr-radius) var(--rr-radius);
  transition: background-color 0.1s ease, outline-color 0.1s ease;
  outline: 2px dashed transparent;
  outline-offset: -2px;
}
.rr-board-col-cards.rr-drop-target {
  background: var(--rr-surface);
  outline-color: var(--rr-accent);
}
.rr-card {
  display: block;
  background: var(--rr-surface);
  border: 1px solid var(--rr-border);
  border-left: 3px solid var(--rr-priority-color, var(--rr-border));
  border-radius: 8px;
  padding: 8px 10px;
  text-decoration: none;
  color: var(--rr-text);
  box-shadow: var(--rr-shadow);
  cursor: grab;
  transition: transform 0.08s ease, box-shadow 0.08s ease, opacity 0.1s ease;
}
.rr-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
  color: var(--rr-text);
}
.rr-card.rr-dragging {
  opacity: 0.4;
}
.rr-card.rr-card-pending {
  opacity: 0.6;
  pointer-events: none;
}
.rr-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 4px;
}
.rr-card-id {
  font-size: 11px;
  color: var(--rr-muted);
  font-weight: 600;
}
.rr-card-subject {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  margin-bottom: 6px;
}
.rr-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.rr-card-assignee {
  font-size: 11px;
  color: var(--rr-muted);
  margin-left: auto;
  white-space: nowrap;
}
.rr-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
}

/* ----------------------------- footer ----------------------------- */
html.rr-active #footer {
  display: none !important;
}
`;

  // ---------------------------------------------------------------------
  // Toggle: a single class on <html> gates every rule above, so switching
  // it also flips board vs. stock table without touching the stylesheet.
  // ---------------------------------------------------------------------
  const ROOT = document.documentElement;
  const STORAGE_KEY = 'rr-reskin-enabled';
  if (localStorage.getItem(STORAGE_KEY) !== 'off') {
    ROOT.classList.add('rr-active');
  }
  GM_addStyle(CSS);

  // ---------------------------------------------------------------------
  // Data extraction: read each issue table by its existing td.<field>
  // classes (stable regardless of which columns a block is configured to
  // show / their order), independent of Redmine's own markup structure.
  // ---------------------------------------------------------------------
  function extractTickets(table) {
    const rows = table.querySelectorAll('tbody tr.issue');
    return Array.from(rows).map((tr) => {
      const cell = (cls) => tr.querySelector('td.' + cls);
      const idCell = cell('id');
      const subjectCell = cell('subject');
      const priorityCell = cell('priority');
      const assignedCell = cell('assigned_to');
      const projectCell = cell('project');
      const statusCell = cell('status');
      const trackerCell = cell('tracker');
      const priorityMatch = tr.className.match(/priority-(\d+)/);
      const statusMatch = tr.className.match(/status-(\d+)/);
      return {
        id: idCell ? idCell.textContent.trim() : '',
        url: idCell && idCell.querySelector('a') ? idCell.querySelector('a').getAttribute('href') : '#',
        subject: subjectCell ? subjectCell.textContent.trim() : '(kein Thema)',
        priorityNum: priorityMatch ? parseInt(priorityMatch[1], 10) : null,
        assignedTo: assignedCell ? assignedCell.textContent.trim() : '',
        project: projectCell ? projectCell.textContent.trim() : '',
        status: statusCell ? statusCell.textContent.trim() : 'Ohne Status',
        statusId: statusMatch ? statusMatch[1] : null,
        tracker: trackerCell ? trackerCell.textContent.trim() : '',
      };
    });
  }

  function groupByStatus(tickets) {
    const map = new Map();
    tickets.forEach((t) => {
      if (!map.has(t.status)) map.set(t.status, []);
      map.get(t.status).push(t);
    });
    return map;
  }

  // These columns always render, even with zero tickets; any other status
  // present in the data still gets its own column, same as before.
  const PINNED_STATUSES = ['Next', 'Analyse', 'Entwicklung', 'Warte auf Integration', 'Test'];

  // A pinned column with no tickets has no row to read a status_id from, so
  // we resolve it once via Redmine's own status list API (session-cookie
  // auth, same as the drag-and-drop update call) and cache the result.
  let statusIdByNamePromise = null;
  function getStatusIdByName() {
    if (!statusIdByNamePromise) {
      statusIdByNamePromise = fetch('/issue_statuses.json', { credentials: 'same-origin' })
        .then((res) => (res.ok ? res.json() : { issue_statuses: [] }))
        .then((data) => {
          const map = new Map();
          (data.issue_statuses || []).forEach((s) => map.set(s.name, String(s.id)));
          return map;
        })
        .catch(() => new Map());
    }
    return statusIdByNamePromise;
  }

  // Deterministic color per distinct string (status/project/tracker name),
  // so any workflow/project naming gets consistent, distinguishable colors
  // without us having to hardcode every possible value.
  function hashHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash % 360;
  }

  function badgeColors(str) {
    const hue = hashHue(str || '');
    return {
      background: `hsl(${hue}, 40%, 20%)`,
      color: `hsl(${hue}, 75%, 78%)`,
      borderColor: `hsl(${hue}, 40%, 32%)`,
    };
  }

  // Priority id 1 = lowest .. 5 = highest in a typical Redmine setup;
  // ramp green -> red across that range as a heuristic severity cue.
  function priorityColor(num) {
    if (num == null) return null;
    const clamped = Math.min(Math.max(num, 1), 5);
    const hue = Math.max(130 - (clamped - 1) * 32, 0);
    return `hsl(${hue}, 70%, 55%)`;
  }

  function badge(text, colorSeed) {
    const span = document.createElement('span');
    span.className = 'rr-badge';
    span.textContent = text;
    const c = badgeColors(colorSeed != null ? colorSeed : text);
    span.style.background = c.background;
    span.style.color = c.color;
    span.style.borderColor = c.borderColor;
    return span;
  }

  // Persists a status change via Redmine's own JSON API, using the page's
  // CSRF token + the browser's existing session cookie (same mechanism
  // Redmine's own AJAX features use) — no API key required.
  async function updateIssueStatus(issueId, statusId) {
    const tokenMeta = document.querySelector('meta[name="csrf-token"]');
    try {
      const res = await fetch(`/issues/${issueId}.json`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(tokenMeta ? { 'X-CSRF-Token': tokenMeta.content } : {}),
        },
        body: JSON.stringify({ issue: { status_id: statusId } }),
      });
      if (res.ok) return { ok: true };
      let detail = '';
      try {
        const data = await res.json();
        if (data && data.errors) detail = data.errors.join(', ');
      } catch (e) {
        /* no JSON error body */
      }
      return { ok: false, detail };
    } catch (e) {
      return { ok: false, detail: e.message };
    }
  }

  function refreshColumnCount(col) {
    const count = col.querySelector(':scope > .rr-board-col-header .rr-board-col-count');
    const cards = col.querySelectorAll(':scope > .rr-board-col-cards > .rr-card');
    if (count) count.textContent = String(cards.length);
  }

  function buildCard(ticket) {
    const card = document.createElement('a');
    card.className = 'rr-card';
    card.href = ticket.url;
    card.draggable = true;
    card.dataset.issueId = ticket.id;
    card.dataset.statusId = ticket.statusId || '';
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', ticket.id);
      card.classList.add('rr-dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('rr-dragging'));
    const pColor = priorityColor(ticket.priorityNum);
    if (pColor) card.style.setProperty('--rr-priority-color', pColor);

    const top = document.createElement('div');
    top.className = 'rr-card-top';
    const idSpan = document.createElement('span');
    idSpan.className = 'rr-card-id';
    idSpan.textContent = '#' + ticket.id;
    top.appendChild(idSpan);
    if (ticket.tracker) top.appendChild(badge(ticket.tracker));
    card.appendChild(top);

    const subject = document.createElement('div');
    subject.className = 'rr-card-subject';
    subject.textContent = ticket.subject;
    card.appendChild(subject);

    const meta = document.createElement('div');
    meta.className = 'rr-card-meta';
    if (ticket.project) meta.appendChild(badge(ticket.project));
    if (ticket.assignedTo) {
      const assignee = document.createElement('span');
      assignee.className = 'rr-card-assignee';
      assignee.textContent = ticket.assignedTo;
      meta.appendChild(assignee);
    }
    card.appendChild(meta);

    return card;
  }

  function buildBoard(tickets, statusIdByName) {
    const board = document.createElement('div');
    board.className = 'rr-board-generated';

    const grouped = groupByStatus(tickets);
    const orderedStatuses = [...PINNED_STATUSES];
    const seen = new Set(orderedStatuses);
    for (const status of grouped.keys()) {
      if (!seen.has(status)) {
        orderedStatuses.push(status);
        seen.add(status);
      }
    }

    orderedStatuses.forEach((status) => {
      const items = grouped.get(status) || [];
      const col = document.createElement('div');
      col.className = 'rr-board-col';
      col.style.setProperty('--rr-col-hue', hashHue(status));
      const idFromItems = items[0] && items[0].statusId;
      const idFromMap = statusIdByName && statusIdByName.get(status);
      col.dataset.statusId = idFromItems || idFromMap || '';

      const header = document.createElement('div');
      header.className = 'rr-board-col-header';
      const title = document.createElement('span');
      title.textContent = status;
      title.title = status;
      const count = document.createElement('span');
      count.className = 'rr-board-col-count';
      count.textContent = String(items.length);
      header.appendChild(title);
      header.appendChild(count);
      col.appendChild(header);

      const cardsWrap = document.createElement('div');
      cardsWrap.className = 'rr-board-col-cards';
      items.forEach((t) => cardsWrap.appendChild(buildCard(t)));
      col.appendChild(cardsWrap);

      cardsWrap.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cardsWrap.classList.add('rr-drop-target');
      });
      cardsWrap.addEventListener('dragleave', (e) => {
        if (!cardsWrap.contains(e.relatedTarget)) {
          cardsWrap.classList.remove('rr-drop-target');
        }
      });
      cardsWrap.addEventListener('drop', async (e) => {
        e.preventDefault();
        cardsWrap.classList.remove('rr-drop-target');

        const issueId = e.dataTransfer.getData('text/plain');
        const cardEl = document.querySelector(`.rr-card[data-issue-id="${issueId}"]`);
        if (!cardEl) return;

        const toStatusId = col.dataset.statusId;
        const fromStatusId = cardEl.dataset.statusId;
        const fromCol = cardEl.closest('.rr-board-col');
        if (!toStatusId || fromStatusId === toStatusId) return;

        const originalParent = cardEl.parentElement;
        const originalNext = cardEl.nextSibling;
        cardsWrap.appendChild(cardEl);
        if (fromCol) refreshColumnCount(fromCol);
        refreshColumnCount(col);
        cardEl.classList.add('rr-card-pending');

        const result = await updateIssueStatus(issueId, toStatusId);
        cardEl.classList.remove('rr-card-pending');

        if (result.ok) {
          cardEl.dataset.statusId = toStatusId;
        } else {
          originalParent.insertBefore(cardEl, originalNext);
          if (fromCol) refreshColumnCount(fromCol);
          refreshColumnCount(col);
          alert('Status konnte nicht geändert werden' + (result.detail ? ':\n' + result.detail : ' (Workflow-Regel?).'));
        }
      });

      board.appendChild(col);
    });

    return board;
  }

  // ---------------------------------------------------------------------
  // Wiring: build one board per mypage-box that contains an issue table,
  // and rebuild it whenever Redmine replaces that box's markup (sorting /
  // column-settings save both re-render the block via AJAX).
  // ---------------------------------------------------------------------
  async function processBlock(block) {
    block.querySelectorAll(':scope .rr-board-generated').forEach((el) => el.remove());
    const table = block.querySelector('table.list.issues');
    if (!table) return;
    const wrapper = table.closest('.autoscroll') || table.parentElement;
    wrapper.classList.add('rr-table-wrapper');
    const tickets = extractTickets(table);
    const statusMap = await getStatusIdByName();
    const board = buildBoard(tickets, statusMap);
    wrapper.insertAdjacentElement('afterend', board);
    table.dataset.rrProcessed = '1';
  }

  function setupObserver(block) {
    const observer = new MutationObserver(() => {
      const table = block.querySelector('table.list.issues');
      if (table && !table.dataset.rrProcessed) {
        processBlock(block);
      }
    });
    observer.observe(block, { childList: true, subtree: true });
  }

  function initBoards() {
    document.querySelectorAll('.mypage-box').forEach((block) => {
      processBlock(block);
      setupObserver(block);
    });
  }

  // ---------------------------------------------------------------------
  // "Hinzufügen" add-block control: replace the native <select> with a
  // drdn-styled dropdown (same trigger pill + panel as the project-jump
  // flyout). The original form stays hidden in the DOM and still performs
  // the actual add-block submit — we just drive its value + change event.
  // ---------------------------------------------------------------------
  function buildAddBlockDropdown() {
    const select = document.getElementById('block-select');
    if (!select || select.dataset.rrEnhanced) return;
    select.dataset.rrEnhanced = '1';

    const form = select.closest('form') || select;
    form.classList.add('rr-native-select-hidden');

    const wrap = document.createElement('div');
    wrap.className = 'drdn rr-block-dropdown';

    const trigger = document.createElement('span');
    trigger.className = 'drdn-trigger';
    trigger.textContent = 'Hinzufügen...';
    wrap.appendChild(trigger);

    const content = document.createElement('div');
    content.className = 'drdn-content';
    const items = document.createElement('div');
    items.className = 'drdn-items selection';

    Array.from(select.options).forEach((opt) => {
      if (!opt.value && !opt.textContent.trim()) return;
      if (opt.disabled) {
        const label = document.createElement('span');
        label.className = 'rr-drdn-disabled';
        label.textContent = opt.textContent;
        items.appendChild(label);
        return;
      }
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = opt.textContent;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        wrap.classList.remove('rr-open');
      });
      items.appendChild(a);
    });

    content.appendChild(items);
    wrap.appendChild(content);
    form.insertAdjacentElement('afterend', wrap);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      wrap.classList.toggle('rr-open');
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) wrap.classList.remove('rr-open');
    });
  }

  function setupBlockSelectObserver() {
    const observer = new MutationObserver(() => {
      const select = document.getElementById('block-select');
      if (select && !select.dataset.rrEnhanced) {
        buildAddBlockDropdown();
      }
    });
    observer.observe(document.getElementById('content') || document.body, {
      childList: true,
      subtree: true,
    });
  }

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

    initBoards();
    buildAddBlockDropdown();
    setupBlockSelectObserver();
    consolidateHeaders();
  });
})();
