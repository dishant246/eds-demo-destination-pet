/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import columnsSliderParser from './parsers/columns-slider.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/destinationpet-cleanup.js';
import sectionsTransformer from './transformers/destinationpet-sections.js';
import dmImagesTransformer from './transformers/destinationpet-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'columns-slider': columnsSliderParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "hero-feature-showcase",
  "description": "Hero teaser banner followed by a grouped feature row, a standalone content band, and two- and three-column grids",
  "urls": [
    "https://www.destinationpet.com/about-us/destination-pet-foundation/"
  ],
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".hero.teaser"
      ]
    },
    {
      "name": "columns-slider",
      "instances": [
        ".mediainfo:has(.carousel.panelcontainer)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Hero",
      "selector": [
        ".hero.teaser"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "Mission Statement",
      "selector": [
        ".hero.teaser + .columncontainer"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "h1",
        ".cmp-text p",
        ".button"
      ]
    },
    {
      "id": "3",
      "name": "About Us panel",
      "selector": [
        ".image.image__center"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "img"
      ]
    },
    {
      "id": "4",
      "name": "Our Impact in Action",
      "selector": [
        ".mediainfo:has(.carousel.panelcontainer)"
      ],
      "style": null,
      "blocks": [
        "columns-slider"
      ],
      "defaultContent": []
    },
    {
      "id": "5",
      "name": "Donate Today CTA",
      "selector": [
        ".mediainfo + .columncontainer"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".button"
      ]
    }
  ]
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata, then DM image carriers
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  dmImagesTransformer,
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Initial cleanup + template section breaks
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks using the embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements detached by an earlier parser, e.g. cards-logos absorbed rows)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup, section metadata, DM image carriers
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path; root URL maps to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: [...new Set(pageBlocks.map((b) => b.name))],
      },
    }];
  },
};
