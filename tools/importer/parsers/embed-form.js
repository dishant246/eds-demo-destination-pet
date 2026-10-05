/* eslint-disable */
/* global WebImporter */
/**
 * Parser for embed-form. Base: embed. Source: https://www.destinationpet.com/about-us/get-in-touch/
 * Instances: .rawhtml:has(iframe) (Jotform iframe embeds on get-in-touch and sell-your-business).
 * UE model (blocks/embed-form/_embed-form.json): embed_placeholder (reference) + embed_placeholderAlt (collapsed),
 *   embed_uri (text). Both share the "embed_" prefix -> grouped into ONE cell: [placeholder?, uri link].
 *
 * Selectors validated against migration-work/block-context/embed-form/source.html + instances/01.html:
 *  - iframe[src]   https://form.jotform.com/<id>?parentURL=...&jsForm=true
 *                  -> canonical form URL https://form.jotform.com/<id> (runtime query params dropped)
 *  - iframe[title] used as link text (falls back to the URL)
 * Generated: 2026-10-05
 */
function canonicalFormUrl(raw) {
  try {
    const u = new URL(raw, 'https://www.destinationpet.com/');
    if (/jotform/i.test(u.hostname)) return `${u.origin}${u.pathname}`;
    ['parentURL', 'jsForm'].forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch (e) {
    return raw;
  }
}

export default function parse(element, { document }) {
  const iframe = element.querySelector('iframe[src], iframe[data-src]');
  const raw = iframe ? (iframe.getAttribute('src') || iframe.getAttribute('data-src')) : '';
  if (!raw) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const url = canonicalFormUrl(raw);
  const link = document.createElement('a');
  link.href = url;
  link.textContent = (iframe.getAttribute('title') || '').trim() || url;

  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(' field:embed_uri '));
  frag.appendChild(link);

  const cells = [[frag]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-form', cells });
  element.replaceWith(block);
}
