/**
 * columns-links: equal-width columns whose cells hold only centered links.
 * A cell with a single bold/italic link renders as a button (via standard EDS
 * button decoration); a cell with several links (paragraphs or a list) renders
 * as a compact centered link list.
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  const cols = firstRow ? firstRow.children.length : 0;
  block.classList.add(`columns-links-${cols}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-links-row');
    [...row.children].forEach((cell) => {
      cell.classList.add('columns-links-col');
      const links = cell.querySelectorAll('a');
      if (links.length > 1) cell.classList.add('columns-links-list');
      else if (links.length === 1) cell.classList.add('columns-links-single');
      cell.querySelectorAll('ul, ol').forEach((list) => list.classList.add('columns-links-items'));
    });
  });
}
