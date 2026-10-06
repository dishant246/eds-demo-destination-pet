// source switches from the accordion to the 3-column layout at 768px
const isDesktop = window.matchMedia('(width >= 768px)');

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content/footer.plain.html (local preview) first, then /footer.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
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

/** True for a paragraph that only holds bold text (a column heading). */
function isHeading(el) {
  return el.tagName === 'P' && el.children.length === 1
    && el.firstElementChild.tagName === 'STRONG'
    && el.textContent.trim() === el.firstElementChild.textContent.trim();
}

/** Opens links to other hosts (and mail links stay as-is) in a new tab. */
function decorateLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (/^https?:$/.test(url.protocol) && url.host !== window.location.host) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

/**
 * Makes a column heading toggle its column on mobile (accordion); desktop shows all columns.
 * @param {HTMLElement} column footer column
 * @param {HTMLElement} heading its heading paragraph
 */
function decorateAccordion(column, heading) {
  column.setAttribute('aria-expanded', 'false');
  // headings only act as buttons while the accordion is active (mobile)
  const syncMode = () => {
    if (isDesktop.matches) {
      ['role', 'tabindex', 'aria-expanded'].forEach((attr) => heading.removeAttribute(attr));
    } else {
      heading.setAttribute('role', 'button');
      heading.setAttribute('tabindex', '0');
      heading.setAttribute('aria-expanded', column.getAttribute('aria-expanded'));
    }
  };
  syncMode();
  isDesktop.addEventListener('change', syncMode);
  const chevron = document.createElement('span');
  chevron.className = 'footer-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  heading.append(chevron);
  const toggle = () => {
    if (isDesktop.matches) return;
    const open = column.getAttribute('aria-expanded') !== 'true';
    column.setAttribute('aria-expanded', open ? 'true' : 'false');
    heading.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  heading.addEventListener('click', toggle);
  heading.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });
}

/**
 * Groups a section's children into columns, each starting at a bold heading paragraph.
 * @param {Element} section fragment section
 * @returns {HTMLElement} columns container
 */
function buildColumns(section) {
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  let column = null;
  [...section.children].forEach((child) => {
    if (isHeading(child)) {
      column = document.createElement('div');
      column.className = 'footer-column';
      child.classList.add('footer-column-heading');
      column.append(child);
      decorateAccordion(column, child);
      columns.append(column);
    } else if (column) {
      column.append(child);
    }
  });
  return columns;
}

/** Converts social image links into white mask icons. */
function decorateSocial(list) {
  list.classList.add('footer-social');
  list.querySelectorAll('a').forEach((a) => {
    const img = a.querySelector('img');
    if (!img) return;
    const icon = document.createElement('span');
    icon.className = 'footer-social-icon';
    icon.style.setProperty('--icon', `url("${img.getAttribute('src')}")`);
    a.setAttribute('aria-label', img.alt || a.href);
    a.replaceChildren(icon);
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;
  resolveImages(fragment);
  decorateLinks(fragment);

  const [brandSection, columnsSection, bottomSection] = [...fragment.children];
  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  if (brandSection) {
    const brand = document.createElement('div');
    brand.className = 'footer-brand';
    brand.append(...brandSection.childNodes);
    inner.append(brand);
  }

  if (columnsSection) inner.append(buildColumns(columnsSection));

  if (bottomSection) {
    const bottom = document.createElement('div');
    bottom.className = 'footer-bottom';
    const copyright = bottomSection.querySelector('p');
    if (copyright) {
      copyright.classList.add('footer-copyright');
      bottom.append(copyright);
    }
    const social = bottomSection.querySelector('ul');
    if (social) {
      decorateSocial(social);
      bottom.append(social);
    }
    inner.append(bottom);
  }

  block.append(inner);
}
