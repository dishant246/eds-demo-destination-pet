/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-steps. Base: carousel. Source: https://www.destinationpet.com/sell-your-business/sell-your-veterinary-practice/
 * Instances: .carousel.panelcontainer:has(.infocards) (slick carousel of numbered step info-cards).
 * UE model (blocks/carousel-steps/_carousel-steps.json, item carousel-steps-item):
 *   media_image (reference) + media_imageAlt (collapsed), content_text (richtext).
 *   One row per step: [media_image (icon)] | [content_text (h3 step title + optional text)].
 *
 * Selectors validated against migration-work/block-context/carousel-steps/source.html:
 *  - .carousel__item (inside .slick-slide, excluding .slick-cloned)  step (iteration key, 5 steps)
 *  - first img in the step                                           icon
 *  - h1-h6 / p / lists anywhere in the step                          text (slide 1 nests a second
 *                                                                    .infocards that holds the title)
 *  - dropped: slick arrows/dots; empty .carousel__title h2 (emitted before the block when non-empty)
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
  const title = element.querySelector('.carousel__title h2, .carousel__title h3');

  let items = [...element.querySelectorAll('.carousel__item')].filter((it) => !it.closest('.slick-cloned'));
  if (!items.length) items = [...element.querySelectorAll('.slick-slide:not(.slick-cloned)')];

  const cells = [];
  items.forEach((item) => {
    const img = item.querySelector('img');
    const textNodes = collectText(item, document);
    if (!img && !textNodes.length) return;
    cells.push([
      img ? hint(document, 'media_image', [img]) : '',
      textNodes.length ? hint(document, 'content_text', textNodes) : '',
    ]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  if (title && title.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.textContent = title.textContent.trim();
    element.before(h2);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-steps', cells });
  element.replaceWith(block);
}
