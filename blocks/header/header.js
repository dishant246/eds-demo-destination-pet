// media query match that indicates desktop width (source switches to the desktop nav at 1024px)
const isDesktop = window.matchMedia('(width >= 1024px)');

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local preview) first, then /nav.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  return container;
}

/**
 * Rewrites fragment-relative image paths (images/...) against the fragment location.
 * @param {HTMLElement} root fragment container
 */
function resolveImages(root) {
  const base = window.location.pathname.startsWith('/content/') ? '/content/' : '/';
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.setAttribute('src', `${base}${src}`);
    }
  });
}

/**
 * Removes the <p> wrappers the content pipeline adds around list-item links.
 * @param {HTMLElement} list ul element
 */
function unwrapListParagraphs(list) {
  list.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
}

function closeAll(scope) {
  scope.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
    const trigger = li.querySelector(':scope > a');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function setOpen(li, open) {
  li.setAttribute('aria-expanded', open ? 'true' : 'false');
  const trigger = li.querySelector(':scope > a');
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (!open) closeAll(li);
}

/**
 * Turns every list item that owns a sub-list into an expandable item.
 * Desktop: opens on hover (and on click for keyboard/touch). Mobile: tap toggles.
 * @param {HTMLElement} navList top-level ul
 */
function decorateDropdowns(navList) {
  navList.querySelectorAll('li').forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    const trigger = li.querySelector(':scope > a');
    if (!sub || !trigger) return;
    const level = li.parentElement === navList ? 'top' : 'nested';
    li.classList.add('nav-drop', `nav-drop-${level}`);
    sub.classList.add(level === 'top' ? 'nav-dropdown' : 'nav-flyout');
    li.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    const icon = document.createElement('span');
    icon.className = level === 'top' ? 'nav-chevron' : 'nav-arrow';
    icon.setAttribute('aria-hidden', 'true');
    // top-level chevron sits beside the link (as on the source); nested arrow sits inside it
    if (level === 'top') trigger.after(icon);
    else trigger.append(icon);
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(li, li.getAttribute('aria-expanded') !== 'true');
    });

    li.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      // only one sibling open at a time
      [...li.parentElement.children].forEach((sib) => {
        if (sib !== li && sib.classList.contains('nav-drop')) setOpen(sib, false);
      });
      setOpen(li, true);
    });
    li.addEventListener('mouseleave', () => {
      if (isDesktop.matches) setOpen(li, false);
    });
    trigger.addEventListener('click', (e) => {
      const href = trigger.getAttribute('href');
      if (!href || href === '#' || !isDesktop.matches) {
        e.preventDefault();
        setOpen(li, li.getAttribute('aria-expanded') !== 'true');
      }
    });
  });
}

/**
 * Converts the social image links into white mask icons (the source glyphs stay white on hover).
 * @param {HTMLElement} list ul of social links
 */
function decorateSocial(list) {
  list.querySelectorAll('a').forEach((a) => {
    const img = a.querySelector('img');
    if (!img) return;
    const icon = document.createElement('span');
    icon.className = 'nav-social-icon';
    icon.style.setProperty('--icon', `url("${img.getAttribute('src')}")`);
    a.setAttribute('aria-label', img.alt || a.href);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
    a.replaceChildren(icon);
  });
}

function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  if (expanded) closeAll(nav);
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;
  resolveImages(fragment);

  const [brandSection, sectionsSection, socialSection] = [...fragment.children];

  // social ribbon (scrolls away; main bar stays sticky)
  const ribbon = document.createElement('div');
  ribbon.className = 'nav-ribbon';
  const socialList = socialSection && socialSection.querySelector('ul');
  if (socialList) {
    socialList.classList.add('nav-social');
    decorateSocial(socialList);
    ribbon.append(socialList);
  }

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) brand.append(...brandSection.childNodes);
  const logoLink = brand.querySelector('a');
  if (logoLink) logoLink.setAttribute('aria-label', logoLink.querySelector('img')?.alt || 'Home');

  const sections = document.createElement('div');
  sections.className = 'nav-sections';
  sections.id = 'nav-sections';
  const navList = sectionsSection && sectionsSection.querySelector('ul');
  if (navList) {
    unwrapListParagraphs(navList);
    navList.classList.add('nav-list');
    decorateDropdowns(navList);
    sections.append(navList);
  }

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav-sections" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav));

  const inner = document.createElement('div');
  inner.className = 'nav-inner';
  inner.append(brand, hamburger, sections);
  nav.append(inner);

  // close open dropdowns on outside click / Escape
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAll(nav);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (nav.querySelector('.nav-drop[aria-expanded="true"]')) closeAll(nav);
    else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') toggleMenu(nav, false);
  });

  // reset state when crossing the desktop/mobile breakpoint
  isDesktop.addEventListener('change', () => {
    closeAll(nav);
    toggleMenu(nav, false);
  });
  toggleMenu(nav, false);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(ribbon, nav);
  block.append(navWrapper);
}
