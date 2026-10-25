// Directory data for the security guide (the former sec.terminusfoundry.com).
// Every post and page here lands under /guides/security/<slug>/.
// "home" is rendered inside the guide index, not as its own page; "lastpass" (2026-10-24), "tf" and "contribute" (2026-10-25) are dropped.
export default {
  guide: "security",
  eleventyComputed: {
    permalink: (data) => ["home", "lastpass", "tf", "contribute"].includes(data.slug) ? false : `/guides/${data.guide}/${data.slug}/`,
    eleventyExcludeFromCollections: (data) => ["lastpass", "tf", "contribute"].includes(data.slug),
  },
};
