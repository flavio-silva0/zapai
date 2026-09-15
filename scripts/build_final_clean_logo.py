import os
from PIL import Image
import subprocess
import shutil

PROJECT_DIR = r"c:\Users\FlavioJuniorCarvalho\Documents\Pessoal\ZapAI"
PUBLIC_DIR = os.path.join(PROJECT_DIR, "frontend", "public")
ARTIFACT_DIR = r"C:\Users\FlavioJuniorCarvalho\.gemini\antigravity\brain\a772fc6f-7ffb-480f-b486-e463e9bb9a98"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# 1. Clean up garbage in public
for f in ["_temp_dark.html", "_temp_light.html", "render_dark_logo.html", "render_light_logo.html"]:
    p = os.path.join(PUBLIC_DIR, f)
    if os.path.exists(p):
        os.remove(p)

src_image_path = os.path.join(ARTIFACT_DIR, "zapai_blue_opt2_1789410235278.jpg")
img = Image.open(src_image_path).convert("RGBA")
bg_sample = img.getpixel((10, 10))[:3]
print(f"Background sample: {bg_sample}")

# CROP THE PURE ICON: strictly rows 205 to 635 (above row 677 where text begins!)
# X from 300 to 725
icon_raw = img.crop((300, 205, 725, 635))
w, h = icon_raw.size

datas = icon_raw.getdata()
new_datas = []
for item in datas:
    r, g, b, a = item
    diff = max(abs(r - bg_sample[0]), abs(g - bg_sample[1]), abs(b - bg_sample[2]))
    if diff < 16:
        new_datas.append((255, 255, 255, 0))
    elif diff < 38:
        alpha = int(((diff - 16) / 22) * 255)
        new_datas.append((r, g, b, alpha))
    else:
        new_datas.append((r, g, b, 255))

icon_trans = Image.new("RGBA", (w, h))
icon_trans.putdata(new_datas)

# Get precise bounding box
bbox = icon_trans.getbbox()
print(f"Clean Icon Bounding Box: {bbox}")
cropped_icon = icon_trans.crop(bbox)

# Create 512x512 transparent canvas with balanced margins
max_dim = max(cropped_icon.width, cropped_icon.height)
pad = int(max_dim * 0.08)
sq_dim = max_dim + pad * 2
canvas = Image.new("RGBA", (sq_dim, sq_dim), (0, 0, 0, 0))
pos_x = pad + (max_dim - cropped_icon.width) // 2
pos_y = pad + (max_dim - cropped_icon.height) // 2
canvas.paste(cropped_icon, (pos_x, pos_y), cropped_icon)

# 2. Save master icon files (100% PURE SYMBOL, NO TEXT)
icon_512 = canvas.resize((512, 512), Image.Resampling.LANCZOS)
icon_512.save(os.path.join(PUBLIC_DIR, "zapai-symbol.png"), "PNG")
print("Saved clean zapai-symbol.png")

icon_1024 = canvas.resize((1024, 1024), Image.Resampling.LANCZOS)
icon_1024.save(os.path.join(PUBLIC_DIR, "zapai-symbol-large.png"), "PNG")
icon_1024.save(os.path.join(PUBLIC_DIR, "zapai-logo-transparent.png"), "PNG")
icon_1024.save(os.path.join(PUBLIC_DIR, "logo_icon.png"), "PNG")
icon_1024.save(os.path.join(PUBLIC_DIR, "logo_icon_dark.png"), "PNG")
icon_1024.save(os.path.join(PUBLIC_DIR, "logo_icon_trans.png"), "PNG")

# App icons & Favicons
icon_180 = canvas.resize((180, 180), Image.Resampling.LANCZOS)
icon_180.save(os.path.join(PUBLIC_DIR, "apple-touch-icon.png"), "PNG")

icon_64 = canvas.resize((64, 64), Image.Resampling.LANCZOS)
icon_64.save(os.path.join(PUBLIC_DIR, "zapai-favicon.png"), "PNG")

icon_512.save(os.path.join(PUBLIC_DIR, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print("Saved all clean icons and favicons.")

# 3. Render Horizontal Logos with Edge Headless
# Símbolo + texto ZapAI
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
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .wrapper {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-left: 10px;
    }
    .icon {
      width: 86px;
      height: 86px;
      object-fit: contain;
    }
    .brand-name {
      font-size: 58px;
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
      margin-left: 2px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <img class="icon" src="zapai-symbol.png" />
    <div class="brand-name">
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
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .wrapper {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-left: 10px;
    }
    .icon {
      width: 86px;
      height: 86px;
      object-fit: contain;
      filter: drop-shadow(0 4px 16px rgba(37, 99, 235, 0.4));
    }
    .brand-name {
      font-size: 58px;
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
      margin-left: 2px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <img class="icon" src="zapai-symbol.png" />
    <div class="brand-name">
      <span class="zap">Zap</span><span class="ai">AI</span>
    </div>
  </div>
</body>
</html>"""

tmp_light_html = os.path.join(PUBLIC_DIR, "_render_light.html")
tmp_dark_html = os.path.join(PUBLIC_DIR, "_render_dark.html")

with open(tmp_light_html, "w", encoding="utf-8") as f:
    f.write(html_light_bg)

with open(tmp_dark_html, "w", encoding="utf-8") as f:
    f.write(html_dark_bg)

out_dark_logo = os.path.join(PUBLIC_DIR, "zapai-logo-dark.png")
out_light_logo = os.path.join(PUBLIC_DIR, "zapai-logo-light.png")

cmd1 = [
    EDGE_PATH,
    "--headless",
    "--disable-gpu",
    "--default-background-color=00000000",
    f"--screenshot={out_dark_logo}",
    "--window-size=480,120",
    f"file:///{tmp_light_html.replace(os.sep, '/')}"
]
subprocess.run(cmd1, check=True)
print("Rendered zapai-logo-dark.png (for light themes)")

cmd2 = [
    EDGE_PATH,
    "--headless",
    "--disable-gpu",
    "--default-background-color=00000000",
    f"--screenshot={out_light_logo}",
    "--window-size=480,120",
    f"file:///{tmp_dark_html.replace(os.sep, '/')}"
]
subprocess.run(cmd2, check=True)
print("Rendered zapai-logo-light.png (for dark themes)")

# Cleanup
if os.path.exists(tmp_light_html):
    os.remove(tmp_light_html)
if os.path.exists(tmp_dark_html):
    os.remove(tmp_dark_html)

# Aliases
shutil.copy2(out_dark_logo, os.path.join(PUBLIC_DIR, "logo.png"))
shutil.copy2(out_dark_logo, os.path.join(PUBLIC_DIR, "zapai-logo-header.png"))
shutil.copy2(out_dark_logo, os.path.join(PUBLIC_DIR, "logo_full.png"))
shutil.copy2(out_light_logo, os.path.join(PUBLIC_DIR, "logo_full_dark.png"))
shutil.copy2(out_dark_logo, os.path.join(PUBLIC_DIR, "logo_full_trans.png"))

print("ALL FILES CLEANLY GENERATED!")
