// ==UserScript==
// @name         Redmine Reskin: New Ticket Form
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.0.0
// @description  Card-styled ticket creation form: label-above-field grid, the four fields that matter up front, everything optional tucked away, sticky Anlegen bar. Runs on the new-issue and copy-issue forms. Requires "Redmine Reskin: Global Theme" for colors/toggle.
// @author       Benjamin Seidel
// @match        https://redmine.re-in.de/issues/new*
// @match        https://redmine.re-in.de/projects/*/issues/new*
// @match        https://redmine.re-in.de/issues/*/copy*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-new-issue.user.js
// @downloadURL  https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-new-issue.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Everything here is scoped to #issue-form, the create form's own id. That
  // matters more than usual: the @match patterns for the new and copy forms
  // are subsets of the issue script's /issues/*, so both scripts load on this
  // page. The issue script's JS finds nothing to do here (the create form has
  // no .attribute pairs, no .contextual row, no #history), and its CSS keys
  // off selectors this form doesn't use — but staying inside #issue-form keeps
  // it that way, and keeps the edit form (#update) untouched too.
  //
  // The one structural rule for the JS below: never move an element across the
  // #all_attributes boundary. Redmine re-renders that container from scratch
  // whenever project/tracker/status changes (updateIssueFrom -> new.js), so
  // anything moved out of it comes back as a duplicate, and anything moved
  // into it is destroyed on the next change. Wrapping *within* the container is
  // fine — the MutationObserver at the bottom re-applies it.
  const CSS = `
/* With the reskin off, the wrappers this script adds would still alter the
   stock layout just by being block-level boxes, and the controls it injects
   would sit there unstyled. display:contents makes the wrappers behave as
   though they were not there; the injected controls hide entirely. */
html:not(.rr-active) .rr-nt-primary,
html:not(.rr-active) .rr-nt-actions {
  display: contents !important;
}
html:not(.rr-active) .rr-nt-injected {
  display: none !important;
}

/* ----------------------------- the form as one card -----------------------------
   A create form is a reading-width task, not a dashboard: capped so the
   field grid below settles at three columns on a wide screen instead of
   smearing eight inputs across 1900px. */
html.rr-active #issue-form {
  max-width: 1040px !important;
}
html.rr-active #issue-form .box {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: var(--rr-radius) !important;
  box-shadow: var(--rr-shadow) !important;
  padding: 18px !important;
  margin-bottom: 0 !important;
}

/* ---- one grid for every field ----
   Redmine floats the fields into two fixed 49% columns (.splitcontent) and
   floats each label into a 180px gutter beside its input. Both metrics are
   tuned for the stock full-width page: inside our narrower card the gutter
   squeezes the longer German labels (Zugewiesen an, Geschätzter Aufwand,
   custom fields) into an ellipsis, leaving inputs with no readable name.
   So: dissolve the column wrappers, put every field in one responsive grid,
   and stack each pair label-above-input — the label then has the full column
   width to itself. Same treatment as the ticket view's attributes. */
html.rr-active #issue-form #all_attributes {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important;
  gap: 15px 20px !important;
  align-items: start !important;
}
/* display:contents, not a width reset: it takes the stock wrappers out of
   layout entirely, so the fields inside them become direct grid items of the
   row above rather than a grid nested per column. */
html.rr-active #issue-form #all_attributes .attributes,
html.rr-active #issue-form #all_attributes .splitcontent,
html.rr-active #issue-form #all_attributes .splitcontentleft,
html.rr-active #issue-form #all_attributes .splitcontentright {
  display: contents !important;
}

/* ---- labelled pairs ----
   Kept as block flow rather than a flex column on purpose: several fields
   have trailing inline content after the input (the " Stunden" note, the
   "Mir zuweisen" link, the "Neue Version" icon), and block flow lets those
   stay ordinary inline text instead of each becoming its own flex item. */
html.rr-active #issue-form p {
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.5 !important;
  /* grid items default to min-width:auto, which lets one long unbroken
     option label push its column wider than the card */
  min-width: 0 !important;
}
/* Several fields carry a bare text node after the input — the " Stunden"
   unit, the attachment size limit. At body size and body colour they read as
   content rather than as a note on the control, so the field row itself sets
   small and muted and every control inside overrides it. Folded sections are
   excluded: their contents are user-entered text, not annotations. */
html.rr-active #issue-form p:not(.rr-nt-fold) {
  color: var(--rr-muted) !important;
  font-size: 12px !important;
}
html.rr-active #issue-form p > label {
  /* undo the floated gutter: float, its negative margin and its fixed width
     are all what clipped the label in the first place */
  float: none !important;
  display: block !important;
  width: auto !important;
  margin: 0 0 3px !important;
  padding: 0 !important;
  text-align: left !important;
  color: var(--rr-muted) !important;
  font-size: 10.5px !important;
  font-weight: 600 !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase !important;
  white-space: normal !important;
  overflow: visible !important;
}
html.rr-active #issue-form .required {
  color: var(--rr-accent) !important;
}

/* ---- controls ----
   The global theme already gives inputs their dark colours; the sizing is
   what is missing, since Redmine leaves it to size="80"/size="6" attributes
   that mean nothing inside a grid column. */
html.rr-active #issue-form input[type="text"],
html.rr-active #issue-form input[type="date"],
html.rr-active #issue-form input[type="number"],
html.rr-active #issue-form select,
html.rr-active #issue-form textarea {
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  padding: 6px 8px !important;
  border-radius: 6px !important;
  font-family: var(--rr-font) !important;
  font-size: 13px !important;
}
html.rr-active #issue-form select[multiple] {
  min-height: 90px !important;
}
/* the one field whose trailing note belongs on the same line as the input */
html.rr-active #issue-form #issue_estimated_hours {
  width: 110px !important;
}
html.rr-active #issue-form input:focus,
html.rr-active #issue-form select:focus,
html.rr-active #issue-form textarea:focus {
  outline: none !important;
  border-color: var(--rr-accent) !important;
}
/* trailing inline extras beside a field: quiet, and clearly secondary to
   the control they follow */
html.rr-active #issue-form .assign-to-me-link,
html.rr-active #issue-form p > a.icon-only {
  display: inline-block !important;
  margin-top: 4px !important;
  color: var(--rr-muted) !important;
  font-size: 11px !important;
}
html.rr-active #issue-form .assign-to-me-link:hover {
  color: var(--rr-accent) !important;
}
html.rr-active #issue-form p > a.icon-only .icon-label {
  font-size: 11px !important;
}

/* ----------------------------- the four fields that matter -----------------------------
   Project, tracker, subject and description are what a ticket actually is;
   the rest is metadata. Grouped by JS into their own block at a fixed two
   columns (not auto-fit) so the two small selects always pair up on one row
   instead of leaving a hole beside them when the outer grid is wider. */
html.rr-active #issue-form .rr-nt-primary {
  grid-column: 1 / -1 !important;
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 15px 20px !important;
  align-items: start !important;
}
@media (max-width: 620px) {
  html.rr-active #issue-form .rr-nt-primary {
    grid-template-columns: 1fr !important;
  }
}
html.rr-active #issue-form .rr-nt-full {
  grid-column: 1 / -1 !important;
}
/* the subject is the one field every ticket is found by later */
html.rr-active #issue-form #issue_subject {
  padding: 9px 10px !important;
  font-size: 15px !important;
}
html.rr-active #issue-form #issue_description_and_toolbar {
  display: block !important;
}
html.rr-active #issue-form textarea.wiki-edit {
  min-height: 190px !important;
  line-height: 1.55 !important;
  resize: vertical !important;
}
/* hairline between "what the ticket is" and "how it is filed" — one
   separation instead of the stock form's none */
html.rr-active #issue-form .rr-nt-rule {
  grid-column: 1 / -1 !important;
  height: 0 !important;
  border-top: 1px solid var(--rr-border) !important;
  margin: 3px 0 1px !important;
}

/* ----------------------------- tucked-away fields -----------------------------
   Fields with nothing to decide (a status select with one option), and
   optional custom/plugin fields left at their default, collapse behind one
   chip. Nothing is removed: the controls stay in the form and still submit,
   they are only not drawn until asked for. (.rr-chip / .rr-chips are shared
   components owned by the global theme script.) */
html.rr-active #issue-form p.rr-nt-off {
  display: none !important;
}
html.rr-active #issue-form #all_attributes > .rr-nt-chips {
  grid-column: 1 / -1 !important;
  margin-top: 2px !important;
}

/* ----------------------------- folded sections -----------------------------
   Checklist, tags and watchers are each a widget-sized box that most tickets
   never use, so each is reduced to its own label until clicked. The label is
   the click target, which keeps the section named and discoverable while
   closed — unlike a chip, it says what it is in place.
   Closed is the class-carrying state (rr-nt-closed), so opening simply drops
   the class and every child returns to whatever display Redmine's own CSS
   gave it — no guessing at inline vs. inline-block to restore. */
html.rr-active #issue-form #all_attributes > .tabular,
html.rr-active #issue-form #issue_tags {
  grid-column: 1 / -1 !important;
}
html.rr-active #issue-form p.rr-nt-closed > *:not(label),
html.rr-active #issue-form .rr-nt-extra.rr-nt-closed {
  display: none !important;
}
html.rr-active #issue-form label.rr-nt-toggle {
  display: inline-flex !important;
  align-items: center !important;
  gap: 7px !important;
  margin: 0 !important;
  cursor: pointer !important;
  user-select: none;
}
html.rr-active #issue-form label.rr-nt-toggle:hover {
  color: var(--rr-text) !important;
}
html.rr-active #issue-form label.rr-nt-toggle::after {
  content: "";
  flex: 0 0 auto;
  width: 5px;
  height: 5px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg) translate(-1px, -1px);
  transition: transform 0.15s ease;
}
html.rr-active #issue-form label.rr-nt-toggle.rr-nt-closed::after {
  transform: rotate(-45deg) translate(-1px, 1px);
}
/* an open section gets breathing room from the field grid above it */
html.rr-active #issue-form p:not(.rr-nt-closed).rr-nt-fold > *:not(label) {
  margin-top: 4px !important;
}

/* ---- checkbox/radio groups ----
   Redmine's stand-in for a multi-select: a scrolling bordered box of labels
   (the global theme gives it its dark surface). The "Bearbeiter" one lists
   every user in the instance, so anything past the first handful is found by
   scrolling — hence the filter box JS puts above the long ones. */
html.rr-active #issue-form .check_box_group {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr)) !important;
  gap: 0 12px !important;
  max-height: 168px !important;
  overflow-y: auto !important;
  padding: 5px 7px !important;
  border-radius: 6px !important;
}
/* Redmine's ".tabular label" gutter rule is not scoped to the field labels,
   so it floats these option labels into fixed 175px boxes too — which clips
   every name longer than that ("Bereitschaft Re-In WDO") against the next
   column. Unfloated and laid out as an explicit responsive grid instead: the
   long user lists stay scannable across the card, the short groups
   (Dringlichkeit, Shops) collapse to one compact row, and either way nothing
   depends on what Redmine's own CSS does or does not reset. */
html.rr-active #issue-form .check_box_group label {
  float: none !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  width: auto !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 2px 3px !important;
  border-radius: 4px !important;
  text-align: left !important;
  font-size: 12.5px !important;
  font-weight: 400 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  cursor: pointer !important;
}
html.rr-active #issue-form .check_box_group label input {
  flex: 0 0 auto !important;
  margin: 0 !important;
}
html.rr-active #issue-form .check_box_group label:hover {
  background: var(--rr-surface) !important;
}
html.rr-active #issue-form .check_box_group label.rr-nt-nomatch {
  display: none !important;
}
html.rr-active #issue-form .rr-nt-filter {
  box-sizing: border-box !important;
  width: 100% !important;
  margin-bottom: 4px !important;
  padding: 4px 7px !important;
  border-radius: 6px !important;
  font-size: 12px !important;
}

/* ----------------------------- attachments -----------------------------
   Left visible rather than folded: Redmine's drag-and-drop target is the
   file input itself, so hiding it would take dropping a screenshot onto the
   form away, which is half of why people attach anything at all. */
html.rr-active #issue-form #attachments_form {
  margin-top: 16px !important;
  padding-top: 14px !important;
  border-top: 1px solid var(--rr-border) !important;
}
/* one hairline for the whole attachments/watchers tail, not one each — the
   two sit within a line of each other once watchers is folded shut */
html.rr-active #issue-form #watchers_form_container {
  margin-top: 12px !important;
}
html.rr-active #issue-form input[type="file"] {
  background: none !important;
  border: none !important;
  padding: 0 !important;
  color: var(--rr-muted) !important;
  font-family: var(--rr-font) !important;
  font-size: 12px !important;
}
html.rr-active #issue-form input[type="file"]::file-selector-button {
  margin-right: 8px !important;
  padding: 5px 12px !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: 6px !important;
  background: var(--rr-bg) !important;
  color: var(--rr-text) !important;
  font-family: var(--rr-font) !important;
  font-size: 12px !important;
  cursor: pointer !important;
}
html.rr-active #issue-form input[type="file"]::file-selector-button:hover {
  border-color: var(--rr-muted) !important;
}
html.rr-active #issue-form .attachments_fields input[type="text"] {
  width: auto !important;
  min-width: 180px !important;
}

/* ----------------------------- sticky submit bar -----------------------------
   The form is taller than any viewport once the description has room, so the
   stock buttons sit somewhere below the fold for the whole time you are
   filling it in. Pinned to the bottom edge instead, with "Anlegen" as the one
   filled button on the page — it is the only action this view exists for. */
html.rr-active #issue-form .rr-nt-actions {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 5 !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  margin-top: 4px !important;
  padding: 14px 0 12px !important;
  background: linear-gradient(
    to top,
    var(--rr-bg) 0%,
    var(--rr-bg) 65%,
    transparent 100%
  ) !important;
}
html.rr-active #issue-form .rr-nt-actions input[type="submit"] {
  padding: 8px 18px !important;
  border-radius: 7px !important;
  font-family: var(--rr-font) !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
}
html.rr-active #issue-form .rr-nt-actions input[name="commit"] {
  background-color: var(--rr-accent) !important;
  border-color: var(--rr-accent) !important;
  color: var(--rr-accent-contrast) !important;
}
html.rr-active #issue-form .rr-nt-actions input[name="commit"]:hover {
  filter: brightness(1.08) !important;
}
html.rr-active #issue-form .rr-nt-actions input[name="continue"] {
  font-weight: 500 !important;
  color: var(--rr-muted) !important;
}
html.rr-active #issue-form .rr-nt-actions input[name="continue"]:hover {
  color: var(--rr-text) !important;
}
`;

  // Tampermonkey's @run-at document-start can land after the document has
  // already finished parsing, and a DOMContentLoaded listener registered at
  // that point never fires — leaving this script's styles and enhancements
  // silently missing. See the global theme script for the full note. Running
  // immediately when the DOM is already parsed makes both timings behave the
  // same.
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  GM_addStyle(CSS);
  // See the global theme script for why: re-injecting once the document is
  // ready guarantees we win any specificity tie against Redmine's own
  // (later-loading) stylesheets.
  onReady(() => GM_addStyle(CSS));

  // Core fields that stay on screen whatever their value: the handful worth a
  // decision on nearly every ticket. Anything else — custom fields, plugin
  // fields (agile story points), fields Redmine renders for completeness —
  // only earns a row if it is required or already filled in.
  const ALWAYS_SHOWN = new Set([
    'issue_status_id',
    'issue_priority_id',
    'issue_assigned_to_id',
    'issue_fixed_version_id',
    'issue_parent_issue_id',
    'issue_start_date',
    'issue_due_date',
    'issue_estimated_hours',
  ]);

  // Fields grouped out of the metadata grid and into the primary block, in
  // the order Redmine renders them.
  const PRIMARY_IDS = [
    'issue_project_id',
    'issue_tracker_id',
    'issue_subject',
    'issue_description',
  ];

  // Duplicated from the issue script on purpose: userscripts run in isolated
  // scopes, so JS cannot be shared between them — only the CSS is, via the
  // document.
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

  // The user-facing controls of a field, ignoring the bookkeeping Redmine
  // hides alongside them (was_default_status, the empty-array placeholders
  // every multi-value field carries) and the filter box we inject ourselves.
  function controlsOf(p) {
    return Array.from(
      p.querySelectorAll(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not(.rr-nt-filter), select, textarea'
      )
    );
  }

  function hasValue(p) {
    return controlsOf(p).some((c) => {
      if (c.type === 'checkbox' || c.type === 'radio') {
        // a radio group's "(kein)" option is checked but carries value="",
        // which is the field being empty, not the field being set
        return c.checked && c.value !== '';
      }
      if (c.tagName === 'SELECT') {
        return Array.from(c.selectedOptions).some((o) => o.value !== '');
      }
      if (c.type === 'file') return false;
      return c.value.trim() !== '';
    });
  }

  // A select with a single option asks a question with one answer — on a
  // create form that is Status ("Neu"). Collapsed even though it is marked
  // required, because there is nothing there to get wrong.
  function hasNothingToDecide(p) {
    const controls = controlsOf(p);
    if (controls.length !== 1 || controls[0].tagName !== 'SELECT') return false;
    return controls[0].querySelectorAll('option').length <= 1;
  }

  function controlId(p) {
    const first = controlsOf(p)[0];
    return first ? first.id : '';
  }

  // Move project/tracker/subject/description into their own block so the two
  // selects can pair on one row and the long fields span the width. The <p>
  // elements move; the inline <script> tags Redmine interleaves between them
  // stay behind, which is harmless — they have already run by the time this
  // does, both on first load and after an AJAX re-render.
  function buildPrimaryBlock(host) {
    if (host.querySelector(':scope > .rr-nt-primary')) return;

    const fields = PRIMARY_IDS.map((id) => {
      const control = document.getElementById(id);
      const p = control && control.closest('p');
      return p && p.parentElement === host ? p : null;
    }).filter(Boolean);
    if (!fields.length) return;

    const block = document.createElement('div');
    block.className = 'rr-nt-primary';
    fields[0].insertAdjacentElement('beforebegin', block);
    fields.forEach((p) => {
      if (p.querySelector('textarea') || p.querySelector('#issue_subject')) {
        p.classList.add('rr-nt-full');
      }
      block.appendChild(p);
    });

    const rule = document.createElement('div');
    rule.className = 'rr-nt-rule rr-nt-injected';
    block.insertAdjacentElement('afterend', rule);
  }

  // Sort the metadata fields into shown and tucked-away, and give the tucked
  // ones a way back. Runs on whatever Redmine last rendered, so the split
  // follows the current tracker's field set rather than a fixed list.
  function bucketFields(host) {
    if (host.querySelector('.rr-nt-chips')) return;

    const fields = Array.from(host.querySelectorAll('.attributes p'));
    if (!fields.length) return;

    const hidden = [];
    fields.forEach((p) => {
      // a scrolling checkbox group needs the full width to be readable
      if (p.querySelector('.check_box_group, select[multiple], textarea')) {
        p.classList.add('rr-nt-full');
      }
      const keep =
        ALWAYS_SHOWN.has(controlId(p)) || p.querySelector('.required') || hasValue(p);
      if (hasNothingToDecide(p) || !keep) {
        p.classList.add('rr-nt-off');
        hidden.push(p);
      }
    });
    if (!hidden.length) return;

    const containers = host.querySelectorAll(':scope > .attributes');
    const anchor = containers[containers.length - 1];
    if (!anchor) return;

    const bar = document.createElement('div');
    bar.className = 'rr-chips rr-nt-chips rr-nt-injected';
    bar.appendChild(
      chip(`${hidden.length} weitere Felder`, (open) =>
        hidden.forEach((p) => p.classList.toggle('rr-nt-off', !open))
      )
    );
    anchor.insertAdjacentElement('afterend', bar);
  }

  // Reduce a section to its label until clicked. `extras` covers the parts
  // Redmine renders as siblings of the <p> rather than inside it (the
  // checklist's own action menu), which have to fold with it.
  function foldSection(p, extras, startOpen) {
    if (!p || p.dataset.rrFold) return;
    const label = p.querySelector(':scope > label');
    if (!label) return;

    p.dataset.rrFold = '1';
    p.classList.add('rr-nt-fold');
    label.classList.add('rr-nt-toggle');
    label.setAttribute('role', 'button');
    label.tabIndex = 0;
    extras.forEach((el) => el.classList.add('rr-nt-extra'));

    const setClosed = (closed) => {
      p.classList.toggle('rr-nt-closed', closed);
      label.classList.toggle('rr-nt-closed', closed);
      extras.forEach((el) => el.classList.toggle('rr-nt-closed', closed));
      label.setAttribute('aria-expanded', closed ? 'false' : 'true');
    };

    const toggle = (e) => {
      e.preventDefault();
      setClosed(!p.classList.contains('rr-nt-closed'));
    };
    label.addEventListener('click', toggle);
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') toggle(e);
    });

    setClosed(!startOpen);
  }

  function foldOptionalSections() {
    // Checklist: opened if the form came back with items already entered —
    // a failed submit must not look like it dropped them.
    const checklist = document.getElementById('checklist_form');
    if (checklist) {
      const menu = document.getElementById('checklist-menu');
      const filled = Array.from(
        checklist.querySelectorAll('.checklist-subject-hidden')
      ).some((i) => i.value.trim() !== '');
      foldSection(checklist, menu ? [menu] : [], filled);
    }

    const tags = document.getElementById('issue_tags');
    if (tags) {
      const select = document.getElementById('issue_tag_list');
      const filled = !!select && Array.from(select.selectedOptions).length > 0;
      foldSection(tags, [], filled);
    }

    const watchers = document.getElementById('watchers_form');
    if (watchers) {
      const inputs = document.getElementById('watchers_inputs');
      const filled = !!inputs && !!inputs.querySelector('input');
      foldSection(watchers, [], filled);
    }
  }

  // "Bearbeiter" lists every user in the instance inside an 8-line scroll
  // box, so picking a name means scrolling past seventy others. A filter above
  // the box turns that back into typing a name.
  function addGroupFilters(root) {
    root.querySelectorAll('.check_box_group').forEach((group) => {
      if (group.dataset.rrFilter) return;
      const options = Array.from(group.querySelectorAll(':scope > label'));
      if (options.length <= 10) return;
      group.dataset.rrFilter = '1';

      const box = document.createElement('input');
      box.type = 'text';
      box.className = 'rr-nt-filter rr-nt-injected';
      box.placeholder = 'Filtern…';
      box.autocomplete = 'off';
      box.addEventListener('input', () => {
        const needle = box.value.trim().toLowerCase();
        options.forEach((option) => {
          const hit = !needle || option.textContent.toLowerCase().includes(needle);
          option.classList.toggle('rr-nt-nomatch', !hit);
        });
      });
      // a lone text input in a form submits it on Enter — here that would
      // create the ticket from a half-filled form
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.preventDefault();
      });

      group.insertAdjacentElement('beforebegin', box);
    });
  }

  // Redmine leaves the submit buttons as bare children of the form, scrolled
  // off the bottom of a form this tall. Wrapped so they can be pinned.
  function buildActionBar(form) {
    if (form.querySelector(':scope > .rr-nt-actions')) return;
    const submits = Array.from(
      form.querySelectorAll(':scope > input[type="submit"]')
    );
    if (!submits.length) return;

    const bar = document.createElement('div');
    bar.className = 'rr-nt-actions';
    submits[0].insertAdjacentElement('beforebegin', bar);
    submits.forEach((btn) => bar.appendChild(btn));
  }

  function enhance() {
    const form = document.getElementById('issue-form');
    if (!form) return;
    const host = document.getElementById('all_attributes');
    if (host) {
      buildPrimaryBlock(host);
      bucketFields(host);
    }
    foldOptionalSections();
    addGroupFilters(form);
    buildActionBar(form);
  }

  onReady(() => {
    enhance();

    // Changing project, tracker or status re-renders #all_attributes from the
    // server (updateIssueFrom), throwing away everything done inside it — so
    // watch for the swap and redo that work. Every step above is guarded by a
    // marker on the elements it creates or touches, all of which live inside
    // the replaced container: the markers vanish with the old markup, and a
    // run triggered by our own edits finds nothing left to do and stops.
    const host = document.getElementById('all_attributes');
    if (host) {
      new MutationObserver(enhance).observe(host, { childList: true });
    }
  });
})();
