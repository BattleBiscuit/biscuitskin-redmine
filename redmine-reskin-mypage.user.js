// ==UserScript==
// @name         Redmine Reskin: My Page Layout
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.3.0
// @description  My Page-only layout: card-styled blocks and decluttering. Only runs on /my/page, so it can never conflict with styling on other Redmine pages. Requires "Redmine Reskin: Global Theme" for colors/toggle.
// @author       Benjamin Seidel
// @match        https://redmine.re-in.de/my/page*
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-mypage.user.js
// @downloadURL  https://raw.githubusercontent.com/BattleBiscuit/biscuitskin-redmine/main/redmine-reskin-mypage.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Everything here targets elements/classes (.mypage-box, .block-receiver,
  // #my-page) that only exist on the My Page view, so this script is
  // @match-scoped to that path rather than relying on selector scoping —
  // it simply never loads its CSS/JS anywhere else.
  const CSS = `
/* ---- block wrapper reduced to just the board ----
   The .mypage-box card was a second frame around content the board columns
   already frame, and its "Mir zugewiesene Tickets" heading duplicated what
   the columns show. Strip the chrome so the board sits straight on the page.

   The block controls (drag handle, delete, column settings) are part of that
   same chrome and go with it — they stay reachable by switching the reskin
   off. Blocks that are NOT issue lists (news, documents, calendar) keep the
   card and heading via .rr-keep-box, since they have no board to stand on
   their own; that class is applied by the JS below. */
html.rr-active .mypage-box {
  background: none !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin-bottom: 26px !important;
}
html.rr-active .mypage-box > h3,
html.rr-active .mypage-box > .contextual {
  display: none !important;
}

html.rr-active .mypage-box.rr-keep-box {
  background: var(--rr-surface) !important;
  border: 1px solid var(--rr-border) !important;
  border-radius: var(--rr-radius) !important;
  box-shadow: var(--rr-shadow) !important;
  padding: 16px !important;
  margin-bottom: 16px !important;
}
html.rr-active .mypage-box.rr-keep-box > h3,
html.rr-active .mypage-box.rr-keep-box > .contextual {
  display: revert !important;
}
html.rr-active .mypage-box.rr-keep-box > h3 {
  font-size: 14px !important;
  font-weight: 600 !important;
  color: var(--rr-text) !important;
  border-bottom: 1px solid var(--rr-border) !important;
  padding-bottom: 8px !important;
  margin-bottom: 12px !important;
}
html.rr-active .mypage-box.rr-keep-box > h3 a { color: var(--rr-text) !important; }

/* Redmine draws a dashed border on the sortable drop-target columns
   (#list-top/-left/-right) — not meaningful once boxes are card-styled. */
html.rr-active .block-receiver {
  border: none !important;
}

/* Decluttering: things that add no value once you're already on My Page. */
html.rr-active body.controller-my.action-page #content > h2 {
  display: none !important;
}
html.rr-active body.controller-my.action-page #sidebar {
  display: none !important;
}

/* "Hinzufügen" add-block control container (the add-block script builds
   the dropdown itself; this is just its position). The h2 that used to
   clear this float is hidden above, so clear it here instead. */
html.rr-active body.controller-my.action-page #content > .contextual {
  float: right;
  margin-bottom: 14px;
}
html.rr-active body.controller-my.action-page #my-page {
  clear: both;
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

  // Only issue-list blocks become boards, so only they can lose their card
  // and heading and still make sense. Anything else on My Page (news,
  // documents, calendar, spent time) keeps both — without a board it would
  // otherwise be unlabelled content floating on the page background.
  function markNonBoardBlocks() {
    document.querySelectorAll('.mypage-box').forEach((block) => {
      if (!block.querySelector('table.list.issues')) {
        block.classList.add('rr-keep-box');
      }
    });
  }

  onReady(() => {
    markNonBoardBlocks();
    // Redmine replaces a block's markup over AJAX (adding a block, saving
    // column settings), so re-check when that happens.
    const page = document.getElementById('my-page');
    if (page) {
      new MutationObserver(markNonBoardBlocks).observe(page, {
        childList: true,
        subtree: true,
      });
    }
  });
})();
