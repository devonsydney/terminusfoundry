# Static site pre-work

Last updated: 2026-10-24
Status: Generated from the 2023-05-02 Ghost exports. Nothing here is a Git repository; the build session copies this folder into the repository and runs from there.

| Item | What it is |
| --- | --- |
| `ghost_to_content.py` | Converts a Ghost 4 content export into one HTML file per published post or page with YAML front matter. Reads posts, tags, posts_tags and the public settings only; the users block (which holds the admin password hash) is never read |
| `extract_images.py` | Copies the originals that the converted content references out of a backup zip; resized references are mapped back to originals; `_o` pre-optimisation copies are skipped. Tested 2026-10-24: sec 31 of 31 found (25.9 MB), ev 24 of 24 found (14.1 MB) |
| `content/sec/` | 9 posts and 6 pages from Safe Living in the Internet Age, plus `site.json` and `images-referenced.txt` |
| `content/ev/` | 12 posts and 5 pages from Electric Vehicles: The Ultimate Guide, plus the same two files |

Front matter keys: `title`, `slug`, `layout` (post or page), `site`, `date` (first published), `updated`, the full Ghost timestamps, `excerpt`, `feature_image`, `meta_title`, `meta_description`, `featured`, `visibility`, `tags`, `custom_template`, `ghost_uuid`. Image paths are `/images/<site>/...`; external images (Unsplash) are unchanged.

Skipped as unpublished drafts: sec `playground` (page), `notes`, `bitwarden` ("BitWarden Setup [Archived]"); ev `primer`, `glossary`, `notes`. They stay in the exports if wanted later.

Decisions that shape the build are in `../2026-10-24 - Static relaunch plan.md`, sections 11 and 12.
