// ==UserScript==
// @name         Redmine Reskin: Kanban Board
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.2.0
// @description  Replaces My Page's ticket tables with a drag-and-drop status board. Only runs on /my/page. Requires "Redmine Reskin: Global Theme" for colors/toggle — visuals will be unstyled without it.
// @author       Benjamin Seidel
// @match        https://redmine.re-in.de/my/page*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-board.user.js
// @downloadURL  https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-board.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // CSS uses the --rr-* variables and html.rr-active toggle class defined
  // by the core theme script. Without it installed, the board still
  // works functionally, just unstyled.
  // ---------------------------------------------------------------------
  const CSS = `
/* Issue tables get replaced by the board below */
html.rr-active .rr-table-wrapper {
  display: none !important;
}

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
`;
  GM_addStyle(CSS);
  // See the global theme script for why: re-injecting after
  // DOMContentLoaded guarantees we win any specificity tie against
  // Redmine's own (later-loading) stylesheets.
  document.addEventListener('DOMContentLoaded', () => GM_addStyle(CSS));

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

  // Deterministic color per distinct string (project/tracker name), so any
  // naming gets consistent, distinguishable colors without hardcoding.
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

  document.addEventListener('DOMContentLoaded', initBoards);
})();
