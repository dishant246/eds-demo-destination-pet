import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-circle-cta: 3-up grid of circular photos, each with a CTA button beneath.
 * Each authored row is one card: [image] | [p > a (button)].
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-circle-cta-card';
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      const hasPicture = !!div.querySelector('picture');
      const hasText = div.textContent.trim() !== '';
      if (!hasPicture && !hasText) div.remove();
      else if (hasPicture && !hasText) div.className = 'cards-circle-cta-card-image';
      else div.className = 'cards-circle-cta-card-body';
    });
    if (li.children.length) ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '500' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  block.textContent = '';
  block.append(ul);
}
