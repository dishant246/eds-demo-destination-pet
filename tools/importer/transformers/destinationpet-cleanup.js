/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: destinationpet.com site-wide cleanup (AEM Sites Core Components, no <main>).
 *
 * All selectors verified in migration-work/cleaned.html and
 * migration-work/pages/{get-in-touch,life-at-dp,our-locations,sell-your-business,
 * sell-your-veterinary-practice}/cleaned.html.
 *
 * Page shell (same on every content-landing-page page):
 *   body > div.cmp-container (header wrapper; id differs per page, e.g. #container-b2b89b7b5a on home)
 *          > .aem-Grid > div.headerRedesign.aem-GridColumn > div.header.new > .ribbon + header.header__main.sticky
 *   body > div.root.responsivegrid  (page content - KEEP)
 *   body > div.cmp-container (footer wrapper; id differs per page)
 *          > .aem-Grid > div.footer.aem-GridColumn > div.footer > .footer__wrapper ...
 *                 (contains article.cmp-contentfragment--contact-info inside .contentfragment--hidden)
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Header / footer chrome. Removed in beforeTransform because the footer and header
// contain .columncontainer / .link / .ctacontainer markup that generic block selectors
// (e.g. columns-links ".columncontainer:has(... > .link)") could otherwise match.
const CHROME_SELECTORS = [
  // Header (homepage id from captured DOM + generic per-page equivalent)
  '#container-b2b89b7b5a',
  '.cmp-container:has(> .aem-Grid > .headerRedesign)',
  '.headerRedesign',
  'header.header__main',
  // Footer wrapper + inner footer + hidden contact-info content fragment
  '.cmp-container:has(> .aem-Grid > .footer.aem-GridColumn)',
  'div.footer.aem-GridColumn',
  '.footer__wrapper',
  '.contentfragment--hidden',
  'article.cmp-contentfragment--contact-info',
];

// Decorative icon-font elements (empty <i>/<em>/<span> glyph carriers).
// Found in captured DOM: i.testimonial__upper-quotes.icon-comma,
// i.testimonial__upper-quotes--yourgi.icon-GoldApostropheIcon, i.testimonial__lower-quotes(.--yourgi),
// em.link__icon(.icon-*), span.icon-phone, span.icon-location, span.icon-play-icon.
const ICON_SELECTORS = [
  '.testimonial__upper-quotes',
  '.testimonial__upper-quotes--yourgi',
  '.testimonial__lower-quotes',
  '.testimonial__lower-quotes--yourgi',
  'em.link__icon',
  'i[class*="icon-"]',
  'em[class*="icon-"]',
  'span[class*="icon-"]',
];

const MEDIA_TAGS = 'img, picture, video, iframe, svg, hr, table, a, input, select, textarea, button, form, object, embed';

function removeEmptyIcons(element) {
  element.querySelectorAll(ICON_SELECTORS.join(',')).forEach((el) => {
    if (el.textContent.trim() === '' && !el.querySelector(MEDIA_TAGS)) el.remove();
  });
}

function removeComments(element) {
  const doc = element.ownerDocument;
  const walker = doc.createTreeWalker(element, 128 /* NodeFilter.SHOW_COMMENT */);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  // Keep xwalk field hints (<!-- field:... -->) emitted by parsers inside block tables.
  comments
    .filter((c) => !c.parentElement?.closest('table') && !/^\s*field:/.test(c.nodeValue))
    .forEach((c) => c.remove());
}

// Empty spacer/layout divs (e.g. empty .container__column, the empty second
// .columncontainer inside .hero__content-action). Deepest-first so wrappers that
// only contained empty spacers are removed too. Never touches block tables or <hr>.
function removeEmptyDivs(element) {
  const divs = [...element.querySelectorAll('div, section')].reverse();
  divs.forEach((div) => {
    if (!div.isConnected) return;
    if (div.closest('table')) return;
    if (div.textContent.trim() !== '') return;
    if (div.querySelector(MEDIA_TAGS)) return;
    div.remove();
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Global chrome first so block selectors never match header/footer markup.
    WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);

    // Tracking / script artifacts (Munchkin, gtag, Adobe Launch / data layer scripts).
    WebImporter.DOMUtils.remove(element, ['script', 'noscript', 'style']);

    // Cookie / consent banners (OneTrust is used by AEM sites; harmless if absent).
    WebImporter.DOMUtils.remove(element, ['#onetrust-consent-sdk', '#onetrust-banner-sdk']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Safety net in case anything re-surfaced after parsing.
    WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);

    // Leftover non-authorable elements. NOTE: iframes are intentionally kept -
    // the embed-form block (.rawhtml:has(iframe)) relies on the JotForm iframe.
    // NOTE: bare <hr> is intentionally NOT removed (section transformer inserts them).
    WebImporter.DOMUtils.remove(element, ['script', 'noscript', 'style', 'link', 'meta', 'source']);

    // DM viewer clientlib <link>s + Adobe copyright comments inside div.dynamicmedia
    removeComments(element);

    // Decorative icon-font glyph carriers that produce empty content.
    removeEmptyIcons(element);

    // Adobe Client Data Layer / tracking attributes.
    element.querySelectorAll('[data-cmp-data-layer], [data-cmp-clickable], [data-cmp-hook-accordion], [onclick]').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-cmp-clickable');
      el.removeAttribute('onclick');
    });

    // Empty spacer divs.
    removeEmptyDivs(element);

    // Same-site absolute links -> root-relative (content/index had https://www.destinationpet.com/...).
    relativizeSiteLinks(element);

    // Google Maps links: strip tracking query params (a bare '&' breaks the xwalk JCR XML).
    stripMapsTracking(element);
  }
}

// Rewrites <a href> on https?://(www.)destinationpet.com to root-relative paths (query/hash kept).
// Other hosts (images.destpet.com DM/Scene7, form.jotform.com, socials) never match the host test;
// same-host asset/DM paths (/is/image/, /content/dam/, image files) are left absolute.
const SITE_HOST_RE = /^(?:https?:)?\/\/(?:www\.)?destinationpet\.com(?=[/?#]|$)/i;
const ASSET_PATH_RE = /\/is\/image\/|\/adobe\/assets\/urn:|^\/content\/dam\/|\.(?:png|jpe?g|gif|webp|svg|avif)$/i;

function relativizeSiteLinks(element) {
  element.querySelectorAll('a[href]').forEach((a) => {
    const href = (a.getAttribute('href') || '').trim();
    if (!SITE_HOST_RE.test(href)) return;
    let rest = href.replace(SITE_HOST_RE, '');
    if (!rest.startsWith('/')) rest = `/${rest}`;
    const pathOnly = rest.split(/[?#]/)[0];
    if (ASSET_PATH_RE.test(pathOnly)) return;
    a.setAttribute('href', rest);
  });
  // /home only 302-redirects to the site root (html-sitemap "Home" entry); the EDS home page is /
  element.querySelectorAll('a[href="/home"], a[href="/home/"]').forEach((a) => a.setAttribute('href', '/'));
}

// google.com/maps place links carry tracking params (sa, ved, entry) -> drop the query.
// My Maps viewer links (/maps/d/) keep only the map id (mid).
function stripMapsTracking(element) {
  element.querySelectorAll('a[href*="google.com/maps"]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const qIdx = href.indexOf('?');
    if (qIdx < 0) return;
    const base = href.slice(0, qIdx);
    const mid = href.slice(qIdx + 1).split('&').find((pair) => pair.startsWith('mid='));
    a.setAttribute('href', base.includes('/maps/d/') && mid ? `${base}?${mid}` : base);
  });
}
