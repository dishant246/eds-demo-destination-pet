/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-links. Base: columns. Source: https://www.destinationpet.com/our-locations/
 * Instances (both on our-locations):
 *  - .columncontainer:has(... > .container__column + .container__column > .button)   button row
 *      (3 columns, one AEM button each: "Pet lifestyle centers", ...)
 *  - .columncontainer:has(... > .container__column > .link)                         state index
 *      (4 columns of .link anchors: #arizona ... #New-Hampshire ...)
 * Columns block (xwalk) -> no field hints. 1 row, one cell per .container__column.
 *  - single button  -> <p><strong><a></a></strong></p> (blocks/columns-links/columns-links.js renders a
 *                      lone bold link as a button)
 *  - several links  -> <ul><li><a></a></li>...</ul> (compact link list)
 * Mixed-case state anchors (#New-Hampshire) are rewritten to EDS heading ids (#new-hampshire).
 * Dropped: span.icon-location / em.link__icon glyphs.
 * Selectors validated against migration-work/block-context/columns-links/source.html + instances/01.html.
 * Generated: 2026-10-05
 */
function normalizeHref(href) {
  if (!href) return href;
  if (href.startsWith('#')) {
    const id = decodeURIComponent(href.slice(1))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `#${id}`;
  }
  return href;
}

function linkLabel(a) {
  return (a.querySelector('.button__text') || a).textContent.replace(/\s+/g, ' ').trim();
}

function buildCell(col, document) {
  const anchors = [...col.querySelectorAll('a[href]')].filter((a) => linkLabel(a));
  const headings = [...col.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((h) => h.textContent.trim());
  const texts = [...col.querySelectorAll('.cmp-text p')].filter((p) => p.textContent.trim() && !p.querySelector('a'));
  const out = [...headings, ...texts];

  const mk = (a) => {
    const link = document.createElement('a');
    link.href = normalizeHref(a.getAttribute('href'));
    link.textContent = linkLabel(a);
    return link;
  };

  if (anchors.length === 1) {
    const a = anchors[0];
    const p = document.createElement('p');
    const isButton = a.classList.contains('button__bdl') || !!a.closest('.button');
    if (isButton) {
      const strong = document.createElement('strong');
      strong.appendChild(mk(a));
      p.appendChild(strong);
    } else {
      p.appendChild(mk(a));
    }
    out.push(p);
  } else if (anchors.length > 1) {
    const ul = document.createElement('ul');
    anchors.forEach((a) => {
      const li = document.createElement('li');
      li.appendChild(mk(a));
      ul.appendChild(li);
    });
    out.push(ul);
  }
  return out.length ? out : '';
}

export default function parse(element, { document }) {
  const row = element.querySelector('.row.container__layout-section, .row');
  let columns = row ? [...row.querySelectorAll(':scope > .container__column')] : [];
  if (!columns.length) columns = [...element.querySelectorAll('.container__column')];

  const cellsRow = columns.map((col) => buildCell(col, document)).filter((c) => c !== '');

  if (!cellsRow.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [cellsRow];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-links', cells });
  element.replaceWith(block);
}
