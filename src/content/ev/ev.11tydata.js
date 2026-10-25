// Directory data for the EV guide (the former ev.terminusfoundry.com).
// Every post and page here lands under /guides/ev/<slug>/; "home" is rendered inside the guide index; "tf" and "contribute" are dropped (2026-10-25).
export default {
  guide: "ev",
  eleventyComputed: {
    permalink: (data) => ["home", "tf", "contribute"].includes(data.slug) ? false : `/guides/${data.guide}/${data.slug}/`,
    eleventyExcludeFromCollections: (data) => ["tf", "contribute"].includes(data.slug),
  },
};
