/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero. Source: https://www.destinationpet.com/
 * Instances: .hero.teaser (all content-landing-page pages).
 * UE model (blocks/hero-banner/_hero-banner.json): image (reference) + imageAlt (collapsed), text (richtext)
 * Rows: [image] / [text: H1 + optional description + optional CTA buttons]
 *
 * Selectors validated against migration-work/block-context/hero-banner/source.html + instances/01-05.html:
 *  - .hero__image img                       background image (Scene7 DM, kept as <img>)
 *  - .hero__content h1 (.cmp-title__text)   title
 *  - .hero__content-description p           description (empty on every cached instance -> dropped)
 *  - .hero__content-action a.button__bdl    CTA (life-at-dp "Join our pack™")
 * Generated: 2026-10-05
 */
function hint(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

export default function parse(element, { document }) {
  const image = element.querySelector('.hero__image img, .hero__container img');

  const content = element.querySelector('.hero__content') || element;
  const heading = content.querySelector('h1, h2, .cmp-title__text');

  // Description paragraphs - drop empty ones.
  const descriptions = [...content.querySelectorAll('.hero__content-description p, .hero__content-description .cmp-text p')]
    .filter((p) => p.textContent.trim() !== '');

  // CTA buttons: AEM button component renders <a class="button__bdl"><span></span><span class="button__text">Label</span></a>
  const ctas = [...content.querySelectorAll('.button a[href], a.button__bdl[href]')]
    .filter((a, i, arr) => arr.indexOf(a) === i)
    .map((a) => {
      const label = (a.querySelector('.button__text') || a).textContent.trim();
      if (!label) return null;
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = label;
      p.appendChild(link);
      return p;
    })
    .filter(Boolean);

  if (!image && !heading) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const textNodes = [];
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = heading.textContent.trim();
    textNodes.push(h1);
  }
  textNodes.push(...descriptions, ...ctas);

  const cells = [];
  cells.push([image ? hint(document, 'image', [image]) : '']);
  cells.push([textNodes.length ? hint(document, 'text', textNodes) : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
