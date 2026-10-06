/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion. Source: https://www.destinationpet.com/sell-your-business/sell-your-veterinary-practice/
 * Instances: .container__column:not(.col-md-6) > .accordion.panelcontainer (AEM Core accordion).
 * UE model (blocks/accordion-faq/_accordion-faq.json, item accordion-faq-item):
 *   summary (text), text (richtext). One row per item: [summary] | [text].
 *
 * Selectors validated against migration-work/block-context/accordion-faq/source.html:
 *  - .cmp-accordion__item                       item (iteration key, 4 items)
 *  - .cmp-accordion__title                      question (inside button.cmp-accordion__button)
 *  - .cmp-accordion__panel                      answer (p / ul inside .cmp-text)
 *  - dropped: .cmp-accordion__icon (plus/minus glyphs), clientlib <link>
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
  const nodes = [...panel.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, table, img')]
    .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)))
    .filter((el) => el.tagName === 'IMG' || el.textContent.trim() !== '' || el.querySelector('img'));
  return nodes;
}

export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.cmp-accordion__item')];

  const cells = [];
  items.forEach((item) => {
    const titleEl = item.querySelector('.cmp-accordion__title') || item.querySelector('.cmp-accordion__button, .cmp-accordion__header');
    const summary = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
    const body = panelContent(item.querySelector('.cmp-accordion__panel'));
    if (!summary && !body.length) return;
    // Source question is an <h3 class="cmp-accordion__header">; keep it as h3 in the title cell.
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

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
