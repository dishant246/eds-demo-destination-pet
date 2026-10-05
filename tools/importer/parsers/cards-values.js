/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-values. Base: cards. Source: https://www.destinationpet.com/
 * Instances: .columncontainer.remPaddingBottom (homepage) and
 *   .columncontainer:has(... > .container__column:first-child > .infocards):not(:has(.info-card__text .button))
 *   (sell-your-business, sell-your-veterinary-practice).
 * UE model (blocks/cards-values/_cards-values.json, item cards-values-card):
 *   image (reference) + imageAlt (collapsed), text (richtext). One row per card: [image] | [text].
 *
 * Card shapes handled (validated against source.html + instances/01-02.html):
 *  - homepage:                     badge img + h2 title + h3 tagline + .cmp-text p
 *  - sell-your-business:           img + h3 only
 *  - sell-your-veterinary-practice: img + .cmp-text richtext only
 * Iteration key: .infocards (stable block wrapper inside each .container__column).
 * Generated: 2026-10-05
 */
function hint(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

function collectText(container, document) {
  const out = [];
  if (!container) return out;
  container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, .button a[href], a.button__bdl[href]').forEach((el) => {
    if (out.some((o) => o.contains(el))) return;
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
    if (el.textContent.trim() === '') return;
    out.push(el);
  });
  return out;
}

export default function parse(element, { document }) {
  let cards = [...element.querySelectorAll('.infocards')];
  if (!cards.length) cards = [...element.querySelectorAll('.info-card')];

  const cells = [];
  cards.forEach((card) => {
    const img = card.querySelector('.info-card__asset img, img');
    const textNodes = collectText(card.querySelector('.info-card__text') || card, document);
    if (!img && !textNodes.length) return;
    cells.push([
      img ? hint(document, 'image', [img]) : '',
      textNodes.length ? hint(document, 'text', textNodes) : '',
    ]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-values', cells });
  element.replaceWith(block);
}
