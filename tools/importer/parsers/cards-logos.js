/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-logos. Base: cards. Source: https://www.destinationpet.com/our-locations/
 * Instances: .columncontainer.background-color--primary + .columncontainer
 *   = the FIRST logo row after each state's navy title band (31 states on our-locations).
 *   The parser also absorbs every following sibling .columncontainer until the next navy band or the
 *   end of the state wrapper, so one block holds all of a state's logos; absorbed rows are removed
 *   from the DOM so they are not duplicated as default content.
 * UE model (blocks/cards-logos/_cards-logos.json, item cards-logos-card):
 *   image (reference) + imageAlt (collapsed), text (richtext), link (aem-content).
 *   One row per logo: [image] | [text: optional caption] | [link: location URL].
 *
 * Selectors validated against migration-work/pages/our-locations/cleaned.html:
 *  - .cmp-image (inner block wrapper)   card iteration key (NOT the a.cmp-image__link anchors);
 *                                        also catches logos in a nested .columncontainer (Colorado)
 *  - a.cmp-image__link[href]            location URL
 *  - .cmp-text p / .cmp-title__text     caption in the same .container__column (Georgia "Dunwoody",
 *                                        North Carolina "Charlotte / North Carolina"); attached to the
 *                                        column's last logo (California column has 2 logos + 1 caption)
 * Generated: 2026-10-05
 */
const BAND = '.columncontainer.background-color--primary';

function hint(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

function captionFor(col) {
  if (!col) return [];
  return [...col.querySelectorAll(':scope > .richtext .cmp-text p, :scope > .text .cmp-text p, :scope > .title .cmp-title__text')]
    .filter((el) => el.textContent.trim() !== '' && !el.querySelector('img'));
}

export default function parse(element, { document }) {
  // Gather this state's logo rows: the matched row + following sibling rows up to the next band.
  const rows = [element];
  let next = element.nextElementSibling;
  while (next && next.matches('.columncontainer') && !next.matches(BAND)) {
    rows.push(next);
    next = next.nextElementSibling;
  }

  const cells = [];
  rows.forEach((row) => {
    const images = [...row.querySelectorAll('.cmp-image')].filter((ci) => ci.querySelector('img'));
    images.forEach((ci) => {
      const img = ci.querySelector('img');
      const anchor = ci.querySelector('a[href]') || img.closest('a[href]');
      const col = ci.closest('.container__column');
      const colImages = col ? [...col.querySelectorAll('.cmp-image')].filter((x) => x.querySelector('img')) : [ci];
      const isLastInCol = colImages[colImages.length - 1] === ci;
      const caption = isLastInCol ? captionFor(col) : [];

      let linkNode = null;
      if (anchor) {
        linkNode = document.createElement('a');
        linkNode.href = anchor.getAttribute('href');
        linkNode.textContent = anchor.getAttribute('href');
      }

      cells.push([
        hint(document, 'image', [img]),
        caption.length ? hint(document, 'text', caption) : '',
        linkNode ? hint(document, 'link', [linkNode]) : '',
      ]);
    });
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Remove absorbed sibling rows so they do not reappear as default content.
  rows.slice(1).forEach((r) => r.remove());

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-logos', cells });
  element.replaceWith(block);
}
