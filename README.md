# Terminus Foundry

Static site for terminusfoundry.com, built with Eleventy 3 and deployed to GitHub Pages by GitHub Actions. It carries the company home page at `/` and two guides that used to be Ghost blogs: Safe Living in the Internet Age (`/guides/security/`, formerly sec.terminusfoundry.com) and Electric Vehicles (`/guides/ev/`, formerly ev.terminusfoundry.com).

Brand: `brand-terminus-foundry` 1.1.1 (Poppins for headings and body, ground #202020, tokens in `src/assets/css/tokens.css`).

## Local commands

Node 22 or later.

| Command | What it does |
| --- | --- |
| `npm install` | Installs Eleventy, eleventy-img, the RSS plugin and sharp |
| `npm run build` | Builds the site into `_site/` (optimised images land in `_site/images/opt/`) |
| `npm run serve` | Builds and serves at http://localhost:8080/ with live reload |
| `npm run check` | Compares each post's text with its source file and greps the output for dropped services |
| `npm run redirects` | Regenerates the redirect stubs under `redirects/` |
| `npm run favicons` | Regenerates the favicon set from the brand tile mark |
| `python3 tools/theme/derive-guide-css.py` | Regenerates `src/assets/css/guide.css` from the reference theme CSS |

The build has no warnings when it is healthy. `npm run check` exits non-zero on any difference.

## Layout

| Path | Contents |
| --- | --- |
| `eleventy.config.js` | Collections per guide, link rewriting from the old hosts, image transform, RSS plugin, filters |
| `src/index.njk` | Company home page (dark only). The services paragraph is a marked placeholder |
| `src/404.njk`, `src/robots.njk`, `src/sitemap.njk`, `src/cname.njk`, `src/nojekyll.njk` | Site-level files |
| `src/_data/site.json` | Site URL, name, contact address |
| `src/_data/guides.json` | One entry per guide: slug, old host, title, cover, navigation, tags, `archived` flag |
| `src/content/<sec|ev>/posts/*.html`, `pages/*.html` | Converted Ghost content with YAML front matter. `home.html` becomes the guide index; `sec/pages/lastpass.html` is kept in source but not built |
| `src/content/<sec|ev>/*.11tydata.js` | Guide name and permalinks for the content folders |
| `src/guides/` | Guide index, tag, author and RSS templates (paginated over `guides.json`) |
| `src/_includes/layouts/` | `guide.njk` shell, `post.njk`, `page.njk` |
| `src/_includes/partials/` | Head icons, post list, archive notice |
| `src/assets/css/` | `tokens.css` (brand), `home.css`, `guide.css` (derived, do not edit by hand) |
| `src/assets/theme-reference/` | The unmodified attila-mod stylesheet and its MIT licence, input to the derive script |
| `src/assets/js/guide.js` | Menu, cover parallax, theme toggle, reading progress |
| `src/assets/fonts/`, `src/assets/logos/`, `src/assets/favicons/` | Poppins and icon fonts, logos, generated favicons |
| `src/images/<sec|ev>/` | Images extracted from the Ghost backups, served at `/images/...` |
| `src/static/` | Files served as-is at `/static/` (see the PDF note below) |
| `src/family/` | Reserved for the unlinked family area; ignored by the build. `README.md` there describes the StatiCrypt plan |
| `redirects/sec/`, `redirects/ev/` | Meta-refresh stubs for every old URL, each with its own `CNAME`, for two small repositories to be created later |
| `scripts/` | `check-content.py`, `check-output.sh`, `build-redirects.mjs`, `favicons.mjs` |
| `tools/ghost-export/` | The pre-work conversion scripts (`ghost_to_content.py`, `extract_images.py`) |
| `tools/theme/` | `derive-guide-css.py` |
| `.github/workflows/deploy.yml` | Build and deploy on push to `main` |

### Company logos

`src/assets/logos/companies/` holds the former-employer marks on the home page: each company's minimal mark, not its full wordmark. The source files were downloaded on 2026-10-25 and are self-hosted (no hotlinks). They show a fact of employment, not a client list or an endorsement; each company's trademark stays its own. The home page makes them one colour with a CSS filter, and each links to the company's website. Arrival went into administration in 2024 and its site is gone, so its mark links to its English Wikipedia article.

| File | Source | Changes |
| --- | --- | --- |
| `decimo-mark.png` | Decimo wordmark from the public decimo.tech site | Cropped to the "d" |
| `arrival-mark.svg` | English Wikipedia, `File:Arrival logo.svg` (non-free logo) | Kept the asterisk path only |
| `seabird-mark.png` | Seabird Technologies careers page (seabird-technologies.homerun.co) | Cropped to the swoop |
| `shell.svg` | English Wikipedia, `File:Shell logo.svg` (non-free logo) | Kept the red outline path only, so the pecten reads as line art |
| `air-canada-mark.svg` | Wikimedia Commons, `File:Air Canada logo.svg` (public domain) | Kept the maple-leaf rondel path only |

### Fonts

Poppins loads with `font-display: optional`, and the home and guide layouts preload the Regular and SemiBold files. The text never swaps fonts: Poppins shows from the first paint, or, on a slow first visit, the fallback stays for that page. The fonts are WOFF2, about 51 KB each, converted on 2026-10-25 from the brand's Poppins TTF files (about 160 KB each) with fonttools 4.67.0 and no subsetting. To convert again: `python3 -c "from fontTools.ttLib import TTFont; f = TTFont('Poppins-Regular.ttf'); f.flavor = 'woff2'; f.save('Poppins-Regular.woff2')"` with `fonttools` and `brotli` installed.

### Setting the EV guide to archived

Set `"archived": true` on the `ev` entry in `src/_data/guides.json`. Every EV page then shows a notice with the last updated date, taken from the newest `updated` or `date` in its content. The default is `false`.

## Regenerating content from a Ghost export

1. Unzip only the `content/` JSON export from a Ghost backup. Never unzip the backup's `data/` folder; it holds the admin password hash.
2. Run `python3 tools/ghost-export/ghost_to_content.py <export.json> src/content/<site>` to write posts and pages with front matter and image paths rewritten to `/images/<site>/...`.
3. Run `python3 tools/ghost-export/extract_images.py <backup.zip> src/images/<site>` to pull the referenced images. Guide cover images named in `src/_data/guides.json` are extracted separately by name.
4. Rebuild and run `npm run check`.

Links in the content still point at the old hosts in the source files. The build rewrites them to the new paths (see `guideLinks` in `eleventy.config.js`), so the source wording stays as exported.

Two content edits were made on purpose: the broken `lh5.googleusercontent.com` image was removed, and the `https://https://unsplash.com` link on the EV guide was fixed.

## What was dropped from the Ghost sites

Share buttons, search, members Portal, Stripe, Disqus, tocbot, Fathom and Google Analytics. No analytics of any kind.

Content dropped by decision: the LastPass page (2026-10-24); the TF page in both guides, as out of date, with the old `/tf/` URLs redirected to the company home page (2026-10-25); and the Contribute page in both guides, with the old `/contribute/` URLs redirected to each guide's index (2026-10-25). The footer links to TF and Contribute went with them. The security guide's Contribute page carried a Bitcoin donation address and QR banner that were never used; they were cut from the source and the banner image deleted. The other sources stay in `src/content/` for the record, so a fresh Ghost conversion would bring these pages back. The Dark/Light toggle stays (`data-theme` on `<html>`, stored in `localStorage` as `tf_theme`).

## GitHub steps (done by Devon in the web interface, never by an agent)

Done on 2026-10-25: Pages source set to GitHub Actions, ruleset `protect-main` active (pull request required, 0 approvals, deletions and force pushes blocked), `github-pages` environment allows `main`, HTTPS enforced, terminusfoundry.com verified for the account.

The apex already points at GitHub Pages, so the merge puts the new site live at once. Do not unpublish Pages: that takes terminusfoundry.com offline. With an Actions deploy, GitHub ignores the `CNAME` file; the custom domain comes from the field in Settings → Pages.

1. This repository was started with a fresh `git init`, so its history is unrelated to GitHub's `main`. Merge GitHub's `main` into `static-relaunch` first, removing the old site's files, or GitHub cannot open a pull request.
2. Add the remote and push the branch:

   ```bash
   git remote add origin git@github.com:devonsydney/terminusfoundry.git
   git push -u origin static-relaunch
   ```

3. Open a pull request from `static-relaunch` to `main` and merge it. The merge runs `.github/workflows/deploy.yml`, which builds the site and deploys it to Pages.
4. Wait for the Actions run to finish green, then check https://terminusfoundry.com/, `/guides/security/` and `/guides/ev/`.

## DNS (Namecheap BasicDNS)

Records as checked on 2026-10-25:

| Host | Type | Points at | Note |
| --- | --- | --- | --- |
| `@` | A ×4 | GitHub Pages (185.199.108–111.153) | Serves the site; no change needed |
| `www` | CNAME | devonsydney.github.io | Redirects to the apex; no change needed |
| `sec`, `ev` | none | Deleted 2026-10-25 | Old guide links fail until the redirect repositories are live (see below) |
| `fathom`, `discourse` | none | Deleted 2026-10-25 | Droplet services; gone |
| MX | Google | Gmail mail setting | Set by Mail Settings, so not listed among the host records. No mailbox exists, so mail to the contact address is probably not delivered |

### Contact address

Until mail works, the site shows no email address. The home page, both Contact pages and both TF pages link to LinkedIn (`linkedin` in `src/_data/site.json`; the content pages carry the URL directly and a "temporary 2026-10-25" comment). The domain's mail setting is Gmail, but there is no Google mailbox for it. To receive mail, change Mail Settings in Namecheap to Email Forwarding and add a catch-all forward to a personal address, then send a test message. Then restore the four addresses the old sites used (home contact, the two guide contacts and the "write us" link on the TF pages); they are deliberately not recorded here because the repository is public.

### Droplet retired (2026-10-25)

Devon destroyed the DigitalOcean droplet on 2026-10-25, with no final snapshot. Before that: no paid Ghost members on either site, Stripe disconnected from both, backups switched off, the `medusa-spaces` bucket deleted, and the four Namecheap A records and five DigitalOcean DNS zones deleted. Its address no longer answers, and no name on Devon's domains points at it. Devon then deleted the DigitalOcean account that held it, so its retained backups went too. The Ghost content is in the 2023-05-02 backups in Drive. The guides are offline until this branch is merged.

To bring the old `sec.` and `ev.` links back as redirects:

1. Create two repositories from `redirects/sec/` and `redirects/ev/`. In each, set Settings → Pages → Source to **Deploy from a branch**, `main`, root. Each folder already holds its `CNAME`.
2. In Namecheap, add `sec` and `ev` CNAME records to `devonsydney.github.io.`. Wait for the Pages DNS check and certificate on each, then enforce HTTPS.
3. Test a few old URLs on both subdomains.

Namecheap's own URL redirect records were not chosen for the subdomains: their documentation does not describe HTTPS or path forwarding.

### PDF note

The security guide links to `/static/securityscorecard_1.0.1.pdf`. On the droplet that file is served by nginx and it is not in the Ghost backups. A copy with the same name (one page, 25,991 bytes, dated 2021-04-27) was taken from Devon's Drive on 2026-10-25 and is in `src/static/`. Before the droplet was destroyed it was compared with the droplet's copy: same SHA-256.
