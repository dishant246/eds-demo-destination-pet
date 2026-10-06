/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-testimonial. Base: carousel. Source: https://www.destinationpet.com/sell-your-business/sell-your-veterinary-practice/
 * Instances: .carousel.panelcontainer:has(.testimonialscard) (slick carousel of testimonial cards).
 * UE model (blocks/carousel-testimonial/_carousel-testimonial.json, item carousel-testimonial-item):
 *   media_image (reference) + media_imageAlt (collapsed), content_text (richtext).
 *   One row per slide: [media_image (empty - text-only testimonials)] | [content_text].
 *
 * Selectors validated against migration-work/block-context/carousel-testimonial/source.html:
 *  - .carousel__item (inside .slick-slide, excluding .slick-cloned)  slide (iteration key)
 *  - .testimonial__description .cmp-text p                           quote + "- Name, Practice" attribution
 *  - p.testimonial__header-name  bold name label -> <p><strong>Name</strong></p> first in text cell (skipped when empty)
 *  - dropped: rest of .testimonial__header (empty address), i.testimonial__*-quotes* icons,
 *             slick arrows/dots
 *  - .carousel__title h2 - empty on source; emitted as default content before the block when present
 * Generated: 2026-10-05
 */
function hint(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

// Source puts the attribution in the same <p> as the quote, after a <br>, sometimes with the <br>
// inside the <b> ("...doctor.<b><br>- Dr. Name,</b> Practice"). Split it into its own paragraph so
// the markdown does not start a bold run with a hard break.
function splitAttribution(p, document) {
  p.querySelectorAll('b, strong').forEach((b) => {
    while (b.firstChild && (b.firstChild.nodeName === 'BR' || (b.firstChild.nodeType === 3 && !b.firstChild.textContent.trim()))) {
      b.before(b.firstChild);
    }
  });
  const brs = [...p.querySelectorAll(':scope > br')];
  const br = brs[brs.length - 1];
  if (!br) return [p];
  const after = [];
  let n = br.nextSibling;
  while (n) { after.push(n); n = n.nextSibling; }
  const afterText = after.map((x) => x.textContent).join('').trim();
  if (!/^[-–—~]/.test(afterText)) return [p];
  const attribution = document.createElement('p');
  after.forEach((x) => attribution.appendChild(x));
  br.remove();
  return [p, attribution];
}

export default function parse(element, { document }) {
  const title = element.querySelector('.carousel__title h2, .carousel__title h3');

  let items = [...element.querySelectorAll('.carousel__item')].filter((it) => !it.closest('.slick-cloned'));
  if (!items.length) items = [...element.querySelectorAll('.testimonialscard')].filter((it) => !it.closest('.slick-cloned'));

  const cells = [];
  items.forEach((item) => {
    // Bold name label shown above the opening quote mark (often empty on later slides).
    const nameEl = item.querySelector('.testimonial__header-name');
    const name = nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : '';
    let nameP = null;
    if (name) {
      nameP = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = name;
      nameP.appendChild(strong);
    }
    item.querySelectorAll('.testimonial__header, [class*="testimonial__upper-quotes"], [class*="testimonial__lower-quotes"]').forEach((el) => el.remove());
    const desc = item.querySelector('.testimonial__description') || item;
    const textNodes = [...desc.querySelectorAll('p, ul, ol')]
      .filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el)))
      .filter((el) => el.textContent.trim() !== '')
      .flatMap((el) => (el.tagName === 'P' ? splitAttribution(el, document) : [el]));
    if (nameP && textNodes.length) textNodes.unshift(nameP);
    const img = item.querySelector('img');
    if (!textNodes.length && !img) return;
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-testimonial', cells });
  element.replaceWith(block);
}
