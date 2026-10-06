import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * cards-logos: borderless grid of linked logos with an optional caption.
 * Each authored row is one logo: [image (optionally wrapped in a link)] | [optional caption]
 * | [optional link-only cell]. A link-only cell (or a link around the picture) makes the
 * logo clickable.
 * Column count follows the item count: 1-2 -> 2, 3/5/6 -> 3, 4/7+ -> 4.
 */

function columnsFor(count) {
  if (count <= 2) return 2;
  if (count === 4 || count >= 7) return 4;
  return 3;
}

/**
 * Source logos are `$Square$` Scene7 presets: a fixed 300x300 transparent canvas with the
 * artwork at native size. The global DM renderer appends wid/fmt/fit=constrain, which trims
 * the canvas to the bare artwork so small logos get blown up. Serve the preset canvas as-is.
 * @param {HTMLPictureElement} picture
 */
function usePresetCanvas(picture) {
  const img = picture.querySelector('img');
  const src = img?.getAttribute('src') || '';
  if (!src.includes('$Square$')) return;
  const [base, query = ''] = src.split('?');
  const params = query.split('&').filter((p) => p && !/^(wid|fmt|fit)=/.test(p));
  picture.querySelectorAll('source').forEach((source) => source.remove());
  img.src = `${base}?${params.join('&')}`;
  img.width = 300;
  img.height = 300;
}

function isLinkOnly(cell) {
  const links = cell.querySelectorAll('a');
  return links.length === 1 && !cell.querySelector('picture')
    && cell.textContent.trim() === links[0].textContent.trim();
}

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-logos-card';
    moveInstrumentation(row, li);

    const cells = [...row.children];
    const picture = row.querySelector('picture');
    let href = picture?.closest('a')?.href;
    let title = '';
    const linkCell = cells.find((c) => isLinkOnly(c));
    if (linkCell) {
      const a = linkCell.querySelector('a');
      href = href || a.href;
      title = a.title || '';
    }

    if (picture) {
      const media = document.createElement('div');
      media.className = 'cards-logos-card-image';
      const img = picture.querySelector('img');
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      usePresetCanvas(optimized);
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        if (title) a.title = title;
        if (!img.alt) a.setAttribute('aria-label', title || href);
        if (new URL(href, window.location.href).origin !== window.location.origin) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
        a.append(optimized);
        media.append(a);
      } else {
        media.append(optimized);
      }
      li.append(media);
    }

    cells.forEach((cell) => {
      if (cell === linkCell || cell.querySelector('picture')) return;
      if (cell.textContent.trim() === '') return;
      cell.className = 'cards-logos-card-caption';
      li.append(cell);
    });

    if (li.children.length) ul.append(li);
  });

  block.textContent = '';
  block.classList.add(`cards-logos-cols-${columnsFor(ul.children.length)}`);
  block.append(ul);
}
