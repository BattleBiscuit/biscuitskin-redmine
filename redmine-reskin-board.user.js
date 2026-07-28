// ==UserScript==
// @name         Redmine Reskin: Kanban Board
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.7.0
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
  transition: background-color 0.1s ease, box-shadow 0.1s ease, opacity 0.1s ease;
}
/* No translateY on hover: even though a transform doesn't reflow siblings,
   the card itself visibly shifts under the cursor. Use shadow depth plus an
   inset 1px highlight instead — static, and the inset avoids touching
   border-color, which would otherwise clobber the priority stripe on the
   left edge. */
.rr-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45), inset 0 0 0 1px var(--rr-muted);
  color: var(--rr-text);
}
/* Locally-marked-blocked cards get a ring plus the badge. The ring is an
   inset shadow rather than border-color so the left edge keeps showing the
   priority colour. The badge itself is hidden unless the card is blocked, so
   it occupies no space on a normal card. */
.rr-card .rr-blocked-badge { display: none !important; }
.rr-card.rr-blocked .rr-blocked-badge { display: inline-flex !important; }
.rr-card.rr-blocked {
  box-shadow: inset 0 0 0 1px var(--rr-blocked), var(--rr-shadow);
}
.rr-card.rr-blocked:hover {
  box-shadow: inset 0 0 0 1px var(--rr-blocked), 0 4px 12px rgba(0, 0, 0, 0.45);
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
  /* flex-start, not space-between: .rr-card-controls carries margin-left
     auto to pin the controls right, which reads more predictably once there
     are more than two children */
  justify-content: flex-start;
  gap: 6px;
  margin-bottom: 4px;
}
/* The controls themselves (.rr-prio-btn / .rr-block-btn) are a shared
   component styled by the global theme; only their placement is board
   business. -2px right margin pulls them flush with the card's padding
   edge, since each control carries its own hover-fill padding. */
.rr-card-controls {
  display: flex;
  align-items: center;
  gap: 1px;
  margin-left: auto;
  margin-right: -2px;
  flex: 0 0 auto;
}
/* let a long tracker name give way rather than squeezing the controls */
.rr-card-top .rr-badge {
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
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

  // ---------------------------------------------------------------------
  // Local-only "blocked" flag. Never sent to Redmine — it is your own
  // annotation, kept in localStorage under rr-blocked-issues as a JSON
  // array of issue ids. The issue-view script carries its own copy of
  // these helpers: userscripts run in isolated scopes, so JS cannot be
  // shared between them (only the CSS, via the document).
  // ---------------------------------------------------------------------
  const BLOCKED_KEY = 'rr-blocked-issues';

  function readBlocked() {
    try {
      const raw = JSON.parse(localStorage.getItem(BLOCKED_KEY) || '[]');
      return new Set((Array.isArray(raw) ? raw : []).map(String));
    } catch (e) {
      return new Set();
    }
  }

  function setBlocked(id, on) {
    const set = readBlocked();
    if (on) set.add(String(id));
    else set.delete(String(id));
    try {
      localStorage.setItem(BLOCKED_KEY, JSON.stringify([...set]));
    } catch (e) {
      /* storage full or disabled — the marker just won't persist */
    }
  }

  // ---------------------------------------------------------------------
  // Local-only priority, used to sort cards within a column. Same storage
  // approach as the blocked flag: an id -> 1..5 map under
  // rr-local-priority, never sent to Redmine. Higher sorts nearer the top,
  // so "increment" and "move up" mean the same thing.
  // ---------------------------------------------------------------------
  const PRIO_KEY = 'rr-local-priority';
  const PRIO_MAX = 5;

  function readPriorities() {
    try {
      const raw = JSON.parse(localStorage.getItem(PRIO_KEY) || '{}');
      return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    } catch (e) {
      return {};
    }
  }

  function prioFrom(map, id) {
    const value = map[String(id)];
    return Number.isInteger(value) && value > 0 && value <= PRIO_MAX ? value : 0;
  }

  function getPriority(id) {
    return prioFrom(readPriorities(), id);
  }

  function setPriority(id, value) {
    const all = readPriorities();
    if (value > 0) all[String(id)] = value;
    else delete all[String(id)];
    try {
      localStorage.setItem(PRIO_KEY, JSON.stringify(all));
    } catch (e) {
      /* storage full or disabled — the value just won't persist */
    }
  }

  // Descending by local priority, unset (0) last. Array.prototype.sort is
  // stable, so tickets sharing a priority — and all the unset ones — keep
  // the order Redmine gave them.
  function byLocalPriority(tickets) {
    const map = readPriorities();
    return tickets
      .map((ticket, index) => ({ ticket, index }))
      .sort((a, b) => prioFrom(map, b.ticket.id) - prioFrom(map, a.ticket.id) || a.index - b.index)
      .map((entry) => entry.ticket);
  }

  // Reorder the cards already in a column rather than rebuilding the board,
  // so toggling a priority doesn't flash the whole view.
  function resortColumn(cardsWrap) {
    if (!cardsWrap) return;
    const map = readPriorities();
    Array.from(cardsWrap.querySelectorAll(':scope > .rr-card'))
      .map((el, index) => ({ el, index, prio: prioFrom(map, el.dataset.issueId) }))
      .sort((a, b) => b.prio - a.prio || a.index - b.index)
      .forEach(({ el }) => cardsWrap.appendChild(el));
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
    const blockedBadge = document.createElement('span');
    blockedBadge.className = 'rr-blocked-badge';
    blockedBadge.textContent = 'Blockiert';
    meta.appendChild(blockedBadge);
    if (ticket.project) meta.appendChild(badge(ticket.project));
    if (ticket.assignedTo) {
      const assignee = document.createElement('span');
      assignee.className = 'rr-card-assignee';
      assignee.textContent = ticket.assignedTo;
      meta.appendChild(assignee);
    }
    card.appendChild(meta);

    // Spans rather than buttons: these live inside the card's <a>, where a
    // nested button would be invalid markup.
    const controls = document.createElement('span');
    controls.className = 'rr-card-controls';
    top.appendChild(controls);

    // --- local priority stepper ---
    // One control instead of separate up/down buttons, to keep the card top
    // uncluttered: click raises (wrapping back to unset past the maximum),
    // shift-click lowers.
    const prioBtn = document.createElement('span');
    prioBtn.className = 'rr-prio-btn';
    prioBtn.setAttribute('role', 'button');
    prioBtn.tabIndex = 0;
    controls.appendChild(prioBtn);

    const syncPriority = () => {
      const value = getPriority(ticket.id);
      prioBtn.textContent = value > 0 ? String(value) : '·';
      prioBtn.classList.toggle('rr-set', value > 0);
      prioBtn.dataset.prio = String(value);
      prioBtn.title =
        (value > 0 ? `Lokale Priorität ${value} von ${PRIO_MAX}` : 'Keine lokale Priorität') +
        ' — Klick erhöht, Shift+Klick verringert (nur lokal gespeichert, sortiert die Spalte)';
    };

    const stepPriority = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const current = getPriority(ticket.id);
      const next = e.shiftKey
        ? Math.max(current - 1, 0)
        : current >= PRIO_MAX
          ? 0
          : current + 1;
      setPriority(ticket.id, next);
      syncPriority();
      resortColumn(card.parentElement);
    };
    prioBtn.addEventListener('click', stepPriority);
    prioBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') stepPriority(e);
    });
    syncPriority();

    // --- blocked marker ---
    const blockBtn = document.createElement('span');
    blockBtn.className = 'rr-block-btn';
    blockBtn.setAttribute('role', 'button');
    blockBtn.tabIndex = 0;
    blockBtn.textContent = '⊘';
    controls.appendChild(blockBtn);

    const syncBlocked = () => {
      const on = readBlocked().has(String(ticket.id));
      card.classList.toggle('rr-blocked', on);
      blockBtn.classList.toggle('rr-on', on);
      blockBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      blockBtn.title = on
        ? 'Blockierung entfernen (nur lokal gespeichert)'
        : 'Als blockiert markieren (nur lokal gespeichert)';
    };

    const toggle = (e) => {
      // The card is an <a>; without preventDefault the click navigates to
      // the ticket instead of toggling.
      e.preventDefault();
      e.stopPropagation();
      setBlocked(ticket.id, !readBlocked().has(String(ticket.id)));
      syncBlocked();
    };
    blockBtn.addEventListener('click', toggle);
    blockBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') toggle(e);
    });
    syncBlocked();

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
      // kept so a drop can retry resolving the id by name if it was unknown
      // at render time (see the drop handler)
      col.dataset.statusName = status;

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
      byLocalPriority(items).forEach((t) => cardsWrap.appendChild(buildCard(t)));
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
        if (!issueId) {
          console.warn('[rr-board] drop carried no issue id');
          return;
        }

        // Scope the lookup to the board that was dropped into. My Page shows
        // two issue blocks ("Mir zugewiesene" and "Erstellte Tickets") and the
        // same ticket can appear in both, so a document-wide query could
        // return the copy in the *other* board — whose status already matches
        // the column, so the guard below would bail out and the drag would
        // silently do nothing.
        const boardEl = cardsWrap.closest('.rr-board-generated');
        const selector = `.rr-card[data-issue-id="${issueId}"]`;
        const cardEl =
          (boardEl && boardEl.querySelector(selector)) || document.querySelector(selector);
        if (!cardEl) {
          console.warn('[rr-board] no card found for issue', issueId);
          return;
        }

        // A pinned column with no tickets has no row to take a status id from
        // and depends on /issue_statuses.json having resolved it by name. If
        // that request failed (or the name does not match a real status), the
        // column has no id and dropping here cannot work — say so instead of
        // failing silently.
        let toStatusId = col.dataset.statusId;
        if (!toStatusId) {
          const resolved = (await getStatusIdByName()).get(col.dataset.statusName || '');
          if (resolved) {
            toStatusId = resolved;
            col.dataset.statusId = resolved;
          }
        }
        const fromStatusId = cardEl.dataset.statusId;
        const fromCol = cardEl.closest('.rr-board-col');
        if (!toStatusId) {
          alert(
            'Diese Spalte hat keine bekannte Status-ID — der Status kann nicht geändert werden.\n' +
              'Vermutlich stimmt der Spaltenname nicht mit einem Redmine-Status überein.'
          );
          return;
        }
        if (fromStatusId === toStatusId) return;

        const originalParent = cardEl.parentElement;
        const originalNext = cardEl.nextSibling;
        cardsWrap.appendChild(cardEl);
        // land it at its local-priority position rather than at the bottom
        resortColumn(cardsWrap);
        if (fromCol) refreshColumnCount(fromCol);
        refreshColumnCount(col);
        cardEl.classList.add('rr-card-pending');

        const result = await updateIssueStatus(issueId, toStatusId);
        cardEl.classList.remove('rr-card-pending');

        if (result.ok) {
          cardEl.dataset.statusId = toStatusId;
        } else {
          originalParent.insertBefore(cardEl, originalNext);
          resortColumn(originalParent);
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
