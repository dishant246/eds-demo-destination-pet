import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * carousel-steps: one-up step slider.
 * Each authored row is one step: [icon image] | [numbered step title (h3) + optional text].
 * The icon is stacked above the title; navigation is dots only.
 */

let instanceId = 0;

function setActive(block, index) {
  const slides = [...block.querySelectorAll('.carousel-steps-slide')];
  const dots = [...block.querySelectorAll('.carousel-steps-dot')];
  slides.forEach((slide, i) => {
    const active = i === index;
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a').forEach((a) => {
      if (active) a.removeAttribute('tabindex');
      else a.setAttribute('tabindex', '-1');
    });
  });
  dots.forEach((dot, i) => dot.setAttribute('aria-current', i === index ? 'true' : 'false'));
  block.dataset.activeSlide = index;
}

function showSlide(block, index) {
  const slides = block.querySelectorAll('.carousel-steps-slide');
  if (!slides.length) return;
  const target = (index + slides.length) % slides.length;
  block.querySelector('.carousel-steps-slides').scrollTo({ left: slides[target].offsetLeft, behavior: 'smooth' });
  setActive(block, target);
}

export default function decorate(block) {
  instanceId += 1;
  block.id = block.id || `carousel-steps-${instanceId}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const track = document.createElement('ul');
  track.className = 'carousel-steps-slides';

  [...block.children].forEach((row, idx) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-steps-slide';
    slide.id = `${block.id}-slide-${idx}`;
    moveInstrumentation(row, slide);

    [...row.children].forEach((cell) => {
      const hasPicture = !!cell.querySelector('picture');
      const hasText = cell.textContent.trim() !== '';
      if (!hasPicture && !hasText) return;
      if (hasPicture && !hasText) cell.className = 'carousel-steps-icon';
      else cell.className = 'carousel-steps-content';
      slide.append(cell);
    });
    if (!slide.children.length) return;

    const heading = slide.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && heading.id) slide.setAttribute('aria-labelledby', heading.id);
    track.append(slide);
  });

  track.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  block.textContent = '';
  const container = document.createElement('div');
  container.className = 'carousel-steps-container';
  container.append(track);
  block.append(container);

  const slides = [...track.children];
  if (slides.length > 1) {
    const nav = document.createElement('nav');
    nav.className = 'carousel-steps-nav';
    nav.setAttribute('aria-label', 'Carousel Slide Controls');
    const dots = document.createElement('ol');
    dots.className = 'carousel-steps-dots';
    slides.forEach((slide, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'carousel-steps-dot';
      btn.setAttribute('aria-label', `Show Slide ${i + 1} of ${slides.length}`);
      btn.setAttribute('aria-controls', slide.id);
      btn.addEventListener('click', () => showSlide(block, i));
      li.append(btn);
      dots.append(li);
    });
    nav.append(dots);
    block.append(nav);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(block, slides.indexOf(entry.target));
      });
    }, { root: track, threshold: 0.6 });
    slides.forEach((s) => observer.observe(s));
  }
  if (slides.length) setActive(block, 0);
}
