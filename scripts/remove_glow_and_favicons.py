import os
from PIL import Image
import subprocess
import shutil

pub = r"c:\Users\FlavioJuniorCarvalho\Documents\Pessoal\ZapAI\frontend\public"
edge = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# 1. Generate zapai-favicon-green.png from zapai-symbol-green.png
green_sym_path = os.path.join(pub, "zapai-symbol-green.png")
if os.path.exists(green_sym_path):
    im_green = Image.open(green_sym_path)
    fav_green = im_green.resize((64, 64), Image.Resampling.LANCZOS)
    fav_green.save(os.path.join(pub, "zapai-favicon-green.png"), "PNG")
    print("Saved zapai-favicon-green.png (64x64)")

# 2. Re-render zapai-logo-light.png (BLUE version for dark backgrounds) WITHOUT ANY GLOW / DROP-SHADOW
html_blue_no_glow = """<!DOCTYPE html>
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
      /* ZERO GLOW, ZERO DROP-SHADOW */
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

tmp_html = os.path.join(pub, "_tmp_noglow.html")
out_light = os.path.join(pub, "zapai-logo-light.png")

with open(tmp_html, "w", encoding="utf-8") as f:
    f.write(html_blue_no_glow)

cmd = [edge, "--headless", "--disable-gpu", "--default-background-color=00000000", f"--screenshot={out_light}", "--window-size=480,120", f"file:///{tmp_html.replace(os.sep, '/')}"]
subprocess.run(cmd, check=True)
if os.path.exists(tmp_html):
    os.remove(tmp_html)

im = Image.open(out_light)
bb = im.getbbox()
if bb:
    crop_box = (max(0, bb[0]-6), max(0, bb[1]-4), min(im.width, bb[2]+6), min(im.height, bb[3]+4))
    im.crop(crop_box).save(out_light)
    print("Saved zapai-logo-light.png without glow:", Image.open(out_light).size)

# Also update logo_full_dark.png alias
shutil.copy2(out_light, os.path.join(pub, "logo_full_dark.png"))

# 3. Re-render zapai-logo-lp-light.png (GREEN version for dark backgrounds) WITHOUT ANY GLOW
html_green_no_glow = """<!DOCTYPE html>
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
      /* ZERO GLOW */
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

tmp_html_green = os.path.join(pub, "_tmp_green_noglow.html")
out_lp_light = os.path.join(pub, "zapai-logo-lp-light.png")

with open(tmp_html_green, "w", encoding="utf-8") as f:
    f.write(html_green_no_glow)

cmd = [edge, "--headless", "--disable-gpu", "--default-background-color=00000000", f"--screenshot={out_lp_light}", "--window-size=480,120", f"file:///{tmp_html_green.replace(os.sep, '/')}"]
subprocess.run(cmd, check=True)
if os.path.exists(tmp_html_green):
    os.remove(tmp_html_green)

im_g = Image.open(out_lp_light)
bb_g = im_g.getbbox()
if bb_g:
    crop_box_g = (max(0, bb_g[0]-6), max(0, bb_g[1]-4), min(im_g.width, bb_g[2]+6), min(im_g.height, bb_g[3]+4))
    im_g.crop(crop_box_g).save(out_lp_light)
    print("Saved zapai-logo-lp-light.png without glow:", Image.open(out_lp_light).size)

print("Finished regenerating logos without glow!")
