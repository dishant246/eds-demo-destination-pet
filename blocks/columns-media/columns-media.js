import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Columns Media: side-by-side media + text columns (1 row x 2 cells: [image] | [h2, h3, p]).
 * Works with any number of cells/rows; image-only cells become media columns.
 * @param {Element} block
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const cols = firstRow ? [...firstRow.children] : [];
  block.classList.add(`columns-media-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-media-row');
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      const textless = col.textContent.trim() === '';
      if (pic && textless) {
        col.classList.add('columns-media-img-col');
        col.querySelectorAll('picture > img').forEach((img) => {
          const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]);
          moveInstrumentation(img, optimized.querySelector('img'));
          img.closest('picture').replaceWith(optimized);
        });
      } else {
        col.classList.add('columns-media-text-col');
      }
    });
  });
}
