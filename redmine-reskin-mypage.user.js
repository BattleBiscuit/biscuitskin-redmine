// ==UserScript==
// @name         Redmine Reskin: My Page Layout
// @namespace    https://github.com/BattleBiscuit/biscuitskin-redmine
// @version      1.1.0
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
  GM_addStyle(CSS);
  // See the global theme script for why: re-injecting after
  // DOMContentLoaded guarantees we win any specificity tie against
  // Redmine's own (later-loading) stylesheets.
  document.addEventListener('DOMContentLoaded', () => GM_addStyle(CSS));
})();
