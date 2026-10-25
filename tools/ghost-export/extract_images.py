"""Copy the images the converted content references out of a Ghost backup zip.

Usage: python -I -X utf8 extract_images.py <backup.zip> <site-key> <content/<site>/images-referenced.txt> <out-dir>

Only original files are copied. A reference to a resized variant (/images/<site>/size/wNNN/...) is
mapped back to its original, because the static build regenerates the sizes it needs. Ghost's
pre-optimisation copies (*_o.*) are never copied. Prints every reference that has no file in the zip.
"""
import os, re, sys, zipfile

zpath, site, reflist, out = sys.argv[1:5]
z = zipfile.ZipFile(zpath)
names = set(z.namelist())
prefix = "/images/%s/" % site
wanted = set()
for line in open(reflist, encoding="utf-8"):
    u = line.strip()
    if not u.startswith(prefix):
        continue
    rel = u[len(prefix):]
    rel = re.sub(r"^size/w\d+/", "", rel)
    wanted.add(rel)
missing, copied, total = [], 0, 0
for rel in sorted(wanted):
    member = "images/" + rel
    if member not in names:
        missing.append(rel)
        continue
    dest = os.path.join(out, rel.replace("/", os.sep))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with z.open(member) as src, open(dest, "wb") as dst:
        data = src.read()
        dst.write(data)
        total += len(data)
    copied += 1
print("%s: %d originals wanted, %d copied (%.1f MB), %d missing" % (site, len(wanted), copied, total / 1e6, len(missing)))
for m in missing:
    print("  missing in backup:", m)
