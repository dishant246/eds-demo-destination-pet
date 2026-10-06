/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-split. Base: accordion. Source: https://www.destinationpet.com/join-our-pack/life-at-dp/
 * Instances: .columncontainer:has(... > .container__column.col-md-6 > .accordion) - one instance holds two
 *   .col-md-6 columns, each with a group title (h2) and an AEM Core accordion.
 * UE model (blocks/accordion-split/_accordion-split.json):
 *   accordion-split-group: title (richtext)          -> group row  [accordion-split-group | title]
 *   accordion-split-item:  summary (text), text (richtext) -> item row        [summary] | [text]
 * Row order: group row, then that group's item rows, repeated per column (blocks/accordion-split/accordion-split.js
 * treats a single-cell row as the start of a new group).
 *
 * Selectors validated against migration-work/block-context/accordion-split/source.html:
 *  - .container__column                     group (iteration key, 2 groups)
 *  - .cmp-title__text (h2) outside accordion group title
 *  - .cmp-accordion__item                   item; .cmp-accordion__title = summary; .cmp-accordion__panel = body
 * Generated: 2026-10-05
 */
function hint(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(typeof n === 'string' ? document.createTextNode(n) : n));
  return frag;
}

function panelContent(panel) {
  if (!panel) return [];
  return [...panel.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, table, img')]
    .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)))
    .filter((el) => el.tagName === 'IMG' || el.textContent.trim() !== '' || el.querySelector('img'));
}

export default function parse(element, { document }) {
  let groups = [...element.querySelectorAll('.container__column')].filter((col) => col.querySelector('.cmp-accordion__item'));
  if (!groups.length) groups = [element];

  const cells = [];
  groups.forEach((group) => {
    // Group title: first heading that is not inside the accordion itself.
    const titleEl = [...group.querySelectorAll('.cmp-title__text, h1, h2, h3, h4')]
      .find((h) => !h.closest('.accordion, .cmp-accordion') && h.textContent.trim() !== '');
    if (titleEl) {
      const h = document.createElement(/^H[1-6]$/.test(titleEl.tagName) ? titleEl.tagName.toLowerCase() : 'h2');
      h.textContent = titleEl.textContent.trim();
      // first cell names the item component so xwalk (md2jcr) maps this row to the
      // accordion-split-group model instead of padding an accordion-split-item with template defaults
      cells.push(['accordion-split-group', hint(document, 'title', [h])]);
    }

    group.querySelectorAll('.cmp-accordion__item').forEach((item) => {
      const t = item.querySelector('.cmp-accordion__title') || item.querySelector('.cmp-accordion__button, .cmp-accordion__header');
      const summary = t ? t.textContent.replace(/\s+/g, ' ').trim() : '';
      const body = panelContent(item.querySelector('.cmp-accordion__panel'));
      if (!summary && !body.length) return;
      // Source item title is an <h3 class="cmp-accordion__header">; keep it as h3 in the title cell.
      let summaryNode = null;
      if (summary) {
        summaryNode = document.createElement('h3');
        summaryNode.textContent = summary;
      }
      cells.push([
        summaryNode ? hint(document, 'summary', [summaryNode]) : '',
        body.length ? hint(document, 'text', body) : '',
      ]);
    });
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-split', cells });
  element.replaceWith(block);
}
