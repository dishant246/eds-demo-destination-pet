/**
 * embed-form: generic third-party form embed (e.g. Jotform).
 * Content: a single link to the form URL (any provider), optionally with a title as link text.
 * Renders the URL in a lazy-loaded, tall iframe. Jotform forms auto-resize the iframe
 * through their postMessage protocol ("setHeight:<px>:<formId>").
 */

const DEFAULT_TITLE = 'Embedded form';

function isJotform(url) {
  return /(^|\.)jotform(pro)?\.com$/i.test(url.hostname) || /(^|\.)jotform\.(eu|us)$/i.test(url.hostname);
}

function onJotformMessage(iframe, origin) {
  return (event) => {
    if (event.origin !== origin || event.source !== iframe.contentWindow) return;
    if (typeof event.data !== 'string') return;
    const [action, value] = event.data.split(':');
    if (action === 'setHeight') {
      const height = parseInt(value, 10);
      if (height > 0) iframe.style.height = `${height}px`;
    } else if (action === 'scrollIntoView') {
      iframe.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
}

function loadForm(block, url, title) {
  if (block.dataset.embedLoaded === 'true') return;
  block.dataset.embedLoaded = 'true';

  const src = new URL(url.href);
  const jotform = isJotform(src);
  if (jotform) {
    src.searchParams.set('isIframeEmbed', '1');
    src.searchParams.set('parentURL', window.location.href);
  }

  const iframe = document.createElement('iframe');
  iframe.className = 'embed-form-frame';
  iframe.src = src.href;
  iframe.title = title;
  iframe.loading = 'lazy';
  // `fullscreen` in the allow list replaces the legacy allowfullscreen attribute
  // (setting both logs an "Allow attribute will take precedence" console warning)
  iframe.setAttribute('allow', 'geolocation; microphone; camera; fullscreen; payment');
  if (jotform) {
    block.classList.add('embed-form-jotform');
    window.addEventListener('message', onJotformMessage(iframe, src.origin));
  }

  const wrapper = block.querySelector('.embed-form-wrapper');
  wrapper.append(iframe);
}

export default function decorate(block) {
  // the URL may be authored as a link, or as plain text (UE text field)
  const link = block.querySelector('a[href]');
  const href = link ? link.href : (block.textContent.match(/https?:\/\/\S+/) || [])[0];
  if (!href) return;
  let url;
  try {
    url = new URL(href);
  } catch {
    return;
  }
  const text = link ? link.textContent.trim() : '';
  const title = text && text !== href && !/^https?:\/\//.test(text) ? text : DEFAULT_TITLE;

  block.textContent = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'embed-form-wrapper';
  block.append(wrapper);

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      loadForm(block, url, title);
    }
  }, { rootMargin: '200px' });
  observer.observe(block);
}
