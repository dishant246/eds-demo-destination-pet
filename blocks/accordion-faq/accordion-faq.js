import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * accordion-faq: full-width FAQ list.
 * Each authored row is one item: [question] | [answer rich text].
 * The first item is open by default.
 */
export default function decorate(block) {
  const items = [];
  [...block.children].forEach((row) => {
    const [labelCell, bodyCell] = row.children;
    if (!labelCell || labelCell.textContent.trim() === '') {
      row.remove();
      return;
    }
    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    summary.append(...labelCell.childNodes);

    const body = bodyCell || document.createElement('div');
    body.className = 'accordion-faq-item-body';

    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    moveInstrumentation(row, details);
    details.append(summary, body);
    row.replaceWith(details);
    items.push(details);
  });
  if (items.length) items[0].open = true;
}
