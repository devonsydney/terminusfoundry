// Eleventy 3 configuration for terminusfoundry.com (ESM).
// Input src/, output _site/. Content HTML is never run through a template engine; only layouts are.
import fs from "node:fs";
import { imageTransformPlugin } from "@11ty/eleventy-img";
import rssPlugin from "@11ty/eleventy-plugin-rss";

const guides = JSON.parse(fs.readFileSync(new URL("./src/_data/guides.json", import.meta.url), "utf8"));

// ---- Link rewriting: old Ghost URLs inside the content become /guides/<guide>/... paths ----

function contentSlugs(source) {
  const out = new Set();
  for (const kind of ["posts", "pages"]) {
    for (const f of fs.readdirSync(`src/content/${source}/${kind}`)) {
      if (f.endsWith(".html")) out.add(f.replace(/\.html$/, ""));
    }
  }
  return out;
}
const knownSlugs = Object.fromEntries(Object.values(guides).map((g) => [g.slug, contentSlugs(g.source)]));
// Old slugs that no longer exist, mapped to the page they meant ("" is the guide index).
// lastpass was dropped on 2026-10-24, tf and contribute on 2026-10-25; the two ev slugs were already 404 on the live site.
const slugAliases = {
  security: { home: "", lastpass: "", tf: "", contribute: "" },
  ev: { home: "", tf: "", contribute: "", "future-potential": "future", "cool-capabilities": "capabilities" },
};
const hostToGuide = Object.fromEntries(Object.values(guides).map((g) => [g.old_host, g.slug]));
const CONTENT_SIZES = "(min-width: 840px) 760px, calc(100vw - 4rem)";

function guidePath(guide, rel) {
  const m = rel.match(/^([^#?]*)(.*)$/);
  const p = m[1].replace(/^\/+|\/+$/g, "");
  const suffix = m[2];
  const base = `/guides/${guide}/`;
  if (p === "" || p === "posts") return base + suffix;
  if (p in slugAliases[guide]) {
    const t = slugAliases[guide][p];
    return base + (t ? `${t}/` : "") + suffix;
  }
  if (knownSlugs[guide].has(p)) return `${base}${p}/${suffix}`;
  if (/^(tag|author)\/[^/]+$/.test(p)) return `${base}${p}/${suffix}`;
  if (p === "rss" || p === "posts/rss") return `${base}rss.xml${suffix}`;
  return null;
}

function rewriteHref(href, guide) {
  const abs = href.match(/^https?:\/\/([^/]+)(\/.*)?$/);
  if (abs) {
    const g = hostToGuide[abs[1]];
    return g ? (guidePath(g, abs[2] || "") ?? href) : href;
  }
  if (href.startsWith("../")) return guidePath(guide, href.slice(3)) ?? href;
  if (href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/images/") && !href.startsWith("/static/")) {
    return guidePath(guide, href.slice(1)) ?? href;
  }
  return href;
}

// forFeed: no eleventy-img attributes (the feed is XML and is not transformed).
function guideLinks(html, guide, forFeed = false) {
  if (!html) return "";
  let out = html.replace(/href="([^"]*)"/g, (m, href) => `href="${rewriteHref(href, guide)}"`);
  out = out.replace(/<img\b[^>]*>/g, (tag) => {
    const src = (tag.match(/\bsrc="([^"]*)"/) || [])[1] || "";
    let t = tag;
    if (src.startsWith("/images/")) {
      t = t.replace(/\s+srcset="[^"]*"/g, "").replace(/\s+sizes="[^"]*"/g, "");
    }
    if (forFeed) return t;
    const untouched = !src.startsWith("/images/") || /\.gif([?#]|$)/i.test(src);
    if (untouched) {
      if (!/\beleventy:ignore\b/.test(t)) t = t.replace(/^<img\b/, "<img eleventy:ignore");
    } else {
      if (!/\bsizes=/.test(t)) t = t.replace(/^<img\b/, `<img sizes="${CONTENT_SIZES}"`);
      if (!/\bloading=/.test(t)) t = t.replace(/^<img\b/, '<img loading="lazy" decoding="async"');
    }
    return t;
  });
  return out;
}

// ---- Small helpers ----

const stripTags = (html) => String(html || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const escapeAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const isoDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

function truncateWords(text, n) {
  const words = stripTags(text).split(" ");
  return words.length <= n ? words.join(" ") : words.slice(0, n).join(" ");
}

function readingTime(html) {
  const words = stripTags(html).split(" ").filter(Boolean).length;
  const images = (String(html || "").match(/<img\b/g) || []).length;
  let imageSeconds = 0;
  for (let i = 0; i < images; i++) imageSeconds += Math.max(12 - i, 3);
  const minutes = Math.round(words / 275 + imageSeconds / 60);
  return `${Math.max(minutes, 1)} min read`;
}

function findTag(tagList, needle) {
  const wanted = Array.isArray(needle) ? needle : needle ? [needle] : [];
  for (const slug of wanted) {
    const t = (tagList || []).find((x) => x.slug === slug);
    if (t) return t;
  }
  return null;
}

function coverImg(src, alt) {
  const a = escapeAttr(alt || "");
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return `<img eleventy:ignore src="${src}" alt="${a}">`;
  return `<img src="${src}" alt="${a}" sizes="100vw" fetchpriority="high">`;
}

function guideLastUpdated(items, guide) {
  let latest = "";
  for (const p of items) {
    if (!p.data || p.data.guide !== guide || !p.data.slug) continue;
    const u = p.data.updated ? isoDate(p.data.updated) : isoDate(p.date);
    if (u > latest) latest = u;
  }
  return latest;
}

export default function (eleventyConfig) {
  eleventyConfig.ignores.add("src/family/**");

  eleventyConfig.addPassthroughCopy({
    "src/assets/css": "assets/css",
    "src/assets/js": "assets/js",
    "src/assets/fonts": "assets/fonts",
    "src/assets/logos": "assets/logos",
    "src/assets/favicons": "assets/favicons",
    "src/assets/favicons/favicon.ico": "favicon.ico",
    "src/images": "images",
    "src/static": "static",
  });

  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(imageTransformPlugin, {
    widths: [320, 640, 960, 1920],
    formats: ["webp", "auto"],
    urlPath: "/images/opt/",
    outputDir: "./_site/images/opt/",
    htmlOptions: { imgAttributes: {}, pictureAttributes: {} },
  });

  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");
  eleventyConfig.addLayoutAlias("page", "layouts/page.njk");

  eleventyConfig.addFilter("guideLinks", guideLinks);
  eleventyConfig.addFilter("stripTags", stripTags);
  eleventyConfig.addFilter("truncateWords", truncateWords);
  eleventyConfig.addFilter("isoDate", isoDate);
  eleventyConfig.addFilter("readingTime", readingTime);
  eleventyConfig.addFilter("findTag", findTag);
  eleventyConfig.addFilter("coverImg", coverImg);
  eleventyConfig.addFilter("guideLastUpdated", guideLastUpdated);
  eleventyConfig.addFilter("whereGuide", (items, guide) => (items || []).filter((p) => p.data && p.data.guide === guide));

  // Ghost published_at, not the day-only date: why and lesson-plan share 2021-01-02, and the live sites order by the timestamp.
  const published = (p) => new Date(p.data.ghost_published_at || p.date).getTime();
  const byDateAsc = (a, b) => published(a) - published(b);
  for (const g of Object.values(guides)) {
    eleventyConfig.addCollection(`${g.slug}Posts`, (api) => api.getFilteredByGlob(`src/content/${g.source}/posts/*.html`).sort(byDateAsc));
  }
  eleventyConfig.addCollection("guideHomes", (api) => api.getFilteredByGlob("src/content/*/pages/home.html"));
  eleventyConfig.addCollection("guideTagPages", (api) => {
    const posts = api.getFilteredByGlob("src/content/*/posts/*.html");
    return Object.values(guides).flatMap((g) =>
      g.tags.map((tag) => ({
        guide: g.slug,
        tag,
        posts: posts.filter((p) => p.data.guide === g.slug && (p.data.tags || []).includes(tag.slug)).sort((a, b) => byDateAsc(b, a)),
      })),
    );
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: false,
    markdownTemplateEngine: "njk",
  };
}
