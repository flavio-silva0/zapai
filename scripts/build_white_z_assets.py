import os
from PIL import Image
from collections import deque
import subprocess
import shutil

PROJECT_DIR = r"c:\Users\FlavioJuniorCarvalho\Documents\Pessoal\ZapAI"
PUBLIC_DIR = os.path.join(PROJECT_DIR, "frontend", "public")
ARTIFACT_DIR = r"C:\Users\FlavioJuniorCarvalho\.gemini\antigravity\brain\a772fc6f-7ffb-480f-b486-e463e9bb9a98"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

src_path = os.path.join(ARTIFACT_DIR, "zapai_blue_opt2_1789410235278.jpg")
img = Image.open(src_path).convert("RGB")

# 1. Isolate the icon with SOLID WHITE Z and TRANSPARENT EXTERIOR
crop_box = (290, 200, 730, 640)
icon = img.crop(crop_box)
iw, ih = icon.size

bg = icon.getpixel((0, 0))

# Flood fill to find exterior background
visited = set()
queue = deque([(0, 0), (iw-1, 0), (0, ih-1), (iw-1, ih-1)])
for pt in queue:
    visited.add(pt)

while queue:
    x, y = queue.popleft()
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < iw and 0 <= ny < ih and (nx, ny) not in visited:
            p = icon.getpixel((nx, ny))
            diff = max(abs(p[i] - bg[i]) for i in range(3))
            if diff < 28:
                visited.add((nx, ny))
                queue.append((nx, ny))

out_img = Image.new("RGBA", (iw, ih))
for y in range(ih):
    for x in range(iw):
        if (x, y) in visited:
            out_img.putpixel((x, y), (0, 0, 0, 0))
        else:
            p = icon.getpixel((x, y))
            # If it's part of the Z (light/off-white color, e.g. all channels > 215)
            if min(p) > 215:
                # Force pure solid white!
                out_img.putpixel((x, y), (255, 255, 255, 255))
            else:
                out_img.putpixel((x, y), (p[0], p[1], p[2], 255))

# Smooth antialiasing on the outer boundary
# For any pixel adjacent to visited, apply slight alpha if close to bg
for (x, y) in list(visited):
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < iw and 0 <= ny < ih and (nx, ny) not in visited:
            p = icon.getpixel((nx, ny))
            diff = max(abs(p[i] - bg[i]) for i in range(3))
            if diff < 55:
                alpha = int(((diff - 20) / 35) * 255)
                alpha = max(120, min(255, alpha))
                curr = out_img.getpixel((nx, ny))
                out_img.putpixel((nx, ny), (curr[0], curr[1], curr[2], alpha))

bbox = out_img.getbbox()
cropped = out_img.crop(bbox)

# Create perfectly square 512x512 icon
max_d = max(cropped.width, cropped.height)
pad = int(max_d * 0.08)
sq = Image.new("RGBA", (max_d + pad*2, max_d + pad*2), (0, 0, 0, 0))
sq.paste(cropped, (pad + (max_d - cropped.width)//2, pad + (max_d - cropped.height)//2))

icon_512 = sq.resize((512, 512), Image.Resampling.LANCZOS)
icon_512.save(os.path.join(PUBLIC_DIR, "zapai-symbol.png"), "PNG")

icon_1024 = sq.resize((1024, 1024), Image.Resampling.LANCZOS)
icon_1024.save(os.path.join(PUBLIC_DIR, "zapai-symbol-large.png"), "PNG")
icon_1024.save(os.path.join(PUBLIC_DIR, "zapai-logo-transparent.png"), "PNG")
icon_1024.save(os.path.join(PUBLIC_DIR, "logo_icon.png"), "PNG")
icon_1024.save(os.path.join(PUBLIC_DIR, "logo_icon_dark.png"), "PNG")
icon_1024.save(os.path.join(PUBLIC_DIR, "logo_icon_trans.png"), "PNG")

# Mobile Apple Touch Icon
icon_180 = sq.resize((180, 180), Image.Resampling.LANCZOS)
icon_180.save(os.path.join(PUBLIC_DIR, "apple-touch-icon.png"), "PNG")

# Favicons for browser tab (SOLID WHITE Z, ULTRA SHARP)
icon_64 = sq.resize((64, 64), Image.Resampling.LANCZOS)
icon_64.save(os.path.join(PUBLIC_DIR, "zapai-favicon.png"), "PNG")
icon_512.save(os.path.join(PUBLIC_DIR, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

print("Pure symbol with solid white Z generated successfully.")

# 2. Render horizontal logos (zapai-logo-dark.png & zapai-logo-light.png)
# Identical lockup to photo 4: Símbolo + ZapAI
html_light_bg = """<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      display: flex;
      align-items: center;
      width: 480px;
      height: 120px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .box {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 4px;
    }
    .icon {
      width: 86px;
      height: 86px;
      object-fit: contain;
    }
    .name {
      font-size: 60px;
      font-weight: 800;
      letter-spacing: -2px;
      line-height: 1;
      display: flex;
      align-items: center;
    }
    .zap {
      color: #0F172A;
    }
    .ai {
      color: #2563EB;
      margin-left: 1px;
    }
  </style>
</head>
<body>
  <div class="box">
    <img class="icon" src="zapai-symbol.png" />
    <div class="name">
      <span class="zap">Zap</span><span class="ai">AI</span>
    </div>
  </div>
</body>
</html>"""

html_dark_bg = """<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      display: flex;
      align-items: center;
      width: 480px;
      height: 120px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .box {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 4px;
    }
    .icon {
      width: 86px;
      height: 86px;
      object-fit: contain;
      filter: drop-shadow(0 2px 10px rgba(37, 99, 235, 0.45));
    }
    .name {
      font-size: 60px;
      font-weight: 800;
      letter-spacing: -2px;
      line-height: 1;
      display: flex;
      align-items: center;
    }
    .zap {
      color: #FFFFFF;
    }
    .ai {
      color: #38BDF8;
      margin-left: 1px;
    }
  </style>
</head>
<body>
  <div class="box">
    <img class="icon" src="zapai-symbol.png" />
    <div class="name">
      <span class="zap">Zap</span><span class="ai">AI</span>
    </div>
  </div>
</body>
</html>"""

tmp_l = os.path.join(PUBLIC_DIR, "_tmp_l.html")
tmp_d = os.path.join(PUBLIC_DIR, "_tmp_d.html")

with open(tmp_l, "w", encoding="utf-8") as f:
    f.write(html_light_bg)
with open(tmp_d, "w", encoding="utf-8") as f:
    f.write(html_dark_bg)

out_dark = os.path.join(PUBLIC_DIR, "zapai-logo-dark.png")
out_light = os.path.join(PUBLIC_DIR, "zapai-logo-light.png")

cmd1 = [EDGE_PATH, "--headless", "--disable-gpu", "--default-background-color=00000000", f"--screenshot={out_dark}", "--window-size=480,120", f"file:///{tmp_l.replace(os.sep, '/')}"]
subprocess.run(cmd1, check=True)

cmd2 = [EDGE_PATH, "--headless", "--disable-gpu", "--default-background-color=00000000", f"--screenshot={out_light}", "--window-size=480,120", f"file:///{tmp_d.replace(os.sep, '/')}"]
subprocess.run(cmd2, check=True)

if os.path.exists(tmp_l): os.remove(tmp_l)
if os.path.exists(tmp_d): os.remove(tmp_d)

# Tight crop the horizontal logos
for p in [out_dark, out_light]:
    im = Image.open(p)
    bb = im.getbbox()
    if bb:
        pad_x, pad_y = 6, 4
        crop_box = (max(0, bb[0]-pad_x), max(0, bb[1]-pad_y), min(im.width, bb[2]+pad_x), min(im.height, bb[3]+pad_y))
        cropped = im.crop(crop_box)
        cropped.save(p)

shutil.copy2(out_dark, os.path.join(PUBLIC_DIR, "logo.png"))
shutil.copy2(out_dark, os.path.join(PUBLIC_DIR, "zapai-logo-header.png"))
shutil.copy2(out_dark, os.path.join(PUBLIC_DIR, "logo_full.png"))
shutil.copy2(out_light, os.path.join(PUBLIC_DIR, "logo_full_dark.png"))
shutil.copy2(out_dark, os.path.join(PUBLIC_DIR, "logo_full_trans.png"))

print("All horizontal logos successfully built and cropped!")
