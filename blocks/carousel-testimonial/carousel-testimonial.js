import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * carousel-testimonial: text-only testimonial slider.
 * Each authored row is one slide: [optional (usually empty) image] | [quote + attribution].
 * Navigation is dots only (no prev/next arrows); images are ignored.
 */

let instanceId = 0;

function setActive(block, index) {
  const slides = [...block.querySelectorAll('.carousel-testimonial-slide')];
  const dots = [...block.querySelectorAll('.carousel-testimonial-dot')];
  slides.forEach((slide, i) => {
    const active = i === index;
    slide.setAttribute('aria-hidden', !active);
    slide.querySelectorAll('a').forEach((a) => {
      if (active) a.removeAttribute('tabindex');
      else a.setAttribute('tabindex', '-1');
    });
  });
  dots.forEach((dot, i) => {
    dot.setAttribute('aria-current', i === index ? 'true' : 'false');
  });
  block.dataset.activeSlide = index;
}

function showSlide(block, index) {
  const slides = block.querySelectorAll('.carousel-testimonial-slide');
  if (!slides.length) return;
  const target = (index + slides.length) % slides.length;
  const track = block.querySelector('.carousel-testimonial-slides');
  track.scrollTo({ left: slides[target].offsetLeft, behavior: 'smooth' });
  setActive(block, target);
}

export default function decorate(block) {
  instanceId += 1;
  block.id = block.id || `carousel-testimonial-${instanceId}`;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const track = document.createElement('ul');
  track.className = 'carousel-testimonial-slides';

  const rows = [...block.children];
  rows.forEach((row, idx) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-testimonial-slide';
    slide.id = `${block.id}-slide-${idx}`;
    moveInstrumentation(row, slide);

    const content = document.createElement('div');
    content.className = 'carousel-testimonial-content';
    [...row.children].forEach((cell) => {
      // text-only: skip image-only / empty cells
      const text = cell.textContent.trim();
      if (!text) return;
      cell.querySelectorAll('picture').forEach((p) => p.remove());
      content.append(...cell.childNodes);
    });
    if (!content.childNodes.length) return;

    const quote = document.createElement('blockquote');
    quote.className = 'carousel-testimonial-quote';
    quote.append(content);
    slide.append(quote);
    track.append(slide);
  });

  block.textContent = '';
  const container = document.createElement('div');
  container.className = 'carousel-testimonial-container';
  container.append(track);
  block.append(container);

  const slides = [...track.children];
  if (slides.length > 1) {
    const nav = document.createElement('nav');
    nav.className = 'carousel-testimonial-nav';
    nav.setAttribute('aria-label', 'Carousel Slide Controls');
    const dots = document.createElement('ol');
    dots.className = 'carousel-testimonial-dots';
    slides.forEach((slide, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'carousel-testimonial-dot';
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
