// ==UserScript==
// @name         Redmine Reskin: Add-Block Dropdown
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.3.0
// @description  Replaces My Page's "Hinzufügen" block-select with a custom dropdown matching the project-jump flyout. Only runs on /my/page. Requires "Redmine Reskin: Global Theme" for the shared .drdn-* styling — visuals will be unstyled without it.
// @author       Benjamin Seidel
// @match        https://redmine.re-in.de/my/page*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-add-block.user.js
// @downloadURL  https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-add-block.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Structural/positioning CSS only — the actual pill/panel look (colors,
  // borders) comes from the core theme script's shared .drdn-* rules.
  const CSS = `
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
  // See the global theme script for why: re-injecting once the document
  // is ready guarantees we win any specificity tie against
  // Redmine's own (later-loading) stylesheets.
  onReady(() => GM_addStyle(CSS));

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

  onReady(() => {
    buildAddBlockDropdown();
    setupBlockSelectObserver();
  });
})();
