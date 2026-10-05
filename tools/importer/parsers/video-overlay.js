/* eslint-disable */
/* global WebImporter */
/**
 * Parser for video-overlay. Base: video. Source: https://www.destinationpet.com/join-our-pack/life-at-dp/
 * Instances: .video:has(.video__overlay) (native <video> with play-button overlay).
 * UE model (blocks/video-overlay/_video-overlay.json): uri (aem-content), classes (skipped),
 *   placeholder_image (reference) + placeholder_imageAlt (collapsed).
 * Rows: [uri: link to video source] / [placeholder_image: poster image (optional, empty cell when absent)].
 *
 * Selectors validated against migration-work/block-context/video-overlay/source.html:
 *  - video > source[src]   Scene7 /is/content/ .webm URL (5 identical <source> tags -> first one used)
 *  - video[poster] / img   poster (not present on the cached instance; handled when present)
 *  - dropped: .video__overlay play button, "Your browser does not support HTML video." fallback text
 * Generated: 2026-10-05
 */
function hint(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

export default function parse(element, { document }) {
  const video = element.querySelector('video');
  const sourceEl = element.querySelector('video source[src], video[src]');
  let src = sourceEl ? sourceEl.getAttribute('src') : '';
  if (!src) {
    const a = element.querySelector('a[href*=".mp4"], a[href*=".webm"], a[href*="/is/content/"]');
    if (a) src = a.getAttribute('href');
  }

  let poster = element.querySelector('.video__container img, img');
  const posterSrc = video && video.getAttribute('poster');
  if (!poster && posterSrc) {
    poster = document.createElement('img');
    poster.src = posterSrc;
    poster.alt = video.getAttribute('aria-label') || video.getAttribute('title') || '';
  }

  if (!src) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const link = document.createElement('a');
  link.href = src;
  link.textContent = src;

  const cells = [];
  cells.push([hint(document, 'uri', [link])]);
  cells.push([poster ? hint(document, 'placeholder_image', [poster]) : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'video-overlay', cells });
  element.replaceWith(block);
}
