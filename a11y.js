// SC Companion — keyboard and screen reader support for the parts the other scripts draw.
// Tables are redrawn often, so rather than touching every renderer this watches the page and:
// - lets you reach clickable rows and sortable column titles with Tab, and use them with Enter or Space,
// - tells screen readers which way a column is sorted and whether a row is open,
// - marks the current tab in each menu (aria-current).

(() => {
  const ROWS = 'tr.clickable';
  const SORT = 'th.sortable, th[data-sort]';

  function prepare(root) {
    if (!(root instanceof Element)) return;
    for (const tr of root.matches?.(ROWS) ? [root] : root.querySelectorAll(ROWS)) {
      if (!tr.hasAttribute('tabindex')) tr.tabIndex = 0;
      // Rows that open a detail start with ▸ (closed) or ▾ (open).
      const mark = tr.textContent.trim().charAt(0);
      if (mark === '▸' || mark === '▾') tr.setAttribute('aria-expanded', String(mark === '▾'));
      else if (tr.classList.contains('picked') || tr.classList.contains('selected')) tr.setAttribute('aria-selected', 'true');
    }
    for (const th of root.matches?.(SORT) ? [root] : root.querySelectorAll(SORT)) {
      if (!th.hasAttribute('tabindex')) th.tabIndex = 0;
      const text = th.textContent;
      th.setAttribute('aria-sort', text.includes('▲') ? 'ascending' : text.includes('▼') ? 'descending' : 'none');
    }
  }

  function markTabs() {
    document.querySelectorAll('nav .tab').forEach((tab) => {
      if (tab.classList.contains('active')) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  // Enter or Space on a focused row or column title does what a click does.
  // After the table is redrawn, focus goes back to the same row or column so you don't lose your place.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest?.(`${ROWS}, ${SORT}`);
    if (!el || el !== e.target) return;
    e.preventDefault();
    const table = el.closest('table');
    const keyAttr = [...el.attributes].find((a) => a.name.startsWith('data-'));
    el.click();
    if (table && keyAttr) {
      prepare(table); // the redrawn rows aren't focusable until they get their tabindex
      const again = table.querySelector(`[${keyAttr.name}="${CSS.escape(keyAttr.value)}"]`);
      if (again && again !== document.activeElement) again.focus({ preventScroll: true });
    }
  });

  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'attributes') { if (r.target.matches('nav .tab')) markTabs(); continue; }
      r.addedNodes.forEach(prepare);
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

  // "Skip to content" moves focus to the page without changing the URL (the URL holds the current tab).
  document.querySelector('.skip-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('content')?.focus();
  });

  prepare(document.body);
  markTabs();
})();
