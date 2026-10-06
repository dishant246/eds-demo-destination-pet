/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: destinationpet.com Dynamic Media / Scene7 images.
 * Source images are served from Scene7 IS/Image (images.destpet.com/is/image/destpet/...
 * vanity CNAME and s7d9.scene7.com/is/image/destpet/...), per migration-work/metadata.json
 * .images.mapping. Runs in afterTransform only so block parsers still see <img>.
 * Spec: excat-import-infrastructure/references/dm-scene7-transformer.md
 */

// ---- Begin canonical helpers (copy from dm-scene7-helpers.js) ----
function detectDynamicMediaUrl(urlStr) {
  let u;
  try { u = new URL(urlStr, 'https://x/'); } catch { return false; }
  // Scene7 detected by path alone — hostname is irrelevant because
  // customer sites routinely CNAME a vanity domain to Scene7 (e.g.
  // media-assets.brand.example). Keep byte-identical with dm-scene7-helpers.js.
  if (u.pathname.startsWith('/is/image/')) {
    return 'scene7';
  }
  if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname)
      && u.pathname.startsWith('/adobe/assets/urn:')) {
    return 'dm-openapi';
  }
  return false;
}

// Walk up from a DM <img> through allow-listed inline wrappers (currently
// just <picture>) to find the carrier anchor for the linked-image
// round-trip. Returns the outer <a> when the img is the sole meaningful
// descendant; null otherwise. Keep byte-identical with dm-scene7-helpers.js.
const LINKED_DM_INLINE_WRAPPER_TAGS = new Set(['PICTURE']);
const LINKED_DM_WRAPPER_SIBLING_TAGS = new Set(['SOURCE']); // standard <picture> siblings
function findLinkedDmCarrier(img) {
  if (!img || !img.parentElement) return null;
  let node = img;
  let parent = img.parentElement;
  while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
    let foundNode = false;
    for (const child of parent.children) {
      if (child === node) {
        foundNode = true;
      } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
        return null;
      }
    }
    if (!foundNode) return null;
    node = parent;
    parent = parent.parentElement;
  }
  if (!parent || parent.tagName !== 'A') return null;
  if (parent.children.length !== 1 || parent.children[0] !== node) return null;
  if (parent.textContent.trim() !== '') return null;
  return parent;
}

const EMPTY_ALT_SENTINEL = 'Image without alt text';

function altToLinkText(alt) {
  return alt || EMPTY_ALT_SENTINEL;
}
// ---- End canonical helpers ----

// Drop cache-busting / delivery params (ts, dpr, fmt) — scripts.js rebuilds renditions with its own
// wid/fmt. Keeps presets such as $Square$ / $Rectangle$ verbatim (literal $). Leaves a single query
// pair at most, so the URL carries no '&' (bare '&' breaks the xwalk JCR XML attribute values).
const DROP_DM_PARAMS = ['ts', 'dpr', 'fmt'];
function normalizeDmUrl(src) {
  const qIdx = src.indexOf('?');
  if (qIdx < 0) return src;
  const kept = src.slice(qIdx + 1).split('&')
    .filter((pair) => pair && !DROP_DM_PARAMS.includes(pair.split('=')[0]));
  return kept.length ? `${src.slice(0, qIdx)}?${kept.join('&')}` : src.slice(0, qIdx);
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const doc = element.ownerDocument;

  element.querySelectorAll('img').forEach((img) => {
    const rawSrc = img.getAttribute('src') || '';
    if (!detectDynamicMediaUrl(rawSrc)) return;
    const src = normalizeDmUrl(rawSrc);

    // Preserve alt verbatim; empty alt -> visible sentinel (auto-block maps it back to alt="").
    const alt = img.getAttribute('alt') || '';

    // Linked image (incl. parser-wrapped `<a><picture><img></picture></a>`).
    const linkedAnchor = findLinkedDmCarrier(img);
    if (linkedAnchor) {
      linkedAnchor.setAttribute('title', src);
      linkedAnchor.textContent = altToLinkText(alt);
      return;
    }

    // Inside an anchor but mixed content — no clean markdown representation; skip.
    const parent = img.parentElement;
    if (parent && parent.tagName === 'A') {
      // eslint-disable-next-line no-console
      console.warn('DM image inside mixed-content anchor, skipped:', src);
      return;
    }

    // Unlinked image: create an anchor whose href is the DM URL.
    const a = doc.createElement('a');
    a.href = src;
    a.textContent = altToLinkText(alt);
    img.replaceWith(a);
  });
}
