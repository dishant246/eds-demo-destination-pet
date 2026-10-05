/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base: columns. Source: https://www.destinationpet.com/
 * Instances: .mediainfo (AEM "media info" component: image left, text right).
 * Columns block (xwalk) -> no field hints; 1 row x 2 cells: [image] | [h2, h3, richtext, CTA].
 *
 * Selectors validated against migration-work/block-context/columns-media/source.html:
 *  - .media-info__left img           media column
 *  - .media-info__right              text column (h2/h3 .cmp-title__text, .cmp-text p)
 * Column order follows the DOM (left/right), so a reversed media-info still maps correctly.
 * Generated: 2026-10-05
 */
const CONTENT_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, ul, ol';

function collectContent(container, document) {
  const out = [];
  if (!container) return out;
  container.querySelectorAll(`${CONTENT_SELECTOR}, img, .button a[href], a.button__bdl[href]`).forEach((el) => {
    // skip nodes nested inside an already collected text node (p inside li, etc.)
    if (out.some((o) => o.contains && o.contains(el))) return;
    if (el.tagName === 'A') {
      const label = (el.querySelector('.button__text') || el).textContent.trim();
      if (!label) return;
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = el.getAttribute('href');
      a.textContent = label;
      p.appendChild(a);
      out.push(p);
      return;
    }
    if (el.tagName === 'IMG') { out.push(el); return; }
    if (el.textContent.trim() === '' && !el.querySelector('img')) return;
    out.push(el);
  });
  return out;
}

export default function parse(element, { document }) {
  const wrapper = element.querySelector('.media-info__wrapper') || element;
  let columns = [...wrapper.querySelectorAll(':scope > .media-info__left, :scope > .media-info__right')];
  if (!columns.length) columns = [...wrapper.children];

  const row = columns.map((col) => {
    const nodes = collectContent(col, document);
    return nodes.length ? nodes : '';
  });

  if (!row.some((c) => c !== '')) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
