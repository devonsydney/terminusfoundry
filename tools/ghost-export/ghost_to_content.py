"""Convert a Ghost 4 content export into Eleventy-ready HTML files with YAML front matter.

Usage: python -I -X utf8 ghost_to_content.py <content.json> <site-key> <out-dir>

Reads only posts, tags, posts_tags and the public settings. The users block is never read,
so the password hash in the export cannot reach the output. Image paths are rewritten from
__GHOST_URL__/content/images/... and /content/images/... to /images/<site>/... so the build
can serve the originals from the backups.
"""
import json, os, re, sys, collections

src, site, out = sys.argv[1], sys.argv[2], sys.argv[3]
doc = json.load(open(src, encoding="utf-8"))
db = doc["db"][0]["data"]
meta = doc["db"][0].get("meta") or doc.get("meta") or {}
posts = db["posts"]
tags = {t["id"]: t for t in db["tags"]}
post_tags = collections.defaultdict(list)
for pt in sorted(db["posts_tags"], key=lambda x: x.get("sort_order", 0)):
    post_tags[pt["post_id"]].append(tags[pt["tag_id"]]["slug"])
settings = {s["key"]: s["value"] for s in db["settings"] if s["key"] in (
    "title", "description", "accent_color", "navigation", "secondary_navigation",
    "cover_image", "icon", "logo", "meta_title", "meta_description", "timezone", "lang")}

def rewrite(s):
    if not s:
        return s
    s = s.replace("__GHOST_URL__/content/images/", "/images/%s/" % site)
    s = re.sub(r'(["(])/content/images/', r'\1/images/%s/' % site, s)
    s = s.replace("__GHOST_URL__", "")
    s = s.replace("https://%s.terminusfoundry.com" % site, "")
    return s

def yq(v):
    """Quote a scalar for YAML front matter."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    return json.dumps(str(v), ensure_ascii=False)

os.makedirs(os.path.join(out, "posts"), exist_ok=True)
os.makedirs(os.path.join(out, "pages"), exist_ok=True)
index = []
for p in posts:
    if p.get("status") != "published":
        index.append((p.get("type"), p.get("slug"), p.get("status"), "SKIPPED (not published)"))
        continue
    kind = "pages" if p.get("type") == "page" else "posts"
    fm = collections.OrderedDict()
    fm["title"] = p["title"]
    fm["slug"] = p["slug"]
    fm["layout"] = "page" if kind == "pages" else "post"
    fm["site"] = site
    fm["date"] = (p.get("published_at") or p.get("created_at") or "")[:10]
    fm["updated"] = (p.get("updated_at") or "")[:10]
    fm["ghost_published_at"] = p.get("published_at")
    fm["ghost_updated_at"] = p.get("updated_at")
    fm["excerpt"] = p.get("custom_excerpt")
    fm["feature_image"] = rewrite(p.get("feature_image"))
    fm["meta_title"] = p.get("meta_title")
    fm["meta_description"] = p.get("meta_description")
    fm["og_image"] = rewrite(p.get("og_image"))
    fm["twitter_image"] = rewrite(p.get("twitter_image"))
    fm["featured"] = bool(p.get("featured"))
    fm["visibility"] = p.get("visibility")
    fm["tags"] = post_tags.get(p["id"], [])
    fm["codeinjection_head"] = p.get("codeinjection_head")
    fm["codeinjection_foot"] = p.get("codeinjection_foot")
    fm["custom_template"] = p.get("custom_template")
    fm["ghost_uuid"] = p.get("uuid")
    lines = ["---"]
    for k, v in fm.items():
        if v in (None, "", []):
            continue
        if isinstance(v, list):
            lines.append("%s: [%s]" % (k, ", ".join(yq(x) for x in v)))
        else:
            lines.append("%s: %s" % (k, yq(v)))
    lines.append("---")
    body = rewrite(p.get("html") or "")
    path = os.path.join(out, kind, p["slug"] + ".html")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n" + body + "\n")
    imgs = re.findall(r'src="([^"]+)"', body)
    index.append((p.get("type"), p["slug"], p.get("status"), "%s words, %d img, %d iframe, tags %s" % (
        len(re.sub(r"<[^>]+>", " ", body).split()), len(imgs), body.count("<iframe"), ",".join(fm["tags"]))))

with open(os.path.join(out, "site.json"), "w", encoding="utf-8") as f:
    nav = settings.get("navigation")
    json.dump({"site": site,
               "title": settings.get("title"), "description": settings.get("description"),
               "accent_color": settings.get("accent_color"),
               "navigation": json.loads(nav) if nav else None,
               "secondary_navigation": json.loads(settings["secondary_navigation"]) if settings.get("secondary_navigation") else None,
               "cover_image": rewrite(settings.get("cover_image")), "icon": rewrite(settings.get("icon")),
               "logo": rewrite(settings.get("logo")), "meta_title": settings.get("meta_title"),
               "meta_description": settings.get("meta_description"), "timezone": settings.get("timezone"),
               "lang": settings.get("lang"),
               "tags": [{"slug": t["slug"], "name": t["name"], "description": t.get("description"),
                         "visibility": t.get("visibility")} for t in db["tags"]],
               "export_version": meta.get("version"), "exported_on": meta.get("exported_on")},
              f, indent=1, ensure_ascii=False)

all_imgs = set()
for root, _, files in os.walk(out):
    for fn in files:
        if fn.endswith(".html"):
            t = open(os.path.join(root, fn), encoding="utf-8").read()
            all_imgs.update(re.findall(r'(?:src|feature_image|og_image|twitter_image)[=:] ?"?([^"\s]+)', t))
with open(os.path.join(out, "images-referenced.txt"), "w", encoding="utf-8") as f:
    for u in sorted(all_imgs):
        f.write(u + "\n")
for row in index:
    print("%-5s %-28s %-9s %s" % row)
print("local images referenced:", len([u for u in all_imgs if u.startswith("/images/")]),
      "| external:", len([u for u in all_imgs if u.startswith("http")]))
