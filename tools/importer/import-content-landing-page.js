/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import columnsMediaParser from './parsers/columns-media.js';
import cardsValuesParser from './parsers/cards-values.js';
import cardsPromoParser from './parsers/cards-promo.js';
import quoteTestimonialParser from './parsers/quote-testimonial.js';
import cardsCircleCtaParser from './parsers/cards-circle-cta.js';
import cardsLogosParser from './parsers/cards-logos.js';
import carouselTestimonialParser from './parsers/carousel-testimonial.js';
import carouselStepsParser from './parsers/carousel-steps.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import accordionSplitParser from './parsers/accordion-split.js';
import videoOverlayParser from './parsers/video-overlay.js';
import embedFormParser from './parsers/embed-form.js';
import columnsLinksParser from './parsers/columns-links.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/destinationpet-cleanup.js';
import sectionsTransformer from './transformers/destinationpet-sections.js';
import dmImagesTransformer from './transformers/destinationpet-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'columns-media': columnsMediaParser,
  'cards-values': cardsValuesParser,
  'cards-promo': cardsPromoParser,
  'quote-testimonial': quoteTestimonialParser,
  'cards-circle-cta': cardsCircleCtaParser,
  'cards-logos': cardsLogosParser,
  'carousel-testimonial': carouselTestimonialParser,
  'carousel-steps': carouselStepsParser,
  'accordion-faq': accordionFaqParser,
  'accordion-split': accordionSplitParser,
  'video-overlay': videoOverlayParser,
  'embed-form': embedFormParser,
  'columns-links': columnsLinksParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "content-landing-page",
  "description": "Hero teaser banner followed by stacked content sections with two- and three-column card/teaser grids and call-to-action bands",
  "urls": [
    "https://www.destinationpet.com/",
    "https://www.destinationpet.com/about-us/about/",
    "https://www.destinationpet.com/about-us/get-in-touch/",
    "https://www.destinationpet.com/about-us/meet-the-team/business-development-leaders/",
    "https://www.destinationpet.com/about-us/meet-the-team/leadership/",
    "https://www.destinationpet.com/join-our-pack/find-a-veterinary-externship/",
    "https://www.destinationpet.com/join-our-pack/life-at-dp/",
    "https://www.destinationpet.com/live-webinar/",
    "https://www.destinationpet.com/live-webinar/webinar-redirect/",
    "https://www.destinationpet.com/live-webinar/webinar-registration/",
    "https://www.destinationpet.com/live-webinar/webinar-viewing-previous/",
    "https://www.destinationpet.com/live-webinar/webinars-for-pet/",
    "https://www.destinationpet.com/our-locations/",
    "https://www.destinationpet.com/sell-your-business/",
    "https://www.destinationpet.com/sell-your-business/sell-your-pet-resort/",
    "https://www.destinationpet.com/sell-your-business/sell-your-veterinary-practice/"
  ],
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".hero.teaser"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        ".mediainfo"
      ]
    },
    {
      "name": "cards-values",
      "instances": [
        ".columncontainer.remPaddingBottom",
        ".columncontainer:not(.remPaddingBottom):has(> .column-container > .container > .cmp-container > .row > .container__column:first-child > .infocards):not(:has(.info-card__text .button))"
      ]
    },
    {
      "name": "cards-promo",
      "instances": [
        ".infocards.info-card--center.remPaddingBottom"
      ]
    },
    {
      "name": "quote-testimonial",
      "instances": [
        ".container__column > .testimonialscard"
      ]
    },
    {
      "name": "cards-circle-cta",
      "instances": [
        ".columncontainer:has(> .column-container > .container > .cmp-container > .row > .container__column:first-child > .infocards .info-card__text > .cmp-container > .button:only-child)"
      ]
    },
    {
      "name": "cards-logos",
      "instances": [
        ".columncontainer.background-color--primary + .columncontainer"
      ]
    },
    {
      "name": "carousel-testimonial",
      "instances": [
        ".carousel.panelcontainer:has(.testimonialscard)"
      ]
    },
    {
      "name": "carousel-steps",
      "instances": [
        ".carousel.panelcontainer:has(.infocards)"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        ".container__column:not(.col-md-6) > .accordion.panelcontainer"
      ]
    },
    {
      "name": "accordion-split",
      "instances": [
        ".columncontainer:has(> .column-container > .container > .cmp-container > .row > .container__column.col-md-6 > .accordion)"
      ]
    },
    {
      "name": "video-overlay",
      "instances": [
        ".video:has(.video__overlay)"
      ]
    },
    {
      "name": "embed-form",
      "instances": [
        ".rawhtml:has(iframe)"
      ]
    },
    {
      "name": "columns-links",
      "instances": [
        ".columncontainer:has(> .column-container > .container > .cmp-container > .row > .container__column + .container__column > .button)",
        ".columncontainer:has(> .column-container > .container > .cmp-container > .row > .container__column > .link)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Hero banner",
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
      "name": "Who We Are",
      "selector": [
        ".mediainfo.media-info--padding-tb-sm"
      ],
      "style": null,
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "We work together to be...",
      "selector": [
        ".mediainfo + .columncontainer.background-color--tertiary.spacing__top-bottom--40px"
      ],
      "style": "tertiary",
      "blocks": [
        "cards-values"
      ],
      "defaultContent": [
        ".title.text-center",
        ".container__column > .button"
      ]
    },
    {
      "id": "4",
      "name": "Sell your business band",
      "selector": [
        ".columncontainer.spacing__top--40px"
      ],
      "style": null,
      "blocks": [
        "cards-promo"
      ],
      "defaultContent": []
    },
    {
      "id": "5",
      "name": "Testimonials",
      "selector": [
        ".columncontainer.spacing__top--40px + .columncontainer.background-color--tertiary.spacing__top-bottom--40px"
      ],
      "style": "tertiary",
      "blocks": [
        "quote-testimonial"
      ],
      "defaultContent": [
        ".title.text-center"
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
