/* eslint-disable */
/* global WebImporter */

/**
 * Import script for the site navigation fragment (content/nav.plain.html).
 * Source: https://www.destinationpet.com/ header (div.headerRedesign).
 *
 * Output (flat, semantic sections - no classes/ids/forms):
 *   1. brand  : linked logo
 *   2. nav    : top-level links; "About us" with nested dropdown + "Meet The Team" flyout
 *   3. social : ribbon social icon links
 * Logo: the source's Scene7 image as a Dynamic Media carrier link (survives the xwalk conversion;
 * scripts.js turns it into a picture). Social icons: code-repository files under /icons/.
 */

const LOGO_DM_URL = 'https://images.destpet.com/is/image/destpet/DPLogo_Horizontal_FullColor';

// keyed by social host (icon-font <em> carriers are stripped before transform runs)
const SOCIAL_ICONS = {
  'facebook.com': { src: '/icons/icon-facebook.svg', alt: 'Facebook' },
  'instagram.com': { src: '/icons/icon-instagram.svg', alt: 'Instagram' },
  'linkedin.com': { src: '/icons/icon-linkedin.svg', alt: 'LinkedIn' },
};

function relHref(href) {
  if (!href) return '#';
  return href.replace(/^https?:\/\/(www\.)?destinationpet\.com/i, '') || '/';
}

function linkLabel(a) {
  return a.textContent.replace(/\s+/g, ' ').trim();
}

// Build a nested <ul> from a Core Components navigation group, keeping only direct items.
function buildList(document, group) {
  const ul = document.createElement('ul');
  group.querySelectorAll(':scope > li').forEach((li) => {
    const a = li.querySelector(':scope > .cmp-navigation__item-wrapper a, :scope > .link a, :scope > a');
    if (!a) return;
    const item = document.createElement('li');
    const sub = li.querySelector(':scope > ul.cmp-navigation__group, :scope > .nav-mobile > ul.cmp-navigation__group');
    const href = a.getAttribute('href');
    // non-navigating parents keep the source's '#' href (keeps the list tight: <li><a/><ul/>)
    const link = document.createElement('a');
    link.href = relHref(href);
    link.textContent = linkLabel(a);
    item.append(link);
    if (sub) item.append(buildList(document, sub));
    ul.append(item);
  });
  return ul;
}

export default {
  transform: ({ document, params }) => {
    const header = document.querySelector('.headerRedesign') || document.body;
    const out = document.createElement('div');

    // 1. brand
    const brand = document.createElement('div');
    const logoLink = header.querySelector('.header__logo a') || header.querySelector('header a');
    const logoImg = header.querySelector('.header__logo img');
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = '/';
    // linked Dynamic Media image: the link title carries the Scene7 URL, the text is the alt
    a.title = LOGO_DM_URL;
    a.textContent = (logoImg && logoImg.alt) || 'Destination Pet Logo';
    p.append(a);
    brand.append(p);
    out.append(brand);

    // 2. nav sections: desktop navigation tree (.nav-desktop__no-megamenu holds the dropdown)
    const sections = document.createElement('div');
    const topUl = document.createElement('ul');
    const topItems = header.querySelectorAll('nav.cmp-navigation > ul.cmp-navigation__group > li.cmp-navigation__item--level-0');
    topItems.forEach((li) => {
      const ta = li.querySelector(':scope > .cmp-navigation__item-wrapper a');
      if (!ta) return;
      const item = document.createElement('li');
      const dropdown = li.querySelector(':scope > .nav-desktop__no-megamenu > ul.cmp-navigation__group')
        || li.querySelector(':scope > .nav-mobile > ul.cmp-navigation__group');
      const href = ta.getAttribute('href');
      const link = document.createElement('a');
      link.href = relHref(href);
      link.textContent = linkLabel(ta);
      item.append(link);
      if (dropdown) item.append(buildList(document, dropdown));
      topUl.append(item);
    });
    sections.append(topUl);
    out.append(sections);

    // 3. social ribbon
    const social = document.createElement('div');
    const sUl = document.createElement('ul');
    header.querySelectorAll('.ribbon a').forEach((sa) => {
      const href = sa.getAttribute('href') || '';
      const key = Object.keys(SOCIAL_ICONS).find((k) => href.includes(k));
      if (!key) return;
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = sa.getAttribute('href');
      const im = document.createElement('img');
      im.src = SOCIAL_ICONS[key].src;
      im.alt = SOCIAL_ICONS[key].alt;
      link.append(im);
      li.append(link);
      sUl.append(li);
    });
    social.append(sUl);
    out.append(social);

    // sections are delimited by <hr> in the import output
    const parts = [];
    [...out.children].forEach((section, i) => {
      if (i > 0) parts.push(document.createElement('hr'));
      parts.push(...section.childNodes);
    });
    document.body.replaceChildren(...parts);
    return [{
      element: document.body,
      path: '/nav',
      report: { title: 'nav' },
    }];
  },
};
