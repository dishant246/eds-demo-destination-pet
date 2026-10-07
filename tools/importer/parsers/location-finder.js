/* eslint-disable */
/* global WebImporter */
/**
 * Parser for location-finder. Base: location-finder (custom). Source: https://www.destinationpet.com/our-locations/location/
 * Instance: .centerlocator (AEM platform/components/content/centerlocator).
 * UE model (blocks/location-finder/_location-finder.json): text (richtext), source (text),
 *   placeholder (text), noResults (richtext). The "Map view" switch label is a fixed UI string
 *   in the block (CSS ::after content on the source, never authored).
 * Rows: [h1 + intro p] / [GeoJSON URL] / [search placeholder] / [no-results h2 + p]
 *
 * Source DOM (verified on the live page):
 *  - .search_section .cmp-text h1 / p          intro
 *  - #searchBar[placeholder]                    "Enter a location"
 *  - .toggle_result                             switch; its "Map view" label is CSS ::after content
 *  - #noCenter.no_centers h2 + p                no-results message
 *  - centerlocator clientlib: map.data.loadGeoJson("/content/dam/yourgi/us/en/events/location.json")
 * Generated: 2026-10-07
 */
const DATA_PATH = '/content/dam/yourgi/us/en/events/location.json';

function hint(document, field, nodes) {
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

function textEl(document, tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

export default function parse(element, { document, params }) {
  const search = element.querySelector('.search_section') || element;
  const heading = search.querySelector('h1, h2');
  const intro = [...search.querySelectorAll('.cmp-text p')].filter((p) => p.textContent.trim());
  const input = element.querySelector('#searchBar, input[type="text"]');
  const noCenter = element.querySelector('#noCenter, .no_centers');

  if (!heading && !input) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const introNodes = [];
  if (heading) introNodes.push(textEl(document, 'h1', heading.textContent.trim()));
  intro.forEach((p) => introNodes.push(textEl(document, 'p', p.textContent.trim())));

  // the GeoJSON feed lives on the source site (served with Access-Control-Allow-Origin: *)
  const origin = new URL((params && params.originalURL) || 'https://www.destinationpet.com/').origin;
  const source = `${origin}${DATA_PATH}`;

  const emptyNodes = [];
  if (noCenter) {
    const h = noCenter.querySelector('h2, h3');
    const p = noCenter.querySelector('p');
    if (h) emptyNodes.push(textEl(document, 'h2', h.textContent.trim()));
    if (p) emptyNodes.push(textEl(document, 'p', p.textContent.trim()));
  }

  const cells = [
    [hint(document, 'text', introNodes)],
    [hint(document, 'source', [document.createTextNode(source)])],
    [hint(document, 'placeholder', [document.createTextNode((input && input.getAttribute('placeholder')) || 'Enter a location')])],
    [hint(document, 'noResults', emptyNodes)],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'location-finder', cells });
  element.replaceWith(block);
}
