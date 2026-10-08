/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-html-sitemap.js
  var import_html_sitemap_exports = {};
  __export(import_html_sitemap_exports, {
    default: () => import_html_sitemap_default
  });

  // tools/importer/transformers/destinationpet-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var CHROME_SELECTORS = [
    // Header (homepage id from captured DOM + generic per-page equivalent)
    "#container-b2b89b7b5a",
    ".cmp-container:has(> .aem-Grid > .headerRedesign)",
    ".headerRedesign",
    "header.header__main",
    // Footer wrapper + inner footer + hidden contact-info content fragment
    ".cmp-container:has(> .aem-Grid > .footer.aem-GridColumn)",
    "div.footer.aem-GridColumn",
    ".footer__wrapper",
    ".contentfragment--hidden",
    "article.cmp-contentfragment--contact-info"
  ];
  var ICON_SELECTORS = [
    ".testimonial__upper-quotes",
    ".testimonial__upper-quotes--yourgi",
    ".testimonial__lower-quotes",
    ".testimonial__lower-quotes--yourgi",
    "em.link__icon",
    'i[class*="icon-"]',
    'em[class*="icon-"]',
    'span[class*="icon-"]'
  ];
  var MEDIA_TAGS = "img, picture, video, iframe, svg, hr, table, a, input, select, textarea, button, form, object, embed";
  function removeEmptyIcons(element) {
    element.querySelectorAll(ICON_SELECTORS.join(",")).forEach((el) => {
      if (el.textContent.trim() === "" && !el.querySelector(MEDIA_TAGS)) el.remove();
    });
  }
  function removeComments(element) {
    const doc = element.ownerDocument;
    const walker = doc.createTreeWalker(
      element,
      128
      /* NodeFilter.SHOW_COMMENT */
    );
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.filter((c) => {
      var _a;
      return !((_a = c.parentElement) == null ? void 0 : _a.closest("table")) && !/^\s*field:/.test(c.nodeValue);
    }).forEach((c) => c.remove());
  }
  function removeEmptyDivs(element) {
    const divs = [...element.querySelectorAll("div, section")].reverse();
    divs.forEach((div) => {
      if (!div.isConnected) return;
      if (div.closest("table")) return;
      if (div.textContent.trim() !== "") return;
      if (div.querySelector(MEDIA_TAGS)) return;
      div.remove();
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);
      WebImporter.DOMUtils.remove(element, ["script", "noscript", "style"]);
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk", "#onetrust-banner-sdk"]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, CHROME_SELECTORS);
      WebImporter.DOMUtils.remove(element, ["script", "noscript", "style", "link", "meta", "source"]);
      removeComments(element);
      removeEmptyIcons(element);
      element.querySelectorAll("[data-cmp-data-layer], [data-cmp-clickable], [data-cmp-hook-accordion], [onclick]").forEach((el) => {
        el.removeAttribute("data-cmp-data-layer");
        el.removeAttribute("data-cmp-clickable");
        el.removeAttribute("onclick");
      });
      removeEmptyDivs(element);
      relativizeSiteLinks(element);
      stripMapsTracking(element);
    }
  }
  var SITE_HOST_RE = /^(?:https?:)?\/\/(?:www\.)?destinationpet\.com(?=[/?#]|$)/i;
  var ASSET_PATH_RE = /\/is\/image\/|\/adobe\/assets\/urn:|^\/content\/dam\/|\.(?:png|jpe?g|gif|webp|svg|avif)$/i;
  function relativizeSiteLinks(element) {
    element.querySelectorAll("a[href]").forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (!SITE_HOST_RE.test(href)) return;
      let rest = href.replace(SITE_HOST_RE, "");
      if (!rest.startsWith("/")) rest = `/${rest}`;
      const pathOnly = rest.split(/[?#]/)[0];
      if (ASSET_PATH_RE.test(pathOnly)) return;
      a.setAttribute("href", rest);
    });
    element.querySelectorAll('a[href="/home"], a[href="/home/"]').forEach((a) => a.setAttribute("href", "/"));
  }
  function stripMapsTracking(element) {
    element.querySelectorAll('a[href*="google.com/maps"]').forEach((a) => {
      const href = a.getAttribute("href") || "";
      const qIdx = href.indexOf("?");
      if (qIdx < 0) return;
      const base = href.slice(0, qIdx);
      const mid = href.slice(qIdx + 1).split("&").find((pair) => pair.startsWith("mid="));
      a.setAttribute("href", base.includes("/maps/d/") && mid ? `${base}?${mid}` : base);
    });
  }

  // tools/importer/transformers/destinationpet-sections.js
  var MARKER_ATTR = "data-excat-section-style";
  var TEMP_ATTR = "data-excat-temp";
  var END_ATTR = "data-excat-generic-end";
  var MAIN_GRID = ".root.responsivegrid.aem-GridColumn > .cmp-container > .aem-Grid";
  var STYLE_CLASSES = [
    ["background-color--tertiary", "tertiary"],
    ["background-color--secondary", "secondary"],
    ["background-color--primary", "primary"]
  ];
  var BG_SELECTOR = STYLE_CLASSES.map(([cls]) => `.${cls}`).join(", ");
  var CONTENT_TAGS = "img, picture, video, iframe, svg, table, input, select, textarea, button, object, embed";
  function isTopLevel(el) {
    const parent = el.parentElement;
    return !!parent && parent.matches(MAIN_GRID);
  }
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    const hasGrid = !!root.querySelector(MAIN_GRID);
    for (const sel of list) {
      if (!sel) continue;
      if (!hasGrid) {
        const el2 = root.querySelector(sel);
        if (el2) return el2;
        continue;
      }
      const el = [...root.querySelectorAll(sel)].find(isTopLevel);
      if (el) return el;
    }
    return null;
  }
  function styleFor(el) {
    for (const [cls, style] of STYLE_CLASSES) {
      if (el.classList.contains(cls)) return style;
    }
    return null;
  }
  function isHr(el) {
    return !!el && el.tagName === "HR";
  }
  function collectEntries(element, sections) {
    const entries = [];
    const handled = [];
    sections.forEach((section) => {
      const el = querySection(element, section.selector);
      if (!el || handled.includes(el)) return;
      handled.push(el);
      entries.push({ el, top: el, style: section.style || styleFor(el) });
    });
    element.querySelectorAll(MAIN_GRID).forEach((grid) => {
      [...grid.children].forEach((top) => {
        if (!top.classList.contains("aem-GridColumn")) return;
        if (handled.some((h) => h === top || h.contains(top) || top.contains(h))) return;
        const topStyle = styleFor(top);
        if (topStyle) {
          entries.push({ el: top, top, style: topStyle });
          return;
        }
        const firstCol = top.querySelector(".container__column");
        const band = firstCol && firstCol.firstElementChild;
        if (band && band.classList.contains("columncontainer") && band.matches(BG_SELECTOR)) {
          entries.push({ el: band, top, style: `${styleFor(band)}, inset` });
          return;
        }
        entries.push({ el: top, top, style: null });
      });
    });
    entries.sort((a, b) => a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1);
    return entries;
  }
  function isStaggerContinuation(prevEntry, entry) {
    if (!prevEntry || prevEntry.style || entry.style) return false;
    return entry.top === entry.el && entry.el.classList.contains("mediainfo") && prevEntry.el.classList.contains("mediainfo") && entry.el.previousElementSibling === prevEntry.el;
  }
  function edgeAncestor(el, top, dir) {
    let node = el;
    const sib = dir === "prev" ? "previousElementSibling" : "nextElementSibling";
    while (node !== top && !node[sib] && node.parentElement) node = node.parentElement;
    return node;
  }
  function collapseEmptySections(element) {
    const doc = element.ownerDocument;
    const walker = doc.createTreeWalker(
      element,
      1 | 4
      /* SHOW_ELEMENT | SHOW_TEXT */
    );
    const toRemove = [];
    let hasContent = false;
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.nodeType === 3) {
        if (n.nodeValue.trim()) hasContent = true;
      } else if (n.tagName === "HR" && !n.closest("table")) {
        if (!hasContent) toRemove.push(n);
        hasContent = false;
      } else if (n.matches(CONTENT_TAGS)) {
        hasContent = true;
      }
    }
    toRemove.forEach((hr) => hr.remove());
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    const doc = element.ownerDocument;
    if (hookName === "beforeTransform") {
      const entries = collectEntries(element, sections);
      for (let i = entries.length - 1; i >= 0; i -= 1) {
        const entry = entries[i];
        const { el, top, style } = entry;
        if (style) {
          const endNode = edgeAncestor(el, top, "next");
          const next = endNode.nextElementSibling;
          if (next && !isHr(next)) {
            if (endNode === top) endNode.after(doc.createElement("hr"));
            else endNode.setAttribute(END_ATTR, "true");
          }
        }
        if (isStaggerContinuation(entries[i - 1], entry)) continue;
        const startNode = edgeAncestor(el, top, "prev");
        const prev = startNode.previousElementSibling;
        if (isHr(prev)) {
          if (style) prev.setAttribute(MARKER_ATTR, style);
          continue;
        }
        if (!prev && !style) continue;
        const hr = doc.createElement("hr");
        if (style) hr.setAttribute(MARKER_ATTR, style);
        if (!prev) hr.setAttribute(TEMP_ATTR, "true");
        startNode.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll(`[${END_ATTR}]`).forEach((endNode) => {
        endNode.removeAttribute(END_ATTR);
        const next = endNode.nextElementSibling;
        if (next && !isHr(next)) endNode.after(doc.createElement("hr"));
      });
      element.querySelectorAll(`[${MARKER_ATTR}]`).forEach((marker) => {
        const style = marker.getAttribute(MARKER_ATTR);
        if (style) {
          const metadataBlock = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style }
          });
          marker.after(metadataBlock);
        }
        marker.removeAttribute(MARKER_ATTR);
        if (marker.getAttribute(TEMP_ATTR) === "true") marker.remove();
      });
      collapseEmptySections(element);
    }
  }

  // tools/importer/transformers/destinationpet-dm-images.js
  function detectDynamicMediaUrl(urlStr) {
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) {
      return "scene7";
    }
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  var LINKED_DM_INLINE_WRAPPER_TAGS = /* @__PURE__ */ new Set(["PICTURE"]);
  var LINKED_DM_WRAPPER_SIBLING_TAGS = /* @__PURE__ */ new Set(["SOURCE"]);
  function findLinkedDmCarrier(img) {
    if (!img || !img.parentElement) return null;
    let node = img;
    let parent = img.parentElement;
    while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
      let foundNode = false;
      for (const child of parent.children) {
        if (child === node) {
          foundNode = true;
        } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
          return null;
        }
      }
      if (!foundNode) return null;
      node = parent;
      parent = parent.parentElement;
    }
    if (!parent || parent.tagName !== "A") return null;
    if (parent.children.length !== 1 || parent.children[0] !== node) return null;
    if (parent.textContent.trim() !== "") return null;
    return parent;
  }
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function altToLinkText(alt) {
    return alt || EMPTY_ALT_SENTINEL;
  }
  var DROP_DM_PARAMS = ["ts", "dpr", "fmt"];
  function normalizeDmUrl(src) {
    const qIdx = src.indexOf("?");
    if (qIdx < 0) return src;
    const kept = src.slice(qIdx + 1).split("&").filter((pair) => pair && !DROP_DM_PARAMS.includes(pair.split("=")[0]));
    return kept.length ? `${src.slice(0, qIdx)}?${kept.join("&")}` : src.slice(0, qIdx);
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const rawSrc = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(rawSrc)) return;
      const src = normalizeDmUrl(rawSrc);
      const alt = img.getAttribute("alt") || "";
      const linkedAnchor = findLinkedDmCarrier(img);
      if (linkedAnchor) {
        linkedAnchor.setAttribute("title", src);
        linkedAnchor.textContent = altToLinkText(alt);
        return;
      }
      const parent = img.parentElement;
      if (parent && parent.tagName === "A") {
        console.warn("DM image inside mixed-content anchor, skipped:", src);
        return;
      }
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = altToLinkText(alt);
      img.replaceWith(a);
    });
  }

  // tools/importer/import-html-sitemap.js
  var parsers = {};
  var PAGE_TEMPLATE = {
    "name": "html-sitemap",
    "description": "Hierarchical link listing with grouped subheadings and nested lists of page links",
    "urls": [
      "https://www.destinationpet.com/html-sitemap/"
    ],
    "blocks": [],
    "sections": [
      {
        "id": "1",
        "name": "Sitemap",
        "selector": [
          ".htmlsitemap"
        ],
        "style": "sitemap",
        "blocks": [],
        "defaultContent": [
          "h1.sitemap__heading",
          "ul.sitemap__subheading"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    transform2,
    // single styled section (sitemap) still needs its Section Metadata
    transform3
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
  var import_html_sitemap_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: [...new Set(pageBlocks.map((b) => b.name))]
        }
      }];
    }
  };
  return __toCommonJS(import_html_sitemap_exports);
})();
