import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Quote Testimonial: a single testimonial with decorative open/close quote marks.
 * Content contract (xwalk quote model): row 1 = quotation, row 2 = attribution (optional).
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [quotationRow, attributionRow] = rows;
  const figure = document.createElement('figure');
  figure.className = 'quote-testimonial-figure';
  const blockquote = document.createElement('blockquote');
  blockquote.className = 'quote-testimonial-quotation';

  if (quotationRow) {
    const cell = quotationRow.firstElementChild || quotationRow;
    moveInstrumentation(quotationRow, blockquote);
    blockquote.append(...cell.childNodes);
  }
  figure.append(blockquote);

  if (attributionRow && attributionRow.textContent.trim() !== '') {
    const cell = attributionRow.firstElementChild || attributionRow;
    const caption = document.createElement('figcaption');
    caption.className = 'quote-testimonial-attribution';
    moveInstrumentation(attributionRow, caption);
    caption.append(...cell.childNodes);
    caption.querySelectorAll('em').forEach((em) => {
      const cite = document.createElement('cite');
      cite.innerHTML = em.innerHTML;
      em.replaceWith(cite);
    });
    figure.append(caption);
  }

  block.textContent = '';
  block.append(figure);
}
