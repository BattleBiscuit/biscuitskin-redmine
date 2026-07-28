// ==UserScript==
// @name         Redmine Reskin: Issue View
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.14.0
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
/* With the reskin off, the wrappers this script adds around existing markup
   would still alter the stock layout just by being block-level boxes.
   display:contents makes them behave as though they were not there. */
html:not(.rr-active) .rr-title-row,
html:not(.rr-active) .rr-sec-body {
  display: contents !important;
}

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

/* ----------------------------- title + status badge -----------------------------
   The title, the status badge and our blocked toggle are moved into a flex
   row by JS; Redmine leaves them as inline-level siblings, which leaves
   anything sitting beside a large heading baseline-aligned and too low. */
html.rr-active .rr-title-row {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 10px !important;
}
html.rr-active .rr-title-row h2 {
  margin: 0 !important;
}
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
/* The "Beschreibung" heading is redundant — it is the ticket's main body
   text, sitting directly under the title; its position already says so. */
html.rr-active .description > p:first-of-type {
  display: none !important;
}
html.rr-active .description .wiki { color: var(--rr-text) !important; }
html.rr-active .description .wiki pre,
html.rr-active .description .wiki code {
  background: var(--rr-bg) !important;
  border: 1px solid var(--rr-border) !important;
  color: var(--rr-text) !important;
}

/* ---- one surface for the ticket itself ----
   The details block and the description were each their own bordered card
   AND had Redmine's <hr> rules between them — three separations doing the
   job of one. Weld them into a single card (details = upper half,
   description = lower half, one hairline at the seam) and drop the rules.
   The weld classes are applied by JS, not :has(), so that a ticket with no
   description keeps a properly closed and rounded bottom edge. */
html.rr-active #content hr { display: none !important; }

html.rr-active div.issue.details.rr-weld-top {
  border-bottom: none !important;
  border-radius: var(--rr-radius) var(--rr-radius) 0 0 !important;
  margin-bottom: 0 !important;
  box-shadow: none !important;
}
html.rr-active .description.rr-weld-bottom {
  border-radius: 0 0 var(--rr-radius) var(--rr-radius) !important;
  margin-top: 0 !important;
  box-shadow: none !important;
}

/* Subtasks and relations sit flat under that card — separated by space
   rather than another border, since they are clearly their own sections. */
html.rr-active #issue_tree,
html.rr-active #relations {
  margin-top: 22px !important;
}
html.rr-active #issue_tree > p strong,
html.rr-active #relations > p strong {
  color: var(--rr-muted) !important;
  font-size: 12px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.03em !important;
  font-weight: 600 !important;
}

/* ---- collapsible sections (subtasks / related tickets) ----
   Collapsed by default; the heading is the click target and keeps its count
   badge visible so the section still reports what is inside while closed.
   Session-only, like every other toggle here. */
html.rr-active .rr-sec-toggle {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  cursor: pointer !important;
  user-select: none;
}
html.rr-active .rr-sec-toggle::after {
  content: "";
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-right: 1.5px solid var(--rr-muted);
  border-bottom: 1.5px solid var(--rr-muted);
  transform: rotate(45deg);
  transition: transform 0.15s ease;
}
html.rr-active .rr-sec-toggle.rr-sec-closed::after {
  transform: rotate(-45deg);
}
html.rr-active .rr-sec-body.rr-sec-closed { display: none !important; }
html.rr-active .rr-sec-toggle .issues-stat { color: var(--rr-muted) !important; }

/* locally-marked-blocked ticket: ring the details card, matching the board */
html.rr-active div.issue.details.rr-blocked {
  border-color: var(--rr-blocked-line) !important;
  box-shadow: inset 0 0 0 1px var(--rr-blocked) !important;
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

/* =====================================================================
   Progressive disclosure — hide secondary information without losing it.
   All toggles are session-only by design: every page load starts in the
   minimal state, so there is no stale collapsed/expanded state to reason
   about and nothing persisted.
   ===================================================================== */

/* ---- attribute buckets ----
   Each attribute lands in exactly one bucket (no double counting):
   empty value -> rr-attr-empty, else custom field -> rr-attr-custom,
   else always visible. Both hidden buckets are revealed by chips.
   (.rr-chip / .rr-chips / .rr-hidden are shared components owned by the
   global theme script.) */
html.rr-active .rr-attr-empty.rr-collapsed,
html.rr-active .rr-attr-custom.rr-collapsed {
  display: none !important;
}

/* ---- compacted journal entries ----
   Entries that only record property changes (no written comment) keep all
   their text but collapse from a full card to one dense line. Nothing is
   hidden here — it is purely a density change — so the audit trail stays
   readable while real comments stand out as cards. */
html.rr-active .journal.rr-journal-compact {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: baseline !important;
  gap: 4px 8px !important;
  background: none !important;
  border: none !important;
  border-left: 2px solid var(--rr-border) !important;
  border-radius: 0 !important;
  padding: 3px 0 3px 12px !important;
  margin-bottom: 1px !important;
  box-shadow: none !important;
}
html.rr-active .rr-journal-compact .gravatar { display: none !important; }
html.rr-active .rr-journal-compact .journal-header {
  margin: 0 !important;
  gap: 6px !important;
  flex: 0 1 auto !important;
  font-size: 11.5px !important;
}
html.rr-active .rr-journal-compact .journal-info {
  flex: 0 1 auto !important;
  gap: 5px !important;
}
html.rr-active .rr-journal-compact .journal-meta { margin-left: 0 !important; }
/* Fade the action icons in on hover rather than display:none -> flex.
   Toggling display adds the element back into layout on hover, which
   shifts everything after it — visible as a jump. visibility+opacity
   keeps the space reserved at all times, so nothing moves. */
html.rr-active .rr-journal-compact .journal-actions {
  visibility: hidden !important;
  opacity: 0 !important;
  transition: opacity 0.1s ease !important;
}
html.rr-active .rr-journal-compact:hover .journal-actions {
  visibility: visible !important;
  opacity: 1 !important;
}
html.rr-active .rr-journal-compact .journal-content {
  flex: 1 1 auto !important;
  min-width: 0 !important;
}
html.rr-active .rr-journal-compact .journal-details {
  display: inline !important;
  margin: 0 !important;
  padding: 0 !important;
  font-size: 11.5px !important;
}
html.rr-active .rr-journal-compact .journal-details li {
  display: inline !important;
  list-style: none !important;
}
html.rr-active .rr-journal-compact .journal-details li:not(:last-child)::after {
  content: " · ";
  color: var(--rr-muted);
}

/* ---- empty sections (subtasks / relations / watchers) ----
   Collapsed to a single muted line that still carries the section name and
   its "Hinzufügen" action, so nothing becomes unreachable. */
html.rr-active .rr-section-empty {
  display: flex !important;
  align-items: baseline !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
}
html.rr-active .rr-section-empty > p,
html.rr-active .rr-section-empty > h3 {
  order: 1;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  font-size: 12px !important;
}
html.rr-active .rr-section-empty > p strong,
html.rr-active .rr-section-empty > h3 {
  color: var(--rr-muted) !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}
html.rr-active .rr-section-empty .contextual {
  order: 2;
  position: static !important;
  float: none !important;
  margin: 0 !important;
  font-size: 12px !important;
}
html.rr-active .rr-empty-note {
  order: 1;
  color: var(--rr-muted) !important;
  font-size: 12px !important;
  opacity: 0.65;
}
html.rr-active .rr-section-empty form,
html.rr-active .rr-section-empty .issues-stat { display: none !important; }
`;
  GM_addStyle(CSS);
  // See the global theme script for why: re-injecting after
  // DOMContentLoaded guarantees we win any specificity tie against
  // Redmine's own (later-loading) stylesheets.
  document.addEventListener('DOMContentLoaded', () => GM_addStyle(CSS));

  // ---------------------------------------------------------------------
  // Progressive disclosure. Every toggle below is session-only: state
  // lives in the DOM, never in storage, so each page load starts minimal.
  // ---------------------------------------------------------------------

  function chip(label, onToggle) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rr-chip';
    let open = false;
    const render = () => {
      btn.textContent = (open ? '− ' : '+ ') + label;
      btn.classList.toggle('rr-chip-on', open);
    };
    btn.addEventListener('click', () => {
      open = !open;
      onToggle(open);
      render();
    });
    render();
    return btn;
  }

  // An attribute counts as empty when its value cell has no text AND no
  // meaningful embedded content (progress bars, avatars, links, tag spans).
  function isEmptyAttribute(attr) {
    const value = attr.querySelector(':scope > .value');
    if (!value) return false;
    if (value.textContent.trim() !== '') return false;
    return !value.querySelector('img, a, table, input, select, span[style]');
  }

  function enhanceAttributes() {
    // Scope out the edit form: it reuses .attribute/.attributes markup for
    // inputs, and hiding "empty" fields there would break editing.
    const attrs = Array.from(document.querySelectorAll('.attribute')).filter(
      (a) => !a.closest('#update') && !a.dataset.rrBucketed
    );
    if (!attrs.length) return;

    const empty = [];
    const custom = [];
    attrs.forEach((attr) => {
      attr.dataset.rrBucketed = '1';
      if (isEmptyAttribute(attr)) {
        attr.classList.add('rr-attr-empty', 'rr-collapsed');
        empty.push(attr);
      } else if (/\bcf_\d+/.test(attr.className)) {
        attr.classList.add('rr-attr-custom', 'rr-collapsed');
        custom.push(attr);
      }
    });
    if (!empty.length && !custom.length) return;

    const containers = Array.from(document.querySelectorAll('.attributes')).filter(
      (c) => !c.closest('#update')
    );
    const anchor = containers[containers.length - 1];
    if (!anchor) return;

    const bar = document.createElement('div');
    bar.className = 'rr-chips';
    const reveal = (list) => (open) =>
      list.forEach((el) => el.classList.toggle('rr-collapsed', !open));

    if (custom.length) {
      bar.appendChild(
        chip(`${custom.length} weitere Felder`, reveal(custom))
      );
    }
    if (empty.length) {
      bar.appendChild(chip(`${empty.length} leere Felder`, reveal(empty)));
    }
    anchor.insertAdjacentElement('afterend', bar);
  }

  // Journal entries that only log property changes become one dense line;
  // entries containing an actual written note keep their full card.
  function compactJournals() {
    document.querySelectorAll('#history .journal').forEach((j) => {
      const hasNote = j.querySelector('.journal-note');
      const hasDetails = j.querySelector('.journal-details');
      j.classList.toggle('rr-journal-compact', !hasNote && !!hasDetails);
    });
  }

  // The action row (Bearbeiten / Aufwand buchen / ...) is rendered twice —
  // once above the details and once below the history. Keep the first.
  function dedupeActionRows() {
    const rows = Array.from(document.querySelectorAll('#content > .contextual'));
    rows.slice(1).forEach((row) => row.classList.add('rr-hidden'));
  }

  // Sections that have nothing in them still render a full heading block.
  // Collapse each to one muted line, keeping its name and add-link.
  function collapseEmptySections() {
    const sections = [
      { el: document.getElementById('issue_tree'), inner: '.subtasks-wrapper' },
      { el: document.getElementById('relations'), inner: '.relation-issues-wrapper' },
    ];
    sections.forEach(({ el, inner }) => {
      if (!el) return;
      const wrapper = el.querySelector(inner);
      if (!wrapper) return;
      if (wrapper.querySelector('tr') || wrapper.textContent.trim() !== '') return;
      markEmpty(el);
    });

    // Watchers lives in the sidebar but only exists on issue pages.
    const watchers = document.getElementById('watchers');
    if (watchers) {
      const heading = watchers.querySelector('h3');
      if (heading && /\(0\)/.test(heading.textContent)) markEmpty(watchers);
    }
  }

  // ---------------------------------------------------------------------
  // Local-only "blocked" flag, mirroring the My Page board. Stored in
  // localStorage under rr-blocked-issues, never sent to Redmine. These
  // helpers are duplicated from the board script on purpose: userscripts
  // run in isolated scopes, so JS cannot be shared between them — only the
  // CSS is, via the document.
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

  // Redmine leaves the title (h2.inline-block) and the status badge as
  // inline-level siblings, so anything added beside them is baseline-aligned
  // against a large heading and sits noticeably low. Wrapping the three in a
  // flex row aligns them properly instead of patching with vertical-align.
  function buildTitleRow() {
    const title = document.querySelector('#content h2.inline-block');
    if (!title) return null;
    if (title.parentElement.classList.contains('rr-title-row')) {
      return title.parentElement;
    }

    const row = document.createElement('div');
    row.className = 'rr-title-row';
    title.insertAdjacentElement('beforebegin', row);
    row.appendChild(title);

    // absorb the status badge(s) Redmine renders straight after the title
    let node = row.nextElementSibling;
    while (node && node.classList.contains('badge')) {
      const next = node.nextElementSibling;
      row.appendChild(node);
      node = next;
    }
    return row;
  }

  function addBlockedControl() {
    // /issues/5626, /issues/5626?tab=notes, ... — but not /issues/new
    const match = location.pathname.match(/\/issues\/(\d+)/);
    if (!match) return;
    const id = match[1];

    const row = buildTitleRow();
    if (!row || row.dataset.rrBlockCtl) return;
    row.dataset.rrBlockCtl = '1';

    // One self-describing control rather than an icon plus a separate state
    // pill: it is a quiet glyph while unset and grows its own label once set.
    const btn = document.createElement('span');
    btn.className = 'rr-block-toggle';
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;

    const glyph = document.createElement('span');
    glyph.textContent = '⊘';
    const label = document.createElement('span');
    label.className = 'rr-block-label';
    label.textContent = 'Blockiert';
    btn.appendChild(glyph);
    btn.appendChild(label);

    const details = document.querySelector('#content div.issue.details');
    const sync = () => {
      const on = readBlocked().has(id);
      btn.classList.toggle('rr-on', on);
      label.style.display = on ? '' : 'none';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.title = on
        ? 'Blockierung entfernen (nur lokal gespeichert)'
        : 'Als blockiert markieren (nur lokal gespeichert)';
      if (details) details.classList.toggle('rr-blocked', on);
    };

    const toggle = (e) => {
      e.preventDefault();
      setBlocked(id, !readBlocked().has(id));
      sync();
    };
    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') toggle(e);
    });

    row.appendChild(btn);
    sync();
  }

  // Subtasks and related tickets collapse under their own heading, closed by
  // default — they are reference material, not the point of the page. Skips
  // sections already reduced to a one-liner by collapseEmptySections(), and
  // leaves the heading (with its count badge) plus the add-link outside the
  // collapsed body so both stay usable while closed.
  function collapsibleSections() {
    ['issue_tree', 'relations'].forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;
      if (section.classList.contains('rr-section-empty')) return;
      if (section.dataset.rrCollapsible) return;

      const heading = section.querySelector(':scope > p');
      if (!heading) return;

      const body = document.createElement('div');
      body.className = 'rr-sec-body rr-sec-closed';
      let node = heading.nextElementSibling;
      while (node) {
        const next = node.nextElementSibling;
        body.appendChild(node);
        node = next;
      }
      if (!body.childElementCount) return;

      section.dataset.rrCollapsible = '1';
      heading.classList.add('rr-sec-toggle', 'rr-sec-closed');
      heading.after(body);

      heading.addEventListener('click', () => {
        const closed = body.classList.toggle('rr-sec-closed');
        heading.classList.toggle('rr-sec-closed', closed);
      });
    });
  }

  // The details block and the description describe the same object, so they
  // read as one card rather than two. Done here instead of with :has() so a
  // ticket without a description keeps its closed, rounded bottom edge.
  function weldTicketCard() {
    const details = document.querySelector('#content div.issue.details');
    if (!details) return;
    let node = details.nextElementSibling;
    while (node && node.tagName === 'HR') node = node.nextElementSibling;
    if (!node || !node.classList.contains('description')) return;
    details.classList.add('rr-weld-top');
    node.classList.add('rr-weld-bottom');
  }

  function markEmpty(section) {
    if (section.dataset.rrEmptyMarked) return;
    section.dataset.rrEmptyMarked = '1';
    section.classList.add('rr-section-empty');
    const label = section.querySelector(':scope > p > strong') || section.querySelector(':scope > h3');
    if (!label) return;
    const note = document.createElement('span');
    note.className = 'rr-empty-note';
    note.textContent = 'keine';
    (label.tagName === 'H3' ? label : label.parentElement).after(note);
  }

  document.addEventListener('DOMContentLoaded', () => {
    enhanceAttributes();
    compactJournals();
    dedupeActionRows();
    collapseEmptySections();
    // must run after collapseEmptySections(), which marks the sections that
    // should stay as a one-liner instead of becoming collapsible
    collapsibleSections();
    weldTicketCard();
    addBlockedControl();

    // Redmine swaps the history tabs (Historie / Notizen / Eigenschafts-
    // änderungen) in via AJAX, so re-run the journal pass on replacement.
    const history = document.getElementById('history');
    if (history) {
      new MutationObserver(compactJournals).observe(history, {
        childList: true,
        subtree: true,
      });
    }
  });
})();
