/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-footer.js
  var import_footer_exports = {};
  __export(import_footer_exports, {
    default: () => import_footer_default
  });
  var SOCIAL_ICONS = {
    "facebook.com": { src: "images/icon-facebook.svg", alt: "Facebook" },
    "instagram.com": { src: "images/icon-instagram.svg", alt: "Instagram" },
    "linkedin.com": { src: "images/icon-linkedin.svg", alt: "LinkedIn" }
  };
  function relHref(href) {
    if (!href) return "#";
    return href.replace(/^https?:\/\/(www\.)?destinationpet\.com/i, "") || "/";
  }
  function text(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }
  var import_footer_default = {
    transform: ({ document }) => {
      const footer = document.querySelector("div.footer.aem-GridColumn") || document.body;
      const parts = [];
      const logo = footer.querySelector(".footer__logo img, img");
      const pLogo = document.createElement("p");
      const img = document.createElement("img");
      img.src = "images/destinationpet-logo-white.png";
      img.alt = logo && logo.alt || "Destination Pet Logo";
      pLogo.append(img);
      parts.push(pLogo);
      parts.push(document.createElement("hr"));
      footer.querySelectorAll(".footer__category").forEach((cat) => {
        const headingEl = [...cat.querySelectorAll("p")].find((p) => text(p) && !p.closest("a") && !p.closest("dd"));
        if (!headingEl) return;
        const h = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = text(headingEl);
        h.append(strong);
        parts.push(h);
        const contact = cat.querySelector(".cmp-contentfragment");
        if (contact) {
          contact.querySelectorAll("dd p").forEach((line) => {
            const a = line.querySelector("a");
            const p = document.createElement("p");
            if (a) {
              const link = document.createElement("a");
              link.href = a.getAttribute("href");
              link.textContent = text(a);
              p.append(link);
            } else {
              p.textContent = text(line);
            }
            if (text(p)) parts.push(p);
          });
          return;
        }
        const ul = document.createElement("ul");
        cat.querySelectorAll("a").forEach((a) => {
          const label = text(a);
          if (!label) return;
          const li = document.createElement("li");
          const link = document.createElement("a");
          link.href = relHref(a.getAttribute("href"));
          link.textContent = label;
          li.append(link);
          ul.append(li);
        });
        parts.push(ul);
      });
      parts.push(document.createElement("hr"));
      const copyright = footer.querySelector(".footer__copyright-text p, .footer__copyright-text");
      if (copyright) {
        const p = document.createElement("p");
        p.textContent = text(copyright);
        parts.push(p);
      }
      const sUl = document.createElement("ul");
      footer.querySelectorAll(".footer__social-share a, .footer__copyright a").forEach((sa) => {
        const href = sa.getAttribute("href") || "";
        const key = Object.keys(SOCIAL_ICONS).find((k) => href.includes(k));
        if (!key) return;
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = href;
        const im = document.createElement("img");
        im.src = SOCIAL_ICONS[key].src;
        im.alt = SOCIAL_ICONS[key].alt;
        link.append(im);
        li.append(link);
        sUl.append(li);
      });
      parts.push(sUl);
      document.body.replaceChildren(...parts);
      return [{
        element: document.body,
        path: "/footer",
        report: { title: "footer" }
      }];
    }
  };
  return __toCommonJS(import_footer_exports);
})();
