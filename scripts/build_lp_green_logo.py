import os
from PIL import Image
import colorsys
import subprocess
import shutil

PROJECT_DIR = r"c:\Users\FlavioJuniorCarvalho\Documents\Pessoal\ZapAI"
PUBLIC_DIR = os.path.join(PROJECT_DIR, "frontend", "public")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# 1. Load the pristine blue symbol (which already has solid white Z and clean alpha)
src_symbol_path = os.path.join(PUBLIC_DIR, "zapai-symbol.png")
im = Image.open(src_symbol_path).convert("RGBA")
w, h = im.size

# Shift blue to rich teal-600 (hue ~168 deg, slightly deeper lightness)
green_symbol = Image.new("RGBA", (w, h))
for y in range(h):
    for x in range(w):
        r, g, b, a = im.getpixel((x, y))
        if a == 0:
            green_symbol.putpixel((x, y), (0, 0, 0, 0))
            continue
        h_val, l_val, s_val = colorsys.rgb_to_hls(r/255.0, g/255.0, b/255.0)
        # Keep pure white Z untouched
        if l_val > 0.88 and s_val < 0.15:
            green_symbol.putpixel((x, y), (255, 255, 255, a))
        else:
            orig_deg = h_val * 360.0
            diff = orig_deg - 220.0
            new_deg = 168.0 + diff
            new_h = (new_deg / 360.0) % 1.0
            new_l = min(0.9, l_val * 0.78)
            new_s = min(1.0, s_val * 1.1)
            nr, ng, nb = colorsys.hls_to_rgb(new_h, new_l, new_s)
            green_symbol.putpixel((x, y), (int(nr*255), int(ng*255), int(nb*255), a))

green_symbol_path = os.path.join(PUBLIC_DIR, "zapai-symbol-green.png")
green_symbol.save(green_symbol_path, "PNG")
print("Saved zapai-symbol-green.png")

# 2. Render horizontal logos for LP using Edge Headless with the exact font & shape
# - zapai-logo-lp.png (Light background: Dark Slate 'Zap' + Teal-600 'AI' #0D9488)
# - zapai-logo-lp-light.png (Dark background: White 'Zap' + Mint-400 'AI' #2DD4BF)

html_lp_light = """<!DOCTYPE html>
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
      color: #0D9488;
      margin-left: 1px;
    }
  </style>
</head>
<body>
  <div class="box">
    <img class="icon" src="zapai-symbol-green.png" />
    <div class="name">
      <span class="zap">Zap</span><span class="ai">AI</span>
    </div>
  </div>
</body>
</html>"""

html_lp_dark = """<!DOCTYPE html>
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
      filter: drop-shadow(0 2px 10px rgba(13, 148, 136, 0.45));
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
      color: #2DD4BF;
      margin-left: 1px;
    }
  </style>
</head>
<body>
  <div class="box">
    <img class="icon" src="zapai-symbol-green.png" />
    <div class="name">
      <span class="zap">Zap</span><span class="ai">AI</span>
    </div>
  </div>
</body>
</html>"""

tmp_lp_l = os.path.join(PUBLIC_DIR, "_tmp_lp_l.html")
tmp_lp_d = os.path.join(PUBLIC_DIR, "_tmp_lp_d.html")

with open(tmp_lp_l, "w", encoding="utf-8") as f:
    f.write(html_lp_light)
with open(tmp_lp_d, "w", encoding="utf-8") as f:
    f.write(html_lp_dark)

out_lp_light = os.path.join(PUBLIC_DIR, "zapai-logo-lp.png")
out_lp_dark = os.path.join(PUBLIC_DIR, "zapai-logo-lp-light.png")

cmd1 = [EDGE_PATH, "--headless", "--disable-gpu", "--default-background-color=00000000", f"--screenshot={out_lp_light}", "--window-size=480,120", f"file:///{tmp_lp_l.replace(os.sep, '/')}"]
subprocess.run(cmd1, check=True)

cmd2 = [EDGE_PATH, "--headless", "--disable-gpu", "--default-background-color=00000000", f"--screenshot={out_lp_dark}", "--window-size=480,120", f"file:///{tmp_lp_d.replace(os.sep, '/')}"]
subprocess.run(cmd2, check=True)

if os.path.exists(tmp_lp_l): os.remove(tmp_lp_l)
if os.path.exists(tmp_lp_d): os.remove(tmp_lp_d)

# Tight crop
for p in [out_lp_light, out_lp_dark]:
    im = Image.open(p)
    bb = im.getbbox()
    if bb:
        pad_x, pad_y = 6, 4
        crop_box = (max(0, bb[0]-pad_x), max(0, bb[1]-pad_y), min(im.width, bb[2]+pad_x), min(im.height, bb[3]+pad_y))
        cropped = im.crop(crop_box)
        cropped.save(p)
        print(f"Cropped {os.path.basename(p)}: {cropped.size}")

print("LP green logos successfully built!")
