import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * The source serves `$Rectangle$` Scene7 assets as the preset's fixed 533x300 transparent
 * canvas (artwork at native size, centred) and stretches that canvas to the card width.
 * The global DM renderer appends wid/fmt/fit=constrain, which trims the canvas to the bare
 * artwork (rendering icons far too large and without alpha). Serve the preset canvas as-is.
 * @param {HTMLPictureElement} picture
 */
function usePresetCanvas(picture) {
  const img = picture.querySelector('img');
  const src = img?.getAttribute('src') || '';
  if (!src.includes('$Rectangle$')) return;
  const [base, query = ''] = src.split('?');
  const params = query.split('&').filter((p) => p && !/^(wid|fmt|fit)=/.test(p));
  picture.querySelectorAll('source').forEach((source) => source.remove());
  img.src = `${base}?${params.join('&')}`;
  img.width = 533;
  img.height = 300;
}

/**
 * cards-values: each authored row is one card ([image] | [rich text]).
 * Rows are converted to a list; image-only cells become the card media.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-values-card';
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.querySelector('picture') && div.textContent.trim() === '') div.className = 'cards-values-card-image';
      else div.className = 'cards-values-card-body';
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
    usePresetCanvas(optimized);
  });
  block.textContent = '';
  block.append(ul);
}
