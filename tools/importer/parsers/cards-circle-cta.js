/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-circle-cta. Base: cards. Source: https://www.destinationpet.com/sell-your-business/
 * Instances: .columncontainer:has(... > .container__column:first-child > .infocards .info-card__text > .cmp-container > .button:only-child)
 *   (3-up circular photos, each with only a CTA button beneath).
 * UE model (blocks/cards-circle-cta/_cards-circle-cta.json, item cards-circle-cta-card):
 *   image (reference) + imageAlt (collapsed), text (richtext). One row per card: [image] | [text: p > a].
 *
 * Selectors validated against migration-work/block-context/cards-circle-cta/source.html:
 *  - .infocards               card (iteration key - stable block wrapper per .container__column)
 *  - .info-card__asset img    circular photo
 *  - .info-card__text a.button__bdl  CTA; label from span.button__text
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-circle-cta', cells });
  element.replaceWith(block);
}
