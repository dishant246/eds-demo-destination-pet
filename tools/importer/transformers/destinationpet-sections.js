/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: destinationpet.com section breaks + Section Metadata.
 *
 * Two passes, both using the reference before/after-hook marker pattern:
 *
 * 1. Template-driven (payload.template.sections): one <hr> before each non-first
 *    section, Section Metadata for sections with a style. Each sections[] selector
 *    resolves via querySelector (first match only).
 *
 * 2. Generic background-style pass (gap pages - life-at-dp, our-locations, etc.),
 *    using querySelectorAll. Candidates (verified in migration-work/pages/<page>/cleaned.html):
 *      a) Top-level section containers: direct .aem-GridColumn children of the main
 *         content grid (.root.responsivegrid.aem-GridColumn > .cmp-container > .aem-Grid)
 *         carrying a .background-color--{tertiary|secondary|primary} class.
 *      b) Leading heading bands: a bg-coloured .columncontainer that is the FIRST child of
 *         the first .container__column of a top-level container. This is how our-locations
 *         renders its 31 navy state bands (div.columncontainer.background-color--primary
 *         nested at the top of each state wrapper, followed by the logo grid on white).
 *         Only the band itself becomes a "primary" section; the logos after it go into
 *         a following unstyled section. Deeper nested bg containers are ignored.
 *    Candidates inside (or equal to) an element already matched by a sections[] entry
 *    are skipped, so nothing is double-inserted (e.g. homepage sections 3 and 5).
 *    Each generic styled section gets a leading <hr> (unless it is first or already
 *    preceded by one) and a trailing <hr> (unless it is last or already followed by
 *    one), so its style does not bleed into the following content.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';
const GENERIC_MARKER_ATTR = 'data-excat-generic-section';
const GENERIC_END_ATTR = 'data-excat-generic-end';

const MAIN_GRID = '.root.responsivegrid.aem-GridColumn > .cmp-container > .aem-Grid';
const STYLE_CLASSES = [
  ['background-color--tertiary', 'tertiary'],
  ['background-color--secondary', 'secondary'],
  ['background-color--primary', 'primary'],
];
const BG_SELECTOR = STYLE_CLASSES.map(([cls]) => `.${cls}`).join(', ');

// section.selector is an array of candidate selectors - try each in order, first match wins.
// Sections are top-level content containers, so when the page has the AEM main content
// grid, only direct children of that grid are accepted. This prevents false matches on
// gap pages (e.g. our-locations, where ".columncontainer.spacing__top--40px" otherwise
// matches a nested logo grid and an <hr> would break the cards-logos "+" selector).
function isTopLevel(el) {
  const parent = el.parentElement;
  return !!parent && parent.matches(MAIN_GRID);
}
function querySection(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  const hasGrid = !!root.querySelector(MAIN_GRID);
  for (const sel of list) {
    if (!sel) continue;
    if (!hasGrid) {
      const el = root.querySelector(sel);
      if (el) return el;
      continue;
    }
    const el = [...root.querySelectorAll(sel)].find(isTopLevel);
    if (el) return el;
  }
  return null;
}

function styleFor(el) {
  for (const [cls, style] of STYLE_CLASSES) {
    if (el.classList.contains(cls)) return style;
  }
  return null;
}

function isHr(el) {
  return !!el && el.tagName === 'HR';
}

// Collect generic styled-section candidates in document order.
function findGenericCandidates(element, handled) {
  const out = [];
  const grids = element.querySelectorAll(MAIN_GRID);
  grids.forEach((grid) => {
    [...grid.children].forEach((top) => {
      if (!top.classList.contains('aem-GridColumn')) return;

      // a) Top-level container with background class
      const topStyle = styleFor(top);
      let candidate = null;
      if (topStyle) {
        candidate = { el: top, style: topStyle, top };
      } else {
        // b) Leading bg band at the top of the first content column
        const firstCol = top.querySelector('.container__column');
        const band = firstCol && firstCol.firstElementChild;
        if (band && band.classList.contains('columncontainer') && band.matches(BG_SELECTOR)) {
          candidate = { el: band, style: styleFor(band), top };
        }
      }
      if (!candidate) return;
      // Skip anything already owned by a sections[] entry (same element or inside it).
      if (handled.some((h) => h === candidate.el || h.contains(candidate.el))) return;
      out.push(candidate);
    });
  });
  return out;
}

// Walk up from el (bounded by the top-level container) while el is the first
// (or last) element child, so breaks land at the real section boundary.
function edgeAncestor(el, top, dir) {
  let node = el;
  const sib = dir === 'prev' ? 'previousElementSibling' : 'nextElementSibling';
  while (node !== top && !node[sib] && node.parentElement) node = node.parentElement;
  return node;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  const doc = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    // ---- Pass 1: template sections (reverse order) ----
    const handled = [];
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = querySection(element, section.selector);
      if (sectionEl) handled.push(sectionEl);
      if (i === 0 && !section.style) continue; // first section: no break, no metadata needed
      if (!sectionEl) continue; // selector not on this page - skip, never guess

      const hr = doc.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }

    // ---- Pass 2: generic background-style sections (reverse order) ----
    const candidates = findGenericCandidates(element, handled);
    for (let i = candidates.length - 1; i >= 0; i -= 1) {
      const { el, style, top } = candidates[i];
      const id = `g${i}`;

      // Trailing break so the style does not bleed into following content.
      // Walk up to the top-level container if the band is its last content.
      // Top-level end nodes get the <hr> now (they may be replaced by a parser).
      // Nested end nodes (heading bands) are deferred to afterTransform via an
      // attribute, so no <hr> sits between the band and its sibling during parsing
      // (cards-logos uses ".columncontainer.background-color--primary + .columncontainer").
      const endNode = edgeAncestor(el, top, 'next');
      const next = endNode.nextElementSibling;
      if (next && !isHr(next)) {
        if (endNode === top) endNode.after(doc.createElement('hr'));
        else endNode.setAttribute(GENERIC_END_ATTR, 'true');
      }

      // Leading break / marker. If the section is the very first content of the
      // page, the marker is temporary (no real leading break, like section 0).
      const startNode = edgeAncestor(el, top, 'prev');
      const prev = startNode.previousElementSibling;
      if (isHr(prev)) {
        prev.setAttribute(GENERIC_MARKER_ATTR, `${id}|${style}`);
      } else {
        const hr = doc.createElement('hr');
        hr.setAttribute(GENERIC_MARKER_ATTR, `${id}|${style}`);
        if (!prev) hr.setAttribute('data-excat-temp', 'true');
        startNode.before(hr);
      }
    }
  }

  if (hookName === 'afterTransform') {
    // ---- Pass 1: template sections ----
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue; // neither survived - skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }

    // ---- Pass 2: generic background-style sections ----
    // Deferred trailing breaks for nested heading bands.
    element.querySelectorAll(`[${GENERIC_END_ATTR}]`).forEach((endNode) => {
      endNode.removeAttribute(GENERIC_END_ATTR);
      const next = endNode.nextElementSibling;
      if (next && !isHr(next)) endNode.after(doc.createElement('hr'));
    });

    element.querySelectorAll(`[${GENERIC_MARKER_ATTR}]`).forEach((marker) => {
      const [, style] = (marker.getAttribute(GENERIC_MARKER_ATTR) || '').split('|');
      if (style) {
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style },
        });
        marker.after(metadataBlock);
      }
      marker.removeAttribute(GENERIC_MARKER_ATTR);
      if (marker.getAttribute('data-excat-temp') === 'true') marker.remove();
    });
  }
}
