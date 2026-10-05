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
 *  - dropped: i.testimonial__upper-quotes*, i.testimonial__lower-quotes* (decorative quote icons) and
 *             .testimonial__header (empty .testimonial__header-name / -address labels)
 * Generated: 2026-10-05
 */
function hint(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

const ATTRIBUTION_RE = /^\s*[-–—~]/;

export default function parse(element, { document }) {
  // Remove decorative / duplicated chrome first.
  element.querySelectorAll('.testimonial__header, [class*="testimonial__upper-quotes"], [class*="testimonial__lower-quotes"]').forEach((el) => el.remove());

  const desc = element.querySelector('.testimonial__description') || element;
  const paragraphs = [...desc.querySelectorAll('p')].filter((p) => p.textContent.trim() !== '');

  let attribution = null;
  if (paragraphs.length > 1 && ATTRIBUTION_RE.test(paragraphs[paragraphs.length - 1].textContent)) {
    attribution = paragraphs.pop();
  }

  if (!paragraphs.length && !attribution) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([paragraphs.length ? hint(document, 'quotation', paragraphs) : '']);
  cells.push([attribution ? hint(document, 'attribution', [attribution]) : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote-testimonial', cells });
  element.replaceWith(block);
}
