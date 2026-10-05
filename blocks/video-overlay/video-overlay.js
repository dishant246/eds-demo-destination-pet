import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * video-overlay: self-hosted video (.webm/.mp4) shown as a poster image with a
 * centered play button. Clicking the overlay swaps in a native <video> and plays it.
 * Content: [video link] and an optional [poster image] (any row/cell order).
 */

const MIME = {
  webm: 'video/webm',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  ogg: 'video/ogg',
  ogv: 'video/ogg',
};

function buildVideo(src, posterSrc, autoplay) {
  const video = document.createElement('video');
  video.className = 'video-overlay-video';
  video.setAttribute('controls', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', autoplay ? 'auto' : 'metadata');
  if (posterSrc) video.setAttribute('poster', posterSrc);
  const source = document.createElement('source');
  source.src = src;
  const ext = new URL(src, window.location.href).pathname.split('.').pop().toLowerCase();
  if (MIME[ext]) source.type = MIME[ext];
  video.append(source);
  if (autoplay) {
    video.addEventListener('canplay', () => {
      video.play().catch(() => { /* autoplay blocked: controls remain available */ });
    }, { once: true });
  }
  return video;
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const picture = block.querySelector('picture');
  const src = link ? link.href : '';
  block.textContent = '';
  if (!src) return;

  const stage = document.createElement('div');
  stage.className = 'video-overlay-stage';
  block.append(stage);

  const autoplay = block.classList.contains('autoplay')
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!picture || autoplay) {
    // no poster (or autoplay option): lazily attach the native player when in view
    const posterImg = picture && picture.querySelector('img');
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        const video = buildVideo(src, posterImg ? posterImg.src : '', autoplay);
        if (autoplay) {
          video.muted = true;
          video.setAttribute('loop', '');
        }
        stage.append(video);
      }
    });
    observer.observe(block);
    return;
  }

  const img = picture.querySelector('img');
  const optimized = createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1600' }, { width: '900' }]);
  const posterSrc = optimized.querySelector('img').src;

  const overlay = document.createElement('button');
  overlay.type = 'button';
  overlay.className = 'video-overlay-poster';
  overlay.setAttribute('aria-label', 'Play video');
  overlay.append(optimized);
  const play = document.createElement('span');
  play.className = 'video-overlay-play';
  play.setAttribute('aria-hidden', 'true');
  overlay.append(play);

  overlay.addEventListener('click', () => {
    const video = buildVideo(src, posterSrc, true);
    overlay.replaceWith(video);
    video.focus();
  }, { once: true });

  stage.append(overlay);
}
