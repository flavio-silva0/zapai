import os
import subprocess
from PIL import Image

pub = r"c:\Users\FlavioJuniorCarvalho\Documents\Pessoal\ZapAI\frontend\public"
edge = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# 1. Tight crop zapai-logo-lp.png
lp_path = os.path.join(pub, "zapai-logo-lp.png")
if os.path.exists(lp_path):
    im = Image.open(lp_path)
    bb = im.getbbox()
    if bb:
        pad_x, pad_y = 6, 4
        crop_box = (max(0, bb[0]-pad_x), max(0, bb[1]-pad_y), min(im.width, bb[2]+pad_x), min(im.height, bb[3]+pad_y))
        im.crop(crop_box).save(lp_path)
        print("Tight cropped zapai-logo-lp.png:", Image.open(lp_path).size)

# 2. Render zapai-logo-lp-light.png (for dark background / footer)
html_dark = """<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background: transparent; display: flex; align-items: center; width: 480px; height: 120px; font-family: 'Plus Jakarta Sans', sans-serif; }
    .box { display: flex; align-items: center; gap: 16px; padding: 4px; }
    .icon { width: 86px; height: 86px; object-fit: contain; filter: drop-shadow(0 2px 10px rgba(13, 148, 136, 0.45)); }
    .name { font-size: 60px; font-weight: 800; letter-spacing: -2px; line-height: 1; display: flex; align-items: center; }
    .zap { color: #FFFFFF; }
    .ai { color: #2DD4BF; margin-left: 1px; }
  </style>
</head>
<body>
  <div class="box">
    <img class="icon" src="zapai-symbol-green.png" />
    <div class="name"><span class="zap">Zap</span><span class="ai">AI</span></div>
  </div>
</body>
</html>"""

tmp_html = os.path.join(pub, "_tmp_lp_dark.html")
out_dark = os.path.join(pub, "zapai-logo-lp-light.png")
with open(tmp_html, "w", encoding="utf-8") as f:
    f.write(html_dark)

cmd = [edge, "--headless", "--disable-gpu", "--default-background-color=00000000", f"--screenshot={out_dark}", "--window-size=480,120", f"file:///{tmp_html.replace(os.sep, '/')}"]
subprocess.run(cmd, check=True)
if os.path.exists(tmp_html):
    os.remove(tmp_html)

im_d = Image.open(out_dark)
bb_d = im_d.getbbox()
if bb_d:
    crop_box_d = (max(0, bb_d[0]-6), max(0, bb_d[1]-4), min(im_d.width, bb_d[2]+6), min(im_d.height, bb_d[3]+4))
    im_d.crop(crop_box_d).save(out_dark)
    print("Tight cropped zapai-logo-lp-light.png:", Image.open(out_dark).size)

print("Done processing LP green logos!")
