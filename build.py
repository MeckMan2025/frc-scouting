#!/usr/bin/env python3
"""Inline src/lib/*.js into src/index.html -> FRC-Scouting.html (one file, works offline)."""
import pathlib, re
root = pathlib.Path(__file__).parent
html = (root / "src/index.html").read_text()
def inline(m):
    js = (root / "src" / m.group(1)).read_text().replace("</script", "<\\/script")
    return f"<script>/* {m.group(1)} */\n{js}\n</script>"
out = re.sub(r'<script src="([^"]+)"></script>', inline, html)
(root / "FRC-Scouting.html").write_text(out)
print(f"Built FRC-Scouting.html ({len(out)//1024} KB)")

# The service worker's cache is named after the built files, so a new build
# is a new cache: devices pick it up next time they have internet, and keep
# the old copy working until then.
import hashlib
stamp = hashlib.sha256((out + (root / "index.html").read_text() + (root / "manifest.webmanifest").read_text()).encode()).hexdigest()[:12]
sw = (root / "src/sw.js").read_text().replace("__VERSION__", stamp)
(root / "sw.js").write_text(sw)
print(f"Built sw.js (version {stamp})")
