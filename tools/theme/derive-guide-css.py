#!/usr/bin/env python3
"""Derive src/assets/css/guide.css from the attila-mod compiled stylesheet.

Reads the unchanged theme CSS kept at src/assets/theme-reference/attila-mod-style.css
(MIT, Peter Amende; see ATTILA-LICENSE beside it) and writes an edited copy:

- the colour variables are mapped onto the Terminus Foundry tokens (tokens.css), dark by default,
  light under html[data-theme="light"]; the old .theme-dark/.theme-light classes go, and the
  prefers-color-scheme blocks become html:not([data-theme="light"]) rules so the toggle rules them;
- Libre Baskerville (Google Fonts) and Fira Sans are removed; both font roles become Poppins,
  self-hosted from ../fonts/ (brand-terminus-foundry 1.1.1: Poppins for headings and body);
- the icon font keeps only woff2/woff from ../fonts/;
- rules for features that are not carried over are dropped: search, share buttons, comments,
  subscribe and members Portal buttons;
- brand additions are appended (fonts, with font-display: optional to match the preloads in guide.njk, so text never swaps; accent marks, logo swap, archive notice, dates, covers).

Usage: python3 tools/theme/derive-guide-css.py
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "src/assets/theme-reference/attila-mod-style.css"
OUT = ROOT / "src/assets/css/guide.css"

DROP_WORDS = ("search", "share", "comments", "subscribe", "nac-account", "disqus")
DARK = 'html:not([data-theme="light"])'
LIGHT = 'html[data-theme="light"]'


def parse(css):
    """Split minified CSS into nodes: (rule, selector, body), (at, prelude, children), (raw, text), (comment, text)."""
    i, n, nodes = 0, len(css), []
    while i < n:
        if css.startswith("/*", i):
            j = css.index("*/", i) + 2
            nodes.append(("comment", css[i:j]))
            i = j
            continue
        if css[i] in " \n\t\r":
            i += 1
            continue
        j = css.index("{", i)
        sel = css[i:j].strip()
        if sel.startswith(("@media", "@supports", "@keyframes", "@-webkit-keyframes")):
            depth, k = 1, j + 1
            while depth:
                if css[k] == "{":
                    depth += 1
                elif css[k] == "}":
                    depth -= 1
                k += 1
            inner = css[j + 1:k - 1]
            if "keyframes" in sel:
                nodes.append(("raw", sel + "{" + inner + "}"))
            else:
                nodes.append(("at", sel, parse(inner)))
            i = k
        else:
            k = css.index("}", j)
            nodes.append(("rule", sel, css[j + 1:k]))
            i = k + 1
    return nodes


COLOR_MAP = (
    "--color-background-main:var(--tf-bg);"
    "--color-background-secondary:var(--tf-panel-flat);"
    "--color-background-contrast:var(--tf-gridline);"
    "--color-background-overlay:rgba(0,0,0,0.9);"
    "--color-content-lead:var(--tf-text);"
    "--color-content-main:var(--tf-text);"
    "--color-content-secondary:var(--tf-text-muted-flat);"
    "--color-content-main-dark:#E1E3E6;"
    "--ghost-accent-color:var(--tf-accent-mark)"
)
FONT_MAP = "--font-primary:var(--tf-font-heading);--font-secondary:var(--tf-font-body)"
ICON_FACE = (
    'font-family:icon;src:url("../fonts/icon.woff2") format("woff2"),'
    'url("../fonts/icon.woff") format("woff");font-weight:normal;font-style:normal;font-display:block'
)


def keep_selector(sel):
    return not any(w in sel for w in DROP_WORDS)


def transform(nodes):
    out = []
    for node in nodes:
        kind = node[0]
        if kind in ("comment", "raw"):
            out.append(node)
            continue
        if kind == "at":
            children = transform(node[2])
            if not children:
                continue
            if "prefers-color-scheme: dark" in node[1]:
                for child in children:
                    if child[0] == "rule":
                        sel = ",".join(DARK + " " + s.strip() for s in child[1].split(","))
                        out.append(("rule", sel, child[2]))
                continue
            out.append(("at", node[1], children))
            continue
        sel, body = node[1], node[2]
        if sel == "@font-face":
            if "Libre Baskerville" in body or "Fira Sans" in body:
                continue
            if "/icon." in body:
                body = ICON_FACE
            out.append(("rule", sel, body))
            continue
        if sel == ".theme-dark:root" or sel.startswith("html:not(.theme-light):root"):
            continue
        if sel == ":root" and body.strip().startswith("--color-background-main"):
            body = COLOR_MAP
        elif sel == ":root" and body.strip().startswith("--font-primary"):
            body = FONT_MAP
        parts = [s.strip() for s in sel.split(",")]
        kept = [s for s in parts if keep_selector(s)]
        if not kept:
            continue
        out.append(("rule", ",".join(kept), body))
    return out


def serialise(nodes):
    chunks = []
    for node in nodes:
        if node[0] in ("comment", "raw"):
            chunks.append(node[1])
        elif node[0] == "at":
            chunks.append(node[1] + "{" + serialise(node[2]) + "}")
        else:
            chunks.append(node[1] + "{" + node[2] + "}")
    return "\n".join(chunks)


ADDITIONS = """
/* ---- Terminus Foundry additions (brand-terminus-foundry 1.1.1, 2026-10-24) ---- */
@font-face{font-family:Poppins;font-style:normal;font-weight:400;font-display:optional;src:url("../fonts/Poppins-Regular.woff2") format("woff2")}
@font-face{font-family:Poppins;font-style:normal;font-weight:500;font-display:optional;src:url("../fonts/Poppins-Medium.woff2") format("woff2")}
@font-face{font-family:Poppins;font-style:normal;font-weight:600;font-display:optional;src:url("../fonts/Poppins-SemiBold.woff2") format("woff2")}
:root{--tf-accent-mark:var(--tf-alert-red)}
:root[data-theme="light"]{--tf-accent-mark:var(--tf-medium-blue)}
html{background:var(--tf-bg)}
h1,h2,h3,h4,h5,h6,.post-title,.blog-name,.archive-title,.post-nav-title{font-weight:600}
.post-content a{box-shadow:inset 0 -2px 0 var(--tf-link)}
.post-content a:focus,.post-content a:hover{box-shadow:inset 0 -3px 0 var(--tf-link)}
.post-content blockquote{border-left-color:var(--tf-rule-flat)}
.post-content iframe{max-width:100%}
.post-content iframe[src*="youtube.com"]{width:100%;height:auto;aspect-ratio:16/9}
@media only screen and (max-width: 640px){.nav-header li a{white-space:normal}}
.post-content picture{display:block}
.cover picture{display:block;width:100%;height:100%}
.nav-header .logo a img{height:4rem;width:auto}
.nav-header .logo a img.nav-logo-light{display:none}
html[data-theme="light"] .nav-header .logo a img.nav-logo-dark{display:none}
html[data-theme="light"] .nav-header .logo a img.nav-logo-light{display:block}
html[data-theme="light"].cover-active .nav-header .logo a img.nav-logo-dark{display:block}
html[data-theme="light"].cover-active .nav-header .logo a img.nav-logo-light{display:none}
.post-meta-dates{display:block}
.archive-notice{position:relative;z-index:30;background:var(--tf-panel-flat);border-bottom:1px solid var(--tf-gridline);font-size:1.5em;line-height:1.6;color:var(--tf-text)}
.archive-notice .inner{padding-top:1rem;padding-bottom:1rem}
.home-template .archive-notice{position:absolute;top:0;left:0;width:100%;z-index:401;background:rgba(0,0,0,0.75);color:#fff;border-bottom:0}
.home-template .archive-notice .inner{padding-top:0.5rem;padding-bottom:0.5rem;padding-right:12rem}
@media only screen and (max-width: 640px){.home-template .archive-notice{position:relative;background:var(--tf-panel-flat);color:var(--tf-text)}.home-template .archive-notice .inner{padding-right:4rem}}
.guide-intro .post-content{padding-top:calc(4rem + 2vw);padding-bottom:calc(2rem + 1vw);border-bottom:1px solid var(--color-background-contrast)}
.theme-text{font-weight:500}
"""


def main():
    css = SRC.read_text(encoding="utf-8")
    nodes = transform(parse(css))
    header = (
        "/* guide.css: derived from attila-mod style.css (MIT, Peter Amende; see ../theme-reference/ATTILA-LICENSE) by "
        "tools/theme/derive-guide-css.py. Do not edit by hand: change the script and run it. */\n"
    )
    body = serialise(nodes)
    body = body.replace(".theme-dark ", DARK + " ").replace(".theme-light ", LIGHT + " ")
    OUT.write_text(header + body + ADDITIONS, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(body) + len(ADDITIONS)} bytes, {len(nodes)} top-level nodes")


if __name__ == "__main__":
    main()
