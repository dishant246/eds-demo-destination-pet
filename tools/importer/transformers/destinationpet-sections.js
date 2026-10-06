/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: destinationpet.com section breaks + Section Metadata.
 *
 * Source model (verified in migration-work/cleaned.html, migration-work/pages/<page>/cleaned.html,
 * the live about-us/about DOM and migration-work/visual-trees.json): every source section is a
 * direct .aem-GridColumn child of the main content grid
 * (.root.responsivegrid.aem-GridColumn > .cmp-container > .aem-Grid). A section is styled when
 * it carries .background-color--{tertiary|secondary|primary}.
 *
 * Section entries (collected in document order):
 *   1. Template sections (payload.template.sections). Style = section.style, or - when the
 *      template style is null - derived from the element's background-color--* class
 *      (e.g. about-us/about "Our story" .mediainfo.background-color--tertiary).
 *   2. Every other top-level grid child. Style from its background-color--* class, or - for
 *      our-locations state wrappers - from a leading bg .columncontainer band (first child of the
 *      first .container__column). Only the band becomes the styled section; the logo grid after
 *      it falls into a following unstyled section.
 *
 * Breaks:
 *   - A leading <hr> before every entry except the first content of the page, so distinct
 *     source sections stay separate even when unstyled (sell-your-* "How selling works" / "FAQs",
 *     "Testimonials" / Jotform embed). Exception: consecutive unstyled .mediainfo siblings
 *     (about-us/about stagger run) stay in one section.
 *   - A trailing <hr> after every styled entry, so its style never spills into following content.
 *     Nested band ends are deferred to afterTransform (cards-logos uses
 *     ".columncontainer.background-color--primary + .columncontainer").
 *   - Existing neighbouring <hr>s are reused; afterTransform collapses any empty sections
 *     (e.g. our-locations empty "Oregon" wrapper removed by cleanup).
 */

const MARKER_ATTR = 'data-excat-section-style';
const TEMP_ATTR = 'data-excat-temp';
const END_ATTR = 'data-excat-generic-end';

const MAIN_GRID = '.root.responsivegrid.aem-GridColumn > .cmp-container > .aem-Grid';
const STYLE_CLASSES = [
  ['background-color--tertiary', 'tertiary'],
  ['background-color--secondary', 'secondary'],
  ['background-color--primary', 'primary'],
];
const BG_SELECTOR = STYLE_CLASSES.map(([cls]) => `.${cls}`).join(', ');
const CONTENT_TAGS = 'img, picture, video, iframe, svg, table, input, select, textarea, button, object, embed';

function isTopLevel(el) {
  const parent = el.parentElement;
  return !!parent && parent.matches(MAIN_GRID);
}

// section.selector is an array of candidate selectors - first match wins. When the page has
// the main content grid, only direct children of that grid are accepted.
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

function collectEntries(element, sections) {
  const entries = [];
  const handled = [];

  sections.forEach((section) => {
    const el = querySection(element, section.selector);
    if (!el || handled.includes(el)) return; // selector not on this page - skip, never guess
    handled.push(el);
    entries.push({ el, top: el, style: section.style || styleFor(el) });
  });

  element.querySelectorAll(MAIN_GRID).forEach((grid) => {
    [...grid.children].forEach((top) => {
      if (!top.classList.contains('aem-GridColumn')) return;
      if (handled.some((h) => h === top || h.contains(top) || top.contains(h))) return;

      const topStyle = styleFor(top);
      if (topStyle) {
        entries.push({ el: top, top, style: topStyle });
        return;
      }
      const firstCol = top.querySelector('.container__column');
      const band = firstCol && firstCol.firstElementChild;
      if (band && band.classList.contains('columncontainer') && band.matches(BG_SELECTOR)) {
        // nested heading bands are inset to the content width (top-level bands are full-bleed)
        entries.push({ el: band, top, style: `${styleFor(band)}, inset` });
        return;
      }
      entries.push({ el: top, top, style: null });
    });
  });

  // Document order (4 = Node.DOCUMENT_POSITION_FOLLOWING)
  entries.sort((a, b) => (a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1));
  return entries;
}

// Consecutive unstyled .mediainfo siblings (stagger run) share one section.
function isStaggerContinuation(prevEntry, entry) {
  if (!prevEntry || prevEntry.style || entry.style) return false;
  return entry.top === entry.el
    && entry.el.classList.contains('mediainfo')
    && prevEntry.el.classList.contains('mediainfo')
    && entry.el.previousElementSibling === prevEntry.el;
}

// Walk up from el (bounded by the top-level container) while el is the first
// (or last) element child, so breaks land at the real section boundary.
function edgeAncestor(el, top, dir) {
  let node = el;
  const sib = dir === 'prev' ? 'previousElementSibling' : 'nextElementSibling';
  while (node !== top && !node[sib] && node.parentElement) node = node.parentElement;
  return node;
}

// Remove <hr>s that would open an empty section (no content since the previous break).
function collapseEmptySections(element) {
  const doc = element.ownerDocument;
  const walker = doc.createTreeWalker(element, 1 | 4 /* SHOW_ELEMENT | SHOW_TEXT */);
  const toRemove = [];
  let hasContent = false;
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.nodeType === 3) {
      if (n.nodeValue.trim()) hasContent = true;
    } else if (n.tagName === 'HR' && !n.closest('table')) {
      if (!hasContent) toRemove.push(n);
      hasContent = false;
    } else if (n.matches(CONTENT_TAGS)) {
      hasContent = true;
    }
  }
  toRemove.forEach((hr) => hr.remove());
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  const doc = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    const entries = collectEntries(element, sections);
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const entry = entries[i];
      const { el, top, style } = entry;

      // Trailing break after styled sections. Top-level end nodes get the <hr> now;
      // nested band ends are deferred so no <hr> sits between band and logos during parsing.
      if (style) {
        const endNode = edgeAncestor(el, top, 'next');
        const next = endNode.nextElementSibling;
        if (next && !isHr(next)) {
          if (endNode === top) endNode.after(doc.createElement('hr'));
          else endNode.setAttribute(END_ATTR, 'true');
        }
      }

      if (isStaggerContinuation(entries[i - 1], entry)) continue;

      // Leading break (reuse an existing one). First content of the page gets no real
      // break - a temporary marker only when Section Metadata is needed.
      const startNode = edgeAncestor(el, top, 'prev');
      const prev = startNode.previousElementSibling;
      if (isHr(prev)) {
        if (style) prev.setAttribute(MARKER_ATTR, style);
        continue;
      }
      if (!prev && !style) continue;
      const hr = doc.createElement('hr');
      if (style) hr.setAttribute(MARKER_ATTR, style);
      if (!prev) hr.setAttribute(TEMP_ATTR, 'true');
      startNode.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Deferred trailing breaks for nested heading bands.
    element.querySelectorAll(`[${END_ATTR}]`).forEach((endNode) => {
      endNode.removeAttribute(END_ATTR);
      const next = endNode.nextElementSibling;
      if (next && !isHr(next)) endNode.after(doc.createElement('hr'));
    });

    element.querySelectorAll(`[${MARKER_ATTR}]`).forEach((marker) => {
      const style = marker.getAttribute(MARKER_ATTR);
      if (style) {
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style },
        });
        marker.after(metadataBlock);
      }
      marker.removeAttribute(MARKER_ATTR);
      if (marker.getAttribute(TEMP_ATTR) === 'true') marker.remove();
    });

    collapseEmptySections(element);
  }
}
