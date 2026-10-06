import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * columns-slider: two columns - an image slider beside a text column.
 * Content contract: 1 row x 2 cells: [N images, one per paragraph] | [h2 + paragraphs].
 * The image-only cell becomes a center-mode slider (one slide in focus, partial neighbours),
 * navigated by dots (no arrows), swipe / scroll-snap and keyboard.
 */

let instanceId = 0;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// the source slider auto-advances about every 4s and loops
const AUTOPLAY_MS = 4000;

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
  track.scrollTo({
    left: slideOffset(track, slides[target]),
    behavior: smooth && !reducedMotion() ? 'smooth' : 'auto',
  });
  setActive(slider, target);
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

    // keep UE instrumentation from the authored wrapper (p) or the picture itself
    const wrapper = picture.parentElement !== col && picture.parentElement.tagName === 'P'
      ? picture.parentElement : null;
    if (wrapper) moveInstrumentation(wrapper, slide);

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
    btn.addEventListener('click', () => showSlide(slider, i));
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

  // sync the current dot with swipe / scroll-snap
  let frame;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => setActive(slider, nearestSlide(track)));
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

  // autoplay: advance and loop; pauses on hover, keyboard focus and hidden tabs, restarts after a
  // dot is chosen, and never runs with prefers-reduced-motion
  if (!reducedMotion()) {
    let timer = null;
    let hovered = false;
    let focused = false;
    const stop = () => {
      clearInterval(timer);
      timer = null;
      track.setAttribute('aria-live', 'polite');
    };
    const start = () => {
      stop();
      if (hovered || focused || document.hidden) return;
      track.setAttribute('aria-live', 'off');
      timer = setInterval(() => {
        showSlide(slider, (Number(slider.dataset.activeSlide || 0) + 1) % slides.length);
      }, AUTOPLAY_MS);
    };
    slider.addEventListener('mouseenter', () => {
      hovered = true;
      stop();
    });
    slider.addEventListener('mouseleave', () => {
      hovered = false;
      start();
    });
    slider.addEventListener('focusin', () => {
      focused = true;
      stop();
    });
    slider.addEventListener('focusout', (e) => {
      if (slider.contains(e.relatedTarget)) return;
      focused = false;
      start();
    });
    dots.addEventListener('click', start);
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
