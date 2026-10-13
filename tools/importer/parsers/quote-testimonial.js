/* eslint-disable */
/* global WebImporter */
/**
 * Parser for quote-testimonial. Base: quote (custom - no library convention). Source: https://www.destinationpet.com/
 * Instances: .container__column > .testimonialscard (homepage, life-at-dp, sell-your-business).
 * UE model (blocks/quote-testimonial/_quote-testimonial.json): quotation (richtext), attribution (richtext).
 * Rows: [quotation] / [attribution].
 *
 * Selectors validated against migration-work/block-context/quote-testimonial/source.html + instances/01-02.html:
 *  - .testimonial__description .cmp-text p   quote paragraphs; the trailing "- <b>Name,</b> Role" paragraph
 *                                            is the attribution
 *  - .testimonial__header-name / -address    attribution shown above the quote (live-webinar); empty
 *                                            labels on the other pages are dropped
 *  - dropped: i.testimonial__upper-quotes*, i.testimonial__lower-quotes* (decorative quote icons)
 * Variant: .testimonial-background-transparent (left-aligned, attribution on top) -> quote-testimonial (left)
 * Generated: 2026-10-05, updated 2026-10-12
 */
function hint(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

const ATTRIBUTION_RE = /^\s*[-–—~]/;

export default function parse(element, { document }) {
  const left = element.matches('[class*="testimonial-background-transparent"]')
    || !!element.querySelector('[class*="testimonial-background-transparent"]');

  // Header attribution (name bold, then address) - only when the labels have text.
  const headerNodes = [];
  const headerName = element.querySelector('.testimonial__header-name');
  const headerAddress = element.querySelector('.testimonial__header-address');
  if (headerName && headerName.textContent.trim()) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = headerName.textContent.trim();
    p.appendChild(strong);
    headerNodes.push(p);
  }
  if (headerAddress && headerAddress.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = headerAddress.textContent.trim();
    headerNodes.push(p);
  }

  // Remove decorative / duplicated chrome.
  element.querySelectorAll('.testimonial__header, [class*="testimonial__upper-quotes"], [class*="testimonial__lower-quotes"]').forEach((el) => el.remove());

  const desc = element.querySelector('.testimonial__description') || element;
  const paragraphs = [...desc.querySelectorAll('p')].filter((p) => p.textContent.trim() !== '');

  let attribution = headerNodes.length ? headerNodes : null;
  if (!attribution && paragraphs.length > 1 && ATTRIBUTION_RE.test(paragraphs[paragraphs.length - 1].textContent)) {
    attribution = [paragraphs.pop()];
  }

  if (!paragraphs.length && !attribution) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([paragraphs.length ? hint(document, 'quotation', paragraphs) : '']);
  cells.push([attribution ? hint(document, 'attribution', attribution) : '']);

  const name = left ? 'quote-testimonial (left)' : 'quote-testimonial';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
