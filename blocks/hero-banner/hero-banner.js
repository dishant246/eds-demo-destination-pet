import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// The hero is a 640px-tall object-fit:cover crop, so the default 750px mobile
// rendition gets upscaled and looks soft. Serve a wider one for small screens.
const MOBILE_HERO_WIDTH = 1500;

/**
 * Swaps the width param (Scene7 `wid`, DM Open API / EDS `width`) in a rendition
 * URL. Plain string replacement keeps literal `$` in Scene7 presets (`?$Rectangle$`).
 * @param {string} url
 * @param {number} width
 * @returns {string}
 */
function withWidth(url, width) {
  return url.replace(/([?&])(wid|width)=\d+/, `$1$2=${width}`);
}

/**
 * Upgrades the mobile (no media query) sources and the fallback <img> of the
 * hero picture to MOBILE_HERO_WIDTH; desktop sources stay as built.
 * @param {HTMLPictureElement} picture
 */
function sharpenMobileRendition(picture) {
  picture.querySelectorAll('source:not([media])').forEach((source) => {
    source.srcset = withWidth(source.getAttribute('srcset'), MOBILE_HERO_WIDTH);
  });
  const img = picture.querySelector('img');
  if (!img) return;
  img.src = withWidth(img.getAttribute('src'), MOBILE_HERO_WIDTH);
  // LCP image: never lazy
  img.loading = 'eager';
  img.fetchPriority = 'high';
}

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
      media.querySelectorAll('picture').forEach(sharpenMobileRendition);
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
