import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hero Banner: full-bleed background image with centered overlaid heading.
 * Content contract (xwalk hero model): row 1 = image, row 2 = rich text (H1, optional copy/CTA).
 * Tolerates rows in any order, a missing image, or extra text rows.
 * @param {Element} block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'hero-banner-media';
  const content = document.createElement('div');
  content.className = 'hero-banner-content';

  [...block.children].forEach((row) => {
    const pic = row.querySelector('picture');
    const hasText = [...row.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, a')]
      .some((el) => !el.querySelector('picture') && el.textContent.trim() !== '');
    if (pic && !hasText) {
      const img = pic.querySelector('img');
      if (img) {
        const optimized = createOptimizedPicture(img.src, img.alt, true, [{ width: '2000' }]);
        moveInstrumentation(img, optimized.querySelector('img'));
        pic.replaceWith(optimized);
      }
      moveInstrumentation(row, media);
      media.append(...row.querySelectorAll('picture'));
    } else if (row.textContent.trim() !== '' || pic) {
      const cell = row.firstElementChild || row;
      moveInstrumentation(row, content);
      content.append(...cell.childNodes);
    }
  });

  // drop empty paragraphs (e.g. an empty description field)
  content.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('picture, img, a')) p.remove();
  });

  block.textContent = '';
  if (media.children.length) block.append(media);
  else block.classList.add('hero-banner-no-image');
  block.append(content);
}
