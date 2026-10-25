# Family area (not built yet)

Decided on 2026-10-24: a family area will live at an unlinked path under this site with `noindex`, probably encrypted in the browser with StatiCrypt (https://github.com/robinmoisson/staticrypt), so the published HTML holds only ciphertext and the passphrase never enters this repository.

This folder is ignored by Eleventy (`eleventyConfig.ignores` in `eleventy.config.js`); `/family/` is excluded from `sitemap.xml` and disallowed in `robots.txt`. When the area is built:

1. Put the source pages here with `permalink: /family/<page>/` and `noindex: true`.
2. Remove the ignore rule for `src/family/` in `eleventy.config.js`.
3. Run StatiCrypt over the built `_site/family/` output as a post-build step (a script under `scripts/`), with the passphrase supplied from Bitwarden at build time, never from a file.
4. Keep the sitemap exclusion and the robots rule.
