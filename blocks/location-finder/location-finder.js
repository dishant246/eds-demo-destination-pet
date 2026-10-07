import { loadScript } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * location-finder: intro text + location search + "map view" switch beside an OpenStreetMap
 * (Leaflet) map of every center in a GeoJSON feed.
 * Content contract (one field per row):
 *   1. text        - intro (h1 + paragraph)
 *   2. source      - URL of the GeoJSON FeatureCollection (properties: centerid, name, logo,
 *                    category, phone, Address, sitename, tags, rating)
 *   3. placeholder - search field placeholder
 *   4. noResults   - message shown when a search finds no center (h2 + paragraph)
 * A search geocodes the query and lists the centers within RADIUS_KM, nearest first.
 */

const LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist';
const LEAFLET_CSS_SRI = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
const LEAFLET_JS_SRI = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILES_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const GEOCODER = 'https://nominatim.openstreetmap.org/search';

const INITIAL_VIEW = { center: [39.22803, -101.97376], zoom: 3 };
const SEARCH_ZOOM = 9;
const CENTER_ZOOM = 12;
const RADIUS_KM = 100;
const TOGGLE_LABEL = 'Map view';

const ICONS = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"/></svg>',
  location: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02z"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
  pin: '<svg viewBox="0 0 24 32" aria-hidden="true" focusable="false"><path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0" fill="currentColor"/><circle cx="12" cy="12" r="4.5" fill="#fff"/></svg>',
};

let instanceId = 0;

function cellText(row) {
  return row ? row.textContent.trim() : '';
}

function cellUrl(row) {
  if (!row) return '';
  const link = row.querySelector('a[href]');
  return link ? link.href : row.textContent.trim();
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html) node.innerHTML = html;
  return node;
}

/* great-circle distance in km */
function distanceKm([lat1, lng1], [lat2, lng2]) {
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function normalizeCenters(geojson, sourceUrl) {
  const features = (geojson && geojson.features) || [];
  return features
    .filter((f) => f.geometry && Array.isArray(f.geometry.coordinates))
    .map((f) => {
      const p = f.properties || {};
      const [lng, lat] = f.geometry.coordinates;
      let logo = '';
      try {
        logo = p.logo ? new URL(p.logo, sourceUrl).href : '';
      } catch (e) {
        logo = '';
      }
      return {
        id: String(p.centerid),
        name: (p.name || '').trim(),
        logo,
        category: (p.category || '').trim(),
        phone: (p.phone || '').trim(),
        address: (p.Address || '').split(',').map((s) => s.trim()).filter(Boolean).join(', '),
        url: (p.sitename || '').trim(),
        tags: (p.tags || []).map((t) => t.trim()).filter(Boolean),
        rating: Number(p.rating) || 0,
        latlng: [lat, lng],
      };
    })
    .filter((c) => Number.isFinite(c.latlng[0]) && Number.isFinite(c.latlng[1]));
}

function buildStars(rating) {
  const stars = el('span', 'location-finder-stars');
  stars.setAttribute('aria-hidden', 'true');
  const full = Math.floor(rating);
  const half = rating % 1 > 0 ? 1 : 0;
  for (let i = 0; i < 5; i += 1) {
    let state = 'empty';
    if (i < full) state = 'full';
    else if (i === full && half) state = 'half';
    // a half star is an outline with a filled copy clipped to its left half
    const fill = ICONS.star.replace('<svg', '<svg class="location-finder-star-fill"');
    const html = state === 'half' ? ICONS.star + fill : ICONS.star;
    stars.append(el('span', `location-finder-star location-finder-star-${state}`, html));
  }
  return stars;
}

function visitLink(center, position) {
  const wrap = el('div', `location-finder-visit location-finder-visit-${position}`);
  const a = el('a');
  a.href = center.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = 'Visit location';
  a.setAttribute('aria-label', `Visit ${center.name} (opens in a new tab)`);
  a.insertAdjacentHTML('beforeend', ICONS.chevron);
  wrap.append(a);
  return wrap;
}

function buildCard(center) {
  const card = el('li', 'location-finder-card');
  card.dataset.centerId = center.id;
  card.tabIndex = 0;

  const logo = el('div', 'location-finder-logo');
  if (center.logo) {
    const img = el('img');
    img.src = center.logo;
    img.alt = '';
    img.loading = 'lazy';
    // several feed logos no longer resolve on the source site - leave the empty badge
    img.addEventListener('error', () => img.remove());
    logo.append(img);
  }

  const details = el('div', 'location-finder-details');
  const head = el('div', 'location-finder-card-head');
  const h3 = el('h3');
  h3.textContent = center.name;
  head.append(h3);
  if (center.rating) {
    const rating = el('p', 'location-finder-rating');
    rating.append(buildStars(center.rating));
    const value = el('span', 'location-finder-rating-value');
    value.textContent = center.rating;
    value.setAttribute('aria-label', `Rated ${center.rating} out of 5`);
    rating.append(value);
    head.append(rating);
  }
  details.append(head);
  if (center.url) details.append(visitLink(center, 'top'));

  const contact = el('div', 'location-finder-contact');
  if (center.address) {
    const p = el('p', 'location-finder-address', ICONS.location);
    p.append(center.address);
    contact.append(p);
  }
  if (center.phone) {
    const p = el('p', 'location-finder-phone', ICONS.phone);
    const tel = el('a');
    tel.href = `tel:${center.phone.replace(/[^\d+]/g, '')}`;
    tel.textContent = center.phone;
    p.append(tel);
    contact.append(p);
  }
  details.append(contact);

  if (center.tags.length) {
    const tags = el('ul', 'location-finder-services');
    tags.setAttribute('aria-label', 'Services');
    center.tags.forEach((tag) => {
      const li = el('li');
      li.textContent = tag;
      tags.append(li);
    });
    details.append(tags);
  }
  if (center.url) details.append(visitLink(center, 'bottom'));

  card.append(logo, details);
  return card;
}

function loadLeaflet() {
  if (!document.querySelector(`head > link[href="${LEAFLET}/leaflet.css"]`)) {
    const link = el('link');
    link.rel = 'stylesheet';
    link.href = `${LEAFLET}/leaflet.css`;
    link.integrity = LEAFLET_CSS_SRI;
    link.crossOrigin = '';
    document.head.append(link);
  }
  return loadScript(`${LEAFLET}/leaflet.js`, { integrity: LEAFLET_JS_SRI, crossorigin: '' });
}

async function geocode(query) {
  const params = new URLSearchParams({
    q: query, format: 'jsonv2', limit: '1', countrycodes: 'us',
  });
  const resp = await fetch(`${GEOCODER}?${params}`, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`geocoder ${resp.status}`);
  const [hit] = await resp.json();
  return hit ? [Number(hit.lat), Number(hit.lon)] : null;
}

/**
 * @param {Element} block
 */
export default function decorate(block) {
  instanceId += 1;
  const id = `location-finder-${instanceId}`;
  const [textRow, sourceRow, placeholderRow, noResultsRow] = [...block.children];
  const sourceUrl = cellUrl(sourceRow);
  const placeholder = cellText(placeholderRow) || 'Enter a location';

  // intro (keeps the richtext instrumentation)
  const intro = el('div', 'location-finder-intro');
  const introCell = textRow && (textRow.firstElementChild || textRow);
  if (introCell) {
    moveInstrumentation(introCell, intro);
    intro.append(...introCell.childNodes);
  }

  // search + switch
  const form = el('form', 'location-finder-form');
  form.setAttribute('role', 'search');
  const field = el('div', 'location-finder-field');
  const label = el('label', 'location-finder-sr-only');
  label.htmlFor = `${id}-query`;
  label.textContent = placeholder;
  const input = el('input');
  input.className = 'location-finder-input';
  input.type = 'search';
  input.id = `${id}-query`;
  input.name = 'location';
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  input.enterKeyHint = 'search';
  const submit = el('button', 'location-finder-submit', ICONS.search);
  submit.type = 'submit';
  submit.setAttribute('aria-label', 'Search');
  field.append(label, submit, input);

  const toggle = el('label', 'location-finder-toggle');
  const toggleText = el('span', 'location-finder-toggle-label');
  toggleText.textContent = TOGGLE_LABEL;
  const checkbox = el('input');
  checkbox.className = 'location-finder-checkbox';
  checkbox.type = 'checkbox';
  checkbox.checked = true;
  checkbox.setAttribute('role', 'switch');
  checkbox.setAttribute('aria-controls', `${id}-map`);
  toggle.append(toggleText, checkbox, el('span', 'location-finder-switch'));

  const count = el('p', 'location-finder-count');
  count.setAttribute('aria-live', 'polite');
  count.hidden = true;
  form.append(field, toggle, count);

  const search = el('div', 'location-finder-search');
  search.append(intro, form);

  // results
  const results = el('div', 'location-finder-results');
  results.id = `${id}-results`;
  const list = el('ul', 'location-finder-list');
  list.setAttribute('aria-label', 'Search results');
  const empty = el('div', 'location-finder-empty');
  empty.hidden = true;
  const emptyCell = noResultsRow && (noResultsRow.firstElementChild || noResultsRow);
  if (emptyCell) {
    moveInstrumentation(emptyCell, empty);
    empty.append(...emptyCell.childNodes);
  }
  const spinner = el('div', 'location-finder-spinner');
  spinner.setAttribute('role', 'status');
  spinner.innerHTML = '<span class="location-finder-sr-only">Searching…</span>';
  spinner.hidden = true;
  results.append(spinner, empty, list);

  // map
  const mapWrap = el('div', 'location-finder-map');
  mapWrap.id = `${id}-map`;
  const mapEl = el('div', 'location-finder-canvas');
  mapEl.setAttribute('role', 'region');
  mapEl.setAttribute('aria-label', 'Map of locations');
  mapWrap.append(mapEl);

  block.replaceChildren(search, mapWrap, results);

  // state
  let centers = [];
  let map;
  let searchMarker;
  const dataReady = sourceUrl
    ? fetch(sourceUrl)
      .then((resp) => (resp.ok ? resp.json() : Promise.reject(new Error(`data ${resp.status}`))))
      .then((json) => { centers = normalizeCenters(json, sourceUrl); })
      .catch(() => { centers = []; })
    : Promise.resolve();

  const focusCenter = (center) => {
    if (!map) return;
    map.setView(center.latlng, CENTER_ZOOM);
  };

  const bindCard = (card, center) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      focusCenter(center);
    });
    card.addEventListener('keydown', (e) => {
      if (e.target !== card || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      focusCenter(center);
    });
  };

  const render = (items) => {
    list.replaceChildren(...items.map((center) => {
      const card = buildCard(center);
      bindCard(card, center);
      return card;
    }));
  };

  const setCount = (n) => {
    count.hidden = false;
    count.innerHTML = `<strong>${n}</strong> ${n === 1 ? 'center' : 'centers'} found`;
  };

  // a marker click highlights its card in the current results, or shows that center alone
  const selectCenter = (center) => {
    list.querySelectorAll('.location-finder-card').forEach((c) => c.classList.remove('is-selected'));
    let card = list.querySelector(`[data-center-id="${CSS.escape(center.id)}"]`);
    if (!card) {
      empty.hidden = true;
      render([center]);
      card = list.firstElementChild;
    }
    card.classList.add('is-selected');
    card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const runSearch = async (query) => {
    list.replaceChildren();
    empty.hidden = true;
    spinner.hidden = false;
    let origin = null;
    try {
      [origin] = await Promise.all([geocode(query), dataReady]);
    } catch (e) {
      origin = null;
    }
    spinner.hidden = true;
    if (!origin) {
      empty.hidden = false;
      setCount(0);
      return;
    }
    if (map) {
      map.setView(origin, SEARCH_ZOOM);
      if (!searchMarker) {
        searchMarker = window.L.circleMarker(origin, {
          radius: 6,
          className: 'location-finder-origin',
        }).addTo(map);
      }
      searchMarker.setLatLng(origin);
    }
    const nearby = centers
      .map((center) => ({ center, km: distanceKm(origin, center.latlng) }))
      .filter((r) => r.km < RADIUS_KM)
      .sort((a, b) => a.km - b.km)
      .map((r) => r.center);
    setCount(nearby.length);
    empty.hidden = nearby.length > 0;
    render(nearby);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) runSearch(query);
  });

  checkbox.addEventListener('change', () => {
    block.classList.toggle('location-finder-list-view', !checkbox.checked);
    mapWrap.hidden = !checkbox.checked;
    if (checkbox.checked && map) map.invalidateSize();
  });

  // the map and its library load after the block is shown, never blocking the page
  loadLeaflet().then(async () => {
    const { L } = window;
    const touch = L.Browser.mobile;
    map = L.map(mapEl, {
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      scrollWheelZoom: false,
      dragging: !touch,
      tap: !touch,
    });
    L.tileLayer(TILES, { maxZoom: 19, attribution: TILES_ATTRIBUTION }).addTo(map);
    await dataReady;
    centers.forEach((center) => {
      const vet = /vet/i.test(center.category);
      const icon = L.divIcon({
        className: `location-finder-pin ${vet ? 'location-finder-pin-vet' : 'location-finder-pin-pet'}`,
        html: ICONS.pin,
        iconSize: [24, 32],
        iconAnchor: [12, 32],
      });
      L.marker(center.latlng, {
        icon, title: center.name, alt: center.name, keyboard: true,
      })
        .addTo(map)
        .on('click', () => selectCenter(center));
    });
    if (window.ResizeObserver) new ResizeObserver(() => map.invalidateSize()).observe(mapEl);
  }).catch(() => {
    mapWrap.classList.add('location-finder-map-error');
  });
}
