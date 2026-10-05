/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-promo. Base: cards. Source: https://www.destinationpet.com/
 * Instances: .infocards.info-card--center.remPaddingBottom (single centered promo card).
 * UE model (blocks/cards-promo/_cards-promo.json, item cards-promo-card):
 *   image (reference) + imageAlt (collapsed), text (richtext). One row per card: [image] | [text].
 *
 * Selectors validated against migration-work/block-context/cards-promo/source.html:
 *  - .info-card            card (iteration key; one per instance on homepage)
 *  - img                   logo image (lives inside .info-card__text here; .info-card__asset is empty)
 *  - .cmp-text p           description
 *  - .button a.button__bdl CTA ("Sell your business") -> clean <a> using .button__text label
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
  let cards = [...element.querySelectorAll('.info-card')];
  if (!cards.length) cards = [element];

  const cells = [];
  cards.forEach((card) => {
    const img = card.querySelector('.info-card__asset img') || card.querySelector('img');
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
}
