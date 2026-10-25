#!/usr/bin/env python3
"""Fidelity check: the words of every converted post and page must appear unchanged in the built site.

Source: src/content/<site>/{posts,pages}/<slug>.html (front matter + Ghost HTML).
Built:  _site/guides/<guide>/<slug>/index.html, the part between <!-- content:start --> and <!-- content:end -->
        (the "home" page is rendered inside the guide index; "lastpass", "tf" and "contribute" are dropped and skipped).
Both sides are reduced to words: tags stripped, entities decoded, whitespace collapsed. Link targets and image
markup may differ (links are rewritten and images are optimised at build time); the text may not.
Exit status 1 if any file differs. Run after the build: python3 scripts/check-content.py
"""
import difflib
import html
import pathlib
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
GUIDES = {"sec": "security", "ev": "ev"}
SKIP = {("sec", "lastpass"), ("sec", "tf"), ("ev", "tf"), ("sec", "contribute"), ("ev", "contribute")}


class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def words(markup):
    p = Text()
    p.feed(markup)
    p.close()
    return html.unescape(" ".join(p.parts)).split()


def source_body(path):
    text = path.read_text(encoding="utf-8")
    if text.startswith("---"):
        end = text.index("\n---", 3)
        return text[end + 4:]
    return text


def built_body(path):
    text = path.read_text(encoding="utf-8")
    start = text.index("<!-- content:start -->") + len("<!-- content:start -->")
    end = text.index("<!-- content:end -->", start)
    return text[start:end]


def main():
    failed = 0
    checked = 0
    for site, guide in GUIDES.items():
        for kind in ("posts", "pages"):
            for src in sorted((ROOT / "src/content" / site / kind).glob("*.html")):
                slug = src.stem
                if (site, slug) in SKIP:
                    print(f"skip  {site}/{kind}/{slug} (dropped by decision)")
                    continue
                built = ROOT / "_site/guides" / guide / ("" if slug == "home" else slug) / "index.html"
                if not built.exists():
                    print(f"FAIL  {site}/{kind}/{slug}: no built page at {built.relative_to(ROOT)}")
                    failed += 1
                    continue
                a, b = words(source_body(src)), words(built_body(built))
                checked += 1
                if a == b:
                    print(f"ok    {site}/{kind}/{slug} ({len(a)} words)")
                else:
                    failed += 1
                    print(f"FAIL  {site}/{kind}/{slug}: {len(a)} source words, {len(b)} built words")
                    for line in list(difflib.unified_diff(a, b, "source", "built", lineterm="", n=2))[:40]:
                        print("      " + line)
    print(f"{checked} files checked, {failed} differ")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
