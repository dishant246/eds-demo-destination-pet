import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * columns-slider: two columns - an image slider beside a text column.
 * Content contract: 1 row x 2 cells: [N images, one per paragraph] | [h2 + paragraphs].
 * The image-only cell becomes a center-mode slider (one slide in focus, partial neighbours),
 * navigated by dots (no arrows), touch swipe / mouse drag and keyboard.
 */

let instanceId = 0;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// the source slider (slick, autoplaySpeed 3000 restarted after each 500ms move) starts a move
// every 3.5s and does not loop: it runs to the last slide, then back to the first (ping-pong)
const AUTOPLAY_MS = 3500;

// every move takes 500ms whatever the distance, with the CSS 'ease' curve (slick speed / cssEase)
const TRANSITION_MS = 500;

// a swipe / drag changes the slide once it passes 1/5 of the track width (slick touchThreshold 5)
const SWIPE_FRACTION = 0.2;

// drags shorter than this are treated as taps / clicks
const DRAG_START_PX = 5;

// in-flight programmatic scroll animation per track; scroll-sync is ignored while one runs
const animations = new WeakMap();

/* CSS 'ease' = cubic-bezier(0.25, 0.1, 0.25, 1), solved for x by bisection */
function ease(t) {
  const bezier = (p1, p2, s) => 3 * p1 * s * (1 - s) ** 2 + 3 * p2 * s * s * (1 - s) + s ** 3;
  let lo = 0;
  let hi = 1;
  let s = t;
  for (let i = 0; i < 20; i += 1) {
    s = (lo + hi) / 2;
    if (bezier(0.25, 0.25, s) < t) lo = s;
    else hi = s;
  }
  return bezier(0.1, 1, s);
}

function stopAnimation(track) {
  cancelAnimationFrame(animations.get(track));
  animations.delete(track);
}

/* scroll the track to `left` in TRANSITION_MS (or instantly) */
function scrollTrack(track, left, smooth) {
  stopAnimation(track);
  const from = track.scrollLeft;
  if (!smooth || Math.abs(left - from) < 1) {
    track.scrollLeft = left;
    return;
  }
  const t0 = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - t0) / TRANSITION_MS);
    track.scrollLeft = from + (left - from) * ease(progress);
    if (progress < 1) animations.set(track, requestAnimationFrame(step));
    else animations.delete(track);
  };
  animations.set(track, requestAnimationFrame(step));
}

function setActive(slider, index) {
  slider.querySelectorAll('.columns-slider-slide').forEach((slide, i) => {
    slide.classList.toggle('is-active', i === index);
  });
  slider.querySelectorAll('.columns-slider-dot').forEach((dot, i) => {
    dot.setAttribute('aria-current', i === index ? 'true' : 'false');
    dot.tabIndex = i === index ? 0 : -1;
  });
  slider.dataset.activeSlide = index;
}

/* scroll offset that centres the given slide in the track */
function slideOffset(track, slide) {
  return slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
}

function showSlide(slider, index, smooth = true) {
  const track = slider.querySelector('.columns-slider-slides');
  const slides = [...track.children];
  if (!slides.length) return;
  const target = Math.max(0, Math.min(index, slides.length - 1));
  // the dot changes once, to the target, when the move starts
  setActive(slider, target);
  scrollTrack(track, slideOffset(track, slides[target]), smooth && !reducedMotion());
}

/* the slide whose centre is nearest the track's centre is the current one */
function nearestSlide(track) {
  const slides = [...track.children];
  const center = track.scrollLeft + track.clientWidth / 2;
  let best = 0;
  let bestDist = Infinity;
  slides.forEach((slide, i) => {
    const dist = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

function buildSlider(col, id) {
  const pictures = [...col.querySelectorAll('picture')];
  const slider = document.createElement('div');
  slider.className = 'columns-slider-slider';
  slider.id = id;
  slider.setAttribute('role', 'region');
  slider.setAttribute('aria-roledescription', 'carousel');
  slider.setAttribute('aria-label', 'Image slider');

  const track = document.createElement('ul');
  track.className = 'columns-slider-slides';
  track.setAttribute('aria-live', 'polite');

  pictures.forEach((picture, i) => {
    const slide = document.createElement('li');
    slide.className = 'columns-slider-slide';
    slide.id = `${id}-slide-${i}`;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${pictures.length}`);

    // keep UE instrumentation from the authored wrapper (p) or the picture itself (Dynamic Media
    // images are rebuilt from image links and carry the link's instrumentation on the picture)
    const wrapper = picture.parentElement !== col && picture.parentElement.tagName === 'P'
      ? picture.parentElement : null;
    if (wrapper) moveInstrumentation(wrapper, slide);
    moveInstrumentation(picture, slide);

    const img = picture.querySelector('img');
    let media = picture;
    if (img) {
      media = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, media.querySelector('img'));
    }
    // a linked image keeps its link around the picture
    const link = picture.closest('a');
    if (link && col.contains(link)) {
      link.replaceChildren(media);
      media = link;
    }
    slide.append(media);
    track.append(slide);
  });

  slider.append(track);
  col.textContent = '';
  col.append(slider);

  const slides = [...track.children];
  if (slides.length < 2) {
    slider.classList.add('columns-slider-single');
    if (slides.length) setActive(slider, 0);
    return;
  }

  // set once autoplay is wired up: restarts its timer after the user changes the slide
  let restartAutoplay = () => {};

  const nav = document.createElement('div');
  nav.className = 'columns-slider-nav';
  const dots = document.createElement('ol');
  dots.className = 'columns-slider-dots';
  dots.setAttribute('aria-label', 'Choose slide to display');
  slides.forEach((slide, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'columns-slider-dot';
    btn.setAttribute('aria-label', `Show slide ${i + 1} of ${slides.length}`);
    btn.setAttribute('aria-controls', slide.id);
    btn.addEventListener('click', () => {
      showSlide(slider, i);
      restartAutoplay();
    });
    li.append(btn);
    dots.append(li);
  });

  // roving focus: arrows / Home / End move between dots and change the slide
  dots.addEventListener('keydown', (e) => {
    const current = Number(slider.dataset.activeSlide || 0);
    const keys = {
      ArrowRight: current + 1,
      ArrowDown: current + 1,
      ArrowLeft: current - 1,
      ArrowUp: current - 1,
      Home: 0,
      End: slides.length - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(keys[e.key], slides.length - 1));
    showSlide(slider, next);
    dots.querySelectorAll('.columns-slider-dot')[next].focus();
  });

  nav.append(dots);
  slider.append(nav);

  // touch swipe / mouse drag: the track follows the pointer; on release it moves one slide on
  // once the drag passes SWIPE_FRACTION of the track width, otherwise it snaps back
  let drag = null;
  let suppressClick = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      left: track.scrollLeft,
      from: Number(slider.dataset.activeSlide || 0),
      moved: false,
    };
  });
  track.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_START_PX) return;
      drag.moved = true;
      // capture only once dragging, so plain clicks / taps keep their target
      track.setPointerCapture(e.pointerId);
      slider.classList.add('is-dragging');
      stopAnimation(track);
      drag.left = track.scrollLeft;
    }
    track.scrollLeft = drag.left - dx;
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { moved, from, x } = drag;
    drag = null;
    if (!moved) return;
    slider.classList.remove('is-dragging');
    const dx = e.type === 'pointercancel' ? 0 : e.clientX - x;
    const threshold = track.clientWidth * SWIPE_FRACTION;
    let target = from;
    if (dx <= -threshold) target = from + 1;
    else if (dx >= threshold) target = from - 1;
    showSlide(slider, target);
    restartAutoplay();
    // a drag that started on a linked slide must not follow the link on release
    suppressClick = true;
    setTimeout(() => {
      suppressClick = false;
    });
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('click', (e) => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  // no native image / link drag-and-drop while dragging the slides with the mouse
  track.addEventListener('dragstart', (e) => e.preventDefault());

  // sync the current dot when the track scrolls by other means (e.g. focus moving into a slide);
  // ignored while a programmatic move or a drag is in flight, so the dot only changes once
  const busy = () => animations.has(track) || !!(drag && drag.moved);
  let frame;
  track.addEventListener('scroll', () => {
    if (busy()) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!busy()) setActive(slider, nearestSlide(track));
    });
  }, { passive: true });

  // keep the current slide centred across layout changes (resize / rotation)
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      showSlide(slider, Number(slider.dataset.activeSlide || 0), false);
    }).observe(track);
  }

  // the track is as tall as its tallest slide: once the slider nears the viewport, load every
  // slide image so the height (and the overlaid dots) settle before the user starts swiping
  const loadAll = () => track.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.loading = 'eager';
  });
  if (window.IntersectionObserver) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        io.disconnect();
        loadAll();
      }
    }, { rootMargin: '200px' });
    io.observe(slider);
  } else {
    loadAll();
  }

  // autoplay: ping-pong (first -> last -> first ...); pauses on mouse hover, keyboard focus and
  // hidden tabs, restarts after a dot / swipe / drag, and never runs with prefers-reduced-motion.
  // Touch taps do not pause it (hover is mouse-only, and tap focus is not keyboard focus).
  if (!reducedMotion()) {
    let timer = null;
    let hovered = false;
    let focused = false;
    let direction = 1;
    const stop = () => {
      clearInterval(timer);
      timer = null;
      track.setAttribute('aria-live', 'polite');
    };
    const advance = () => {
      if (drag && drag.moved) return;
      const current = Number(slider.dataset.activeSlide || 0);
      if (current >= slides.length - 1) direction = -1;
      else if (current <= 0) direction = 1;
      showSlide(slider, current + direction);
    };
    const start = () => {
      stop();
      if (hovered || focused || document.hidden) return;
      track.setAttribute('aria-live', 'off');
      timer = setInterval(advance, AUTOPLAY_MS);
    };
    restartAutoplay = start;
    slider.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      hovered = true;
      stop();
    });
    slider.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      hovered = false;
      start();
    });
    const keyboardFocus = () => {
      focused = true;
      stop();
    };
    slider.addEventListener('focusin', (e) => {
      if (e.target.matches(':focus-visible')) keyboardFocus();
    });
    // dots keyboard navigation moves focus programmatically: treat it as keyboard focus too
    dots.addEventListener('keydown', keyboardFocus);
    slider.addEventListener('focusout', (e) => {
      if (!focused || slider.contains(e.relatedTarget)) return;
      focused = false;
      start();
    });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  // always start at the first slide
  setActive(slider, 0);
  requestAnimationFrame(() => showSlide(slider, 0, false));
}

/**
 * @param {Element} block
 */
export default function decorate(block) {
  instanceId += 1;
  const firstRow = block.firstElementChild;
  const cols = firstRow ? [...firstRow.children] : [];
  block.classList.add(`columns-slider-${cols.length}-cols`);

  [...block.children].forEach((row, rowIdx) => {
    row.classList.add('columns-slider-row');
    [...row.children].forEach((col, colIdx) => {
      const hasPicture = !!col.querySelector('picture');
      const textless = col.textContent.trim() === '';
      if (hasPicture && textless) {
        col.classList.add('columns-slider-img-col');
        buildSlider(col, `columns-slider-${instanceId}-${rowIdx}-${colIdx}`);
      } else {
        col.classList.add('columns-slider-text-col');
      }
    });
  });
}
