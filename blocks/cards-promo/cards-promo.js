import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-promo: each authored row is one card ([image] | [rich text]).
 * Rows are converted to a list; image-only cells become the card media.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-promo-card';
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.querySelector('picture') && div.textContent.trim() === '') div.className = 'cards-promo-card-image';
      else div.className = 'cards-promo-card-body';
    });
    // drop empty cells (e.g. an omitted image)
    [...li.children].forEach((div) => {
      if (!div.children.length && div.textContent.trim() === '') div.remove();
    });
    if (li.children.length) ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });
  block.textContent = '';
  block.append(ul);
}
