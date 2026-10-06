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

  // tools/importer/import-content-landing-page.js
  var import_content_landing_page_exports = {};
  __export(import_content_landing_page_exports, {
    default: () => import_content_landing_page_default
  });

  // tools/importer/parsers/hero-banner.js
  function hint(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function parse(element, { document }) {
    const image = element.querySelector(".hero__image img, .hero__container img");
    const content = element.querySelector(".hero__content") || element;
    const heading = content.querySelector("h1, h2, .cmp-title__text");
    const descriptions = [...content.querySelectorAll(".hero__content-description p, .hero__content-description .cmp-text p")].filter((p) => p.textContent.trim() !== "");
    const ctas = [...content.querySelectorAll(".button a[href], a.button__bdl[href]")].filter((a, i, arr) => arr.indexOf(a) === i).map((a) => {
      const label = (a.querySelector(".button__text") || a).textContent.trim();
      if (!label) return null;
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = label;
      p.appendChild(link);
      return p;
    }).filter(Boolean);
    if (!image && !heading) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const textNodes = [];
    if (heading) {
      const h1 = document.createElement("h1");
      h1.textContent = heading.textContent.trim();
      textNodes.push(h1);
    }
    textNodes.push(...descriptions, ...ctas);
    const cells = [];
    cells.push([image ? hint(document, "image", [image]) : ""]);
    cells.push([textNodes.length ? hint(document, "text", textNodes) : ""]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  var CONTENT_SELECTOR = "h1, h2, h3, h4, h5, h6, p, ul, ol";
  function collectContent(container, document) {
    const out = [];
    if (!container) return out;
    container.querySelectorAll(`${CONTENT_SELECTOR}, img, .button a[href], a.button__bdl[href]`).forEach((el) => {
      if (out.some((o) => o.contains && o.contains(el))) return;
      if (el.tagName === "A") {
        const label = (el.querySelector(".button__text") || el).textContent.trim();
        if (!label) return;
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = el.getAttribute("href");
        a.textContent = label;
        p.appendChild(a);
        out.push(p);
        return;
      }
      if (el.tagName === "IMG") {
        out.push(el);
        return;
      }
      if (el.textContent.trim() === "" && !el.querySelector("img")) return;
      out.push(el);
    });
    return out;
  }
  function parse2(element, { document }) {
    const wrapper = element.querySelector(".media-info__wrapper") || element;
    let columns = [...wrapper.querySelectorAll(":scope > .media-info__left, :scope > .media-info__right")];
    if (!columns.length) columns = [...wrapper.children];
    const row = columns.map((col) => {
      const nodes = collectContent(col, document);
      return nodes.length ? nodes : "";
    });
    if (!row.some((c) => c !== "")) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [row];
    const reversed = element.matches(".media-info--right") || !!element.querySelector(":scope .media-info--right");
    const name = reversed ? "columns-media (reverse)" : "columns-media";
    const block = WebImporter.Blocks.createBlock(document, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-values.js
  function hint2(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function collectText(container, document) {
    const out = [];
    if (!container) return out;
    container.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, .button a[href], a.button__bdl[href]").forEach((el) => {
      if (out.some((o) => o.contains(el))) return;
      if (el.tagName === "A") {
        const label = (el.querySelector(".button__text") || el).textContent.trim();
        if (!label) return;
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = el.getAttribute("href");
        a.textContent = label;
        p.appendChild(a);
        out.push(p);
        return;
      }
      if (el.textContent.trim() === "") return;
      out.push(el);
    });
    return out;
  }
  function parse3(element, { document }) {
    let cards = [...element.querySelectorAll(".infocards")];
    if (!cards.length) cards = [...element.querySelectorAll(".info-card")];
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector(".info-card__asset img, img");
      const textNodes = collectText(card.querySelector(".info-card__text") || card, document);
      if (!img && !textNodes.length) return;
      cells.push([
        img ? hint2(document, "image", [img]) : "",
        textNodes.length ? hint2(document, "text", textNodes) : ""
      ]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-values", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-promo.js
  function hint3(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function collectText2(container, document) {
    const out = [];
    if (!container) return out;
    container.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, .button a[href], a.button__bdl[href]").forEach((el) => {
      if (out.some((o) => o.contains(el))) return;
      if (el.tagName === "A") {
        const label = (el.querySelector(".button__text") || el).textContent.trim();
        if (!label) return;
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = el.getAttribute("href");
        a.textContent = label;
        p.appendChild(a);
        out.push(p);
        return;
      }
      if (el.textContent.trim() === "") return;
      out.push(el);
    });
    return out;
  }
  function parse4(element, { document }) {
    let cards = [...element.querySelectorAll(".info-card")];
    if (!cards.length) cards = [element];
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector(".info-card__asset img") || card.querySelector("img");
      const textNodes = collectText2(card.querySelector(".info-card__text") || card, document);
      if (!img && !textNodes.length) return;
      cells.push([
        img ? hint3(document, "image", [img]) : "",
        textNodes.length ? hint3(document, "text", textNodes) : ""
      ]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote-testimonial.js
  function hint4(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  var ATTRIBUTION_RE = /^\s*[-–—~]/;
  function parse5(element, { document }) {
    element.querySelectorAll('.testimonial__header, [class*="testimonial__upper-quotes"], [class*="testimonial__lower-quotes"]').forEach((el) => el.remove());
    const desc = element.querySelector(".testimonial__description") || element;
    const paragraphs = [...desc.querySelectorAll("p")].filter((p) => p.textContent.trim() !== "");
    let attribution = null;
    if (paragraphs.length > 1 && ATTRIBUTION_RE.test(paragraphs[paragraphs.length - 1].textContent)) {
      attribution = paragraphs.pop();
    }
    if (!paragraphs.length && !attribution) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([paragraphs.length ? hint4(document, "quotation", paragraphs) : ""]);
    cells.push([attribution ? hint4(document, "attribution", [attribution]) : ""]);
    const block = WebImporter.Blocks.createBlock(document, { name: "quote-testimonial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-circle-cta.js
  function hint5(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function collectText3(container, document) {
    const out = [];
    if (!container) return out;
    container.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, .button a[href], a.button__bdl[href]").forEach((el) => {
      if (out.some((o) => o.contains(el))) return;
      if (el.tagName === "A") {
        const label = (el.querySelector(".button__text") || el).textContent.trim();
        if (!label) return;
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = el.getAttribute("href");
        a.textContent = label;
        p.appendChild(a);
        out.push(p);
        return;
      }
      if (el.textContent.trim() === "") return;
      out.push(el);
    });
    return out;
  }
  function parse6(element, { document }) {
    let cards = [...element.querySelectorAll(".infocards")];
    if (!cards.length) cards = [...element.querySelectorAll(".info-card")];
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector(".info-card__asset img") || card.querySelector("img");
      const textNodes = collectText3(card.querySelector(".info-card__text") || card, document);
      if (!img && !textNodes.length) return;
      cells.push([
        img ? hint5(document, "image", [img]) : "",
        textNodes.length ? hint5(document, "text", textNodes) : ""
      ]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-circle-cta", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-logos.js
  var BAND = ".columncontainer.background-color--primary";
  function hint6(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function captionFor(col) {
    if (!col) return [];
    return [...col.querySelectorAll(":scope > .richtext .cmp-text p, :scope > .text .cmp-text p, :scope > .title .cmp-title__text")].filter((el) => el.textContent.trim() !== "" && !el.querySelector("img"));
  }
  function parse7(element, { document }) {
    const rows = [element];
    let next = element.nextElementSibling;
    while (next && next.matches(".columncontainer") && !next.matches(BAND)) {
      rows.push(next);
      next = next.nextElementSibling;
    }
    const cells = [];
    rows.forEach((row) => {
      const images = [...row.querySelectorAll(".cmp-image")].filter((ci) => ci.querySelector("img"));
      images.forEach((ci) => {
        const img = ci.querySelector("img");
        const anchor = ci.querySelector("a[href]") || img.closest("a[href]");
        const col = ci.closest(".container__column");
        const colImages = col ? [...col.querySelectorAll(".cmp-image")].filter((x) => x.querySelector("img")) : [ci];
        const isLastInCol = colImages[colImages.length - 1] === ci;
        const caption = isLastInCol ? captionFor(col) : [];
        let linkNode = null;
        if (anchor) {
          linkNode = document.createElement("a");
          linkNode.href = anchor.getAttribute("href");
          linkNode.textContent = anchor.getAttribute("href");
        }
        cells.push([
          hint6(document, "image", [img]),
          caption.length ? hint6(document, "text", caption) : "",
          linkNode ? hint6(document, "link", [linkNode]) : ""
        ]);
      });
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    rows.slice(1).forEach((r) => r.remove());
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-logos", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-testimonial.js
  function hint7(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function splitAttribution(p, document) {
    p.querySelectorAll("b, strong").forEach((b) => {
      while (b.firstChild && (b.firstChild.nodeName === "BR" || b.firstChild.nodeType === 3 && !b.firstChild.textContent.trim())) {
        b.before(b.firstChild);
      }
    });
    const brs = [...p.querySelectorAll(":scope > br")];
    const br = brs[brs.length - 1];
    if (!br) return [p];
    const after = [];
    let n = br.nextSibling;
    while (n) {
      after.push(n);
      n = n.nextSibling;
    }
    const afterText = after.map((x) => x.textContent).join("").trim();
    if (!/^[-–—~]/.test(afterText)) return [p];
    const attribution = document.createElement("p");
    after.forEach((x) => attribution.appendChild(x));
    br.remove();
    return [p, attribution];
  }
  function parse8(element, { document }) {
    const title = element.querySelector(".carousel__title h2, .carousel__title h3");
    let items = [...element.querySelectorAll(".carousel__item")].filter((it) => !it.closest(".slick-cloned"));
    if (!items.length) items = [...element.querySelectorAll(".testimonialscard")].filter((it) => !it.closest(".slick-cloned"));
    const cells = [];
    items.forEach((item) => {
      const nameEl = item.querySelector(".testimonial__header-name");
      const name = nameEl ? nameEl.textContent.replace(/\s+/g, " ").trim() : "";
      let nameP = null;
      if (name) {
        nameP = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = name;
        nameP.appendChild(strong);
      }
      item.querySelectorAll('.testimonial__header, [class*="testimonial__upper-quotes"], [class*="testimonial__lower-quotes"]').forEach((el) => el.remove());
      const desc = item.querySelector(".testimonial__description") || item;
      const textNodes = [...desc.querySelectorAll("p, ul, ol")].filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el))).filter((el) => el.textContent.trim() !== "").flatMap((el) => el.tagName === "P" ? splitAttribution(el, document) : [el]);
      if (nameP && textNodes.length) textNodes.unshift(nameP);
      const img = item.querySelector("img");
      if (!textNodes.length && !img) return;
      cells.push([
        img ? hint7(document, "media_image", [img]) : "",
        textNodes.length ? hint7(document, "content_text", textNodes) : ""
      ]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    if (title && title.textContent.trim()) {
      const h2 = document.createElement("h2");
      h2.textContent = title.textContent.trim();
      element.before(h2);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-testimonial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-steps.js
  function hint8(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function collectText4(container, document) {
    const out = [];
    container.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, .button a[href], a.button__bdl[href]").forEach((el) => {
      if (out.some((o) => o.contains(el))) return;
      if (el.tagName === "A") {
        const label = (el.querySelector(".button__text") || el).textContent.trim();
        if (!label) return;
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = el.getAttribute("href");
        a.textContent = label;
        p.appendChild(a);
        out.push(p);
        return;
      }
      if (el.textContent.trim() === "") return;
      out.push(el);
    });
    return out;
  }
  function parse9(element, { document }) {
    const title = element.querySelector(".carousel__title h2, .carousel__title h3");
    let items = [...element.querySelectorAll(".carousel__item")].filter((it) => !it.closest(".slick-cloned"));
    if (!items.length) items = [...element.querySelectorAll(".slick-slide:not(.slick-cloned)")];
    const cells = [];
    items.forEach((item) => {
      const img = item.querySelector("img");
      const textNodes = collectText4(item, document);
      if (!img && !textNodes.length) return;
      cells.push([
        img ? hint8(document, "media_image", [img]) : "",
        textNodes.length ? hint8(document, "content_text", textNodes) : ""
      ]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    if (title && title.textContent.trim()) {
      const h2 = document.createElement("h2");
      h2.textContent = title.textContent.trim();
      element.before(h2);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-steps", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function hint9(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(typeof n === "string" ? document.createTextNode(n) : n));
    return frag;
  }
  function panelContent(panel) {
    if (!panel) return [];
    const nodes = [...panel.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, table, img")].filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el))).filter((el) => el.tagName === "IMG" || el.textContent.trim() !== "" || el.querySelector("img"));
    return nodes;
  }
  function parse10(element, { document }) {
    const items = [...element.querySelectorAll(".cmp-accordion__item")];
    const cells = [];
    items.forEach((item) => {
      const titleEl = item.querySelector(".cmp-accordion__title") || item.querySelector(".cmp-accordion__button, .cmp-accordion__header");
      const summary = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
      const body = panelContent(item.querySelector(".cmp-accordion__panel"));
      if (!summary && !body.length) return;
      let summaryNode = null;
      if (summary) {
        summaryNode = document.createElement("h3");
        summaryNode.textContent = summary;
      }
      cells.push([
        summaryNode ? hint9(document, "summary", [summaryNode]) : "",
        body.length ? hint9(document, "text", body) : ""
      ]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-faq", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-split.js
  function hint10(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(typeof n === "string" ? document.createTextNode(n) : n));
    return frag;
  }
  function panelContent2(panel) {
    if (!panel) return [];
    return [...panel.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, table, img")].filter((el, i, arr) => !arr.some((o) => o !== el && o.contains(el))).filter((el) => el.tagName === "IMG" || el.textContent.trim() !== "" || el.querySelector("img"));
  }
  function parse11(element, { document }) {
    let groups = [...element.querySelectorAll(".container__column")].filter((col) => col.querySelector(".cmp-accordion__item"));
    if (!groups.length) groups = [element];
    const cells = [];
    groups.forEach((group) => {
      const titleEl = [...group.querySelectorAll(".cmp-title__text, h1, h2, h3, h4")].find((h) => !h.closest(".accordion, .cmp-accordion") && h.textContent.trim() !== "");
      if (titleEl) {
        const h = document.createElement(/^H[1-6]$/.test(titleEl.tagName) ? titleEl.tagName.toLowerCase() : "h2");
        h.textContent = titleEl.textContent.trim();
        cells.push(["accordion-split-group", hint10(document, "title", [h])]);
      }
      group.querySelectorAll(".cmp-accordion__item").forEach((item) => {
        const t = item.querySelector(".cmp-accordion__title") || item.querySelector(".cmp-accordion__button, .cmp-accordion__header");
        const summary = t ? t.textContent.replace(/\s+/g, " ").trim() : "";
        const body = panelContent2(item.querySelector(".cmp-accordion__panel"));
        if (!summary && !body.length) return;
        let summaryNode = null;
        if (summary) {
          summaryNode = document.createElement("h3");
          summaryNode.textContent = summary;
        }
        cells.push([
          summaryNode ? hint10(document, "summary", [summaryNode]) : "",
          body.length ? hint10(document, "text", body) : ""
        ]);
      });
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-split", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/video-overlay.js
  function hint11(document, field, nodes) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    nodes.forEach((n) => frag.appendChild(n));
    return frag;
  }
  function parse12(element, { document }) {
    const video = element.querySelector("video");
    const sourceEl = element.querySelector("video source[src], video[src]");
    let src = sourceEl ? sourceEl.getAttribute("src") : "";
    if (!src) {
      const a = element.querySelector('a[href*=".mp4"], a[href*=".webm"], a[href*="/is/content/"]');
      if (a) src = a.getAttribute("href");
    }
    let poster = element.querySelector(".video__container img, img");
    const posterSrc = video && video.getAttribute("poster");
    if (!poster && posterSrc) {
      poster = document.createElement("img");
      poster.src = posterSrc;
      poster.alt = video.getAttribute("aria-label") || video.getAttribute("title") || "";
    }
    if (!src) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const link = document.createElement("a");
    link.href = src;
    link.textContent = src;
    const cells = [];
    cells.push([hint11(document, "uri", [link])]);
    cells.push([poster ? hint11(document, "placeholder_image", [poster]) : ""]);
    const block = WebImporter.Blocks.createBlock(document, { name: "video-overlay", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed-form.js
  function canonicalFormUrl(raw) {
    try {
      const u = new URL(raw, "https://www.destinationpet.com/");
      if (/jotform/i.test(u.hostname)) return `${u.origin}${u.pathname}`;
      ["parentURL", "jsForm"].forEach((p) => u.searchParams.delete(p));
      return u.toString();
    } catch (e) {
      return raw;
    }
  }
  function parse13(element, { document }) {
    const iframe = element.querySelector("iframe[src], iframe[data-src]");
    const raw = iframe ? iframe.getAttribute("src") || iframe.getAttribute("data-src") : "";
    if (!raw) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const url = canonicalFormUrl(raw);
    const link = document.createElement("a");
    link.href = url;
    link.textContent = (iframe.getAttribute("title") || "").trim() || url;
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(" field:embed_uri "));
    frag.appendChild(link);
    const cells = [[frag]];
    const block = WebImporter.Blocks.createBlock(document, { name: "embed-form", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-links.js
  function normalizeHref(href) {
    if (!href) return href;
    if (href.startsWith("#")) {
      const id = decodeURIComponent(href.slice(1)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      return `#${id}`;
    }
    return href;
  }
  function linkLabel(a) {
    return (a.querySelector(".button__text") || a).textContent.replace(/\s+/g, " ").trim();
  }
  function buildCell(col, document) {
    const anchors = [...col.querySelectorAll("a[href]")].filter((a) => linkLabel(a));
    const headings = [...col.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter((h) => h.textContent.trim());
    const texts = [...col.querySelectorAll(".cmp-text p")].filter((p) => p.textContent.trim() && !p.querySelector("a"));
    const out = [...headings, ...texts];
    const mk = (a) => {
      const link = document.createElement("a");
      link.href = normalizeHref(a.getAttribute("href"));
      link.textContent = linkLabel(a);
      return link;
    };
    if (anchors.length === 1) {
      const a = anchors[0];
      const p = document.createElement("p");
      const isButton = a.classList.contains("button__bdl") || !!a.closest(".button");
      if (isButton) {
        const strong = document.createElement("strong");
        strong.appendChild(mk(a));
        p.appendChild(strong);
      } else {
        p.appendChild(mk(a));
      }
      out.push(p);
    } else if (anchors.length > 1) {
      const ul = document.createElement("ul");
      anchors.forEach((a) => {
        const li = document.createElement("li");
        li.appendChild(mk(a));
        ul.appendChild(li);
      });
      out.push(ul);
    }
    return out.length ? out : "";
  }
  function parse14(element, { document }) {
    const row = element.querySelector(".row.container__layout-section, .row");
    let columns = row ? [...row.querySelectorAll(":scope > .container__column")] : [];
    if (!columns.length) columns = [...element.querySelectorAll(".container__column")];
    const cellsRow = columns.map((col) => buildCell(col, document)).filter((c) => c !== "");
    if (!cellsRow.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [cellsRow];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-links", cells });
    element.replaceWith(block);
  }

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
          entries.push({ el: band, top, style: styleFor(band) });
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

  // tools/importer/import-content-landing-page.js
  var parsers = {
    "hero-banner": parse,
    "columns-media": parse2,
    "cards-values": parse3,
    "cards-promo": parse4,
    "quote-testimonial": parse5,
    "cards-circle-cta": parse6,
    "cards-logos": parse7,
    "carousel-testimonial": parse8,
    "carousel-steps": parse9,
    "accordion-faq": parse10,
    "accordion-split": parse11,
    "video-overlay": parse12,
    "embed-form": parse13,
    "columns-links": parse14
  };
  var PAGE_TEMPLATE = {
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
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : [],
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
  var import_content_landing_page_default = {
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
  return __toCommonJS(import_content_landing_page_exports);
})();
