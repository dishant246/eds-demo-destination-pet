import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * accordion-split: accordion groups laid out side by side.
 * Content contract (rows, in order):
 *   - group row: a single cell (or empty second cell) with the group title -> starts a new column
 *   - item row:  [item title] | [item body rich text] -> added to the current group
 * Item rows before the first group row form an untitled first group.
 */

function isGroupRow(row) {
  const cells = [...row.children];
  if (cells.length === 1) return true;
  return cells.slice(1).every((c) => c.textContent.trim() === '' && !c.querySelector('picture, a'));
}

export default function decorate(block) {
  const rows = [...block.children];
  const groups = [];
  let current = null;

  const newGroup = (row) => {
    const group = document.createElement('div');
    group.className = 'accordion-split-group';
    const list = document.createElement('div');
    list.className = 'accordion-split-items';
    if (row) {
      moveInstrumentation(row, group);
      const title = document.createElement('div');
      title.className = 'accordion-split-group-title';
      title.append(...row.children[0].childNodes);
      group.append(title);
    }
    group.append(list);
    groups.push(group);
    return group;
  };

  rows.forEach((row) => {
    if (row.textContent.trim() === '') return;
    if (isGroupRow(row)) {
      current = newGroup(row);
      return;
    }
    if (!current) current = newGroup(null);
    const [labelCell, bodyCell] = row.children;

    const summary = document.createElement('summary');
    summary.className = 'accordion-split-item-label';
    summary.append(...labelCell.childNodes);
    bodyCell.className = 'accordion-split-item-body';

    const details = document.createElement('details');
    details.className = 'accordion-split-item';
    moveInstrumentation(row, details);
    details.append(summary, bodyCell);
    current.querySelector('.accordion-split-items').append(details);
  });

  block.textContent = '';
  block.append(...groups);
  block.dataset.groups = groups.length;
}
