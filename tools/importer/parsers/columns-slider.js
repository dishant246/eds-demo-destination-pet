/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-slider. Base: columns.
 * Source: https://www.destinationpet.com/about-us/destination-pet-foundation/
 * Instances: .mediainfo:has(.carousel.panelcontainer) (AEM "media info" with a slick image carousel left).
 * Columns block (xwalk) -> no field hints; 1 row x 2 cells:
 *   [slide images, one <img> per <p>, source order] | [h2 + richtext paragraphs with inline links]
 *
 * Selectors validated against migration-work/block-context/columns-slider/source.html:
 *  - .media-info__left .carousel__item img      real slides (slick clones under .slick-cloned are skipped)
 *  - .media-info__right .cmp-title__text / .cmp-text p   text column
 * Dropped: .carousel__title (empty h2), .slick-arrow buttons, .slick-dots.
 * Images are Dynamic Media (images.destpet.com/is/image) - kept as <img>; DM transformer converts later.
 * Generated: 2026-10-06
 */
function collectSlides(left, document) {
  if (!left) return [];
  let imgs = [...left.querySelectorAll('.carousel__item img')];
  if (!imgs.length) imgs = [...left.querySelectorAll('img')];
  const seen = new Set();
  const out = [];
  imgs.forEach((img) => {
    if (img.closest('.slick-cloned')) return;
    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    if (!src || seen.has(src)) return;
    seen.add(src);
    const p = document.createElement('p');
    p.appendChild(img);
    out.push(p);
  });
  return out;
}

function collectText(right) {
  const out = [];
  if (!right) return out;
  right.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol').forEach((el) => {
    if (out.some((o) => o.contains(el))) return;
    if (el.closest('.carousel, .slick-dots')) return;
    if (el.textContent.trim() === '') return;
    out.push(el);
  });
  return out;
}

export default function parse(element, { document }) {
  const wrapper = element.querySelector('.media-info__wrapper') || element;
  const left = wrapper.querySelector(':scope > .media-info__left')
    || element.querySelector('.carousel')?.closest('.media-info__left, .cmp-container');
  const right = wrapper.querySelector(':scope > .media-info__right')
    || element.querySelector('.media-info__right, .media-info__content');

  const slides = collectSlides(left, document);
  const text = collectText(right);

  if (!slides.length && !text.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[slides.length ? slides : '', text.length ? text : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-slider', cells });
  element.replaceWith(block);
}
