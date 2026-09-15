import os
from PIL import Image, ImageFilter
import subprocess
import shutil

PROJECT_DIR = r"c:\Users\FlavioJuniorCarvalho\Documents\Pessoal\ZapAI"
PUBLIC_DIR = os.path.join(PROJECT_DIR, "frontend", "public")
ARTIFACT_DIR = r"C:\Users\FlavioJuniorCarvalho\.gemini\antigravity\brain\a772fc6f-7ffb-480f-b486-e463e9bb9a98"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

src_image_path = os.path.join(ARTIFACT_DIR, "zapai_blue_opt2_1789410235278.jpg")
print(f"Loading chosen logo from: {src_image_path}")

img = Image.open(src_image_path).convert("RGBA")
w, h = img.size

# 1. Background removal and isolate the symbol
# Get background color from corners
bg_sample = img.getpixel((10, 10))[:3]
print(f"Background sample: {bg_sample}")

# We isolate the upper 72% of the image which contains the iconic speech bubble mark
icon_crop = img.crop((0, 0, w, int(h * 0.72)))
cw, ch = icon_crop.size

datas = icon_crop.getdata()
new_datas = []
for item in datas:
    r, g, b, a = item
    diff = max(abs(r - bg_sample[0]), abs(g - bg_sample[1]), abs(b - bg_sample[2]))
    if diff < 14:
        new_datas.append((255, 255, 255, 0))
    elif diff < 38:
        alpha = int(((diff - 14) / 24) * 255)
        new_datas.append((r, g, b, alpha))
    else:
        new_datas.append((r, g, b, 255))

icon_trans = Image.new("RGBA", (cw, ch))
icon_trans.putdata(new_datas)

# Get precise bounding box of the isolated icon
bbox = icon_trans.getbbox()
print(f"Icon Bounding Box: {bbox}")
cropped_icon = icon_trans.crop(bbox)

# Create perfectly square centered container with 8% padding
max_dim = max(cropped_icon.width, cropped_icon.height)
pad = int(max_dim * 0.08)
sq_dim = max_dim + pad * 2
centered_icon = Image.new("RGBA", (sq_dim, sq_dim), (0, 0, 0, 0))
pos_x = pad + (max_dim - cropped_icon.width) // 2
pos_y = pad + (max_dim - cropped_icon.height) // 2
centered_icon.paste(cropped_icon, (pos_x, pos_y), cropped_icon)

# 2. Save master icon files
# 512x512 Master Symbol
icon_512 = centered_icon.resize((512, 512), Image.Resampling.LANCZOS)
icon_512.save(os.path.join(PUBLIC_DIR, "zapai-symbol.png"), "PNG")

# 1024x1024 High-Res Symbol
icon_1024 = centered_icon.resize((1024, 1024), Image.Resampling.LANCZOS)
icon_1024.save(os.path.join(PUBLIC_DIR, "zapai-symbol-large.png"), "PNG")
icon_1024.save(os.path.join(PUBLIC_DIR, "zapai-logo-transparent.png"), "PNG")

# 180x180 Apple Touch Icon
icon_180 = centered_icon.resize((180, 180), Image.Resampling.LANCZOS)
icon_180.save(os.path.join(PUBLIC_DIR, "apple-touch-icon.png"), "PNG")

# 64x64 & 32x32 Favicons
icon_64 = centered_icon.resize((64, 64), Image.Resampling.LANCZOS)
icon_64.save(os.path.join(PUBLIC_DIR, "zapai-favicon.png"), "PNG")

icon_32 = centered_icon.resize((32, 32), Image.Resampling.LANCZOS)
icon_16 = centered_icon.resize((16, 16), Image.Resampling.LANCZOS)
# Save multi-size favicon.ico
icon_512.save(os.path.join(PUBLIC_DIR, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

print("Icon assets saved successfully.")

# 3. Render Master Horizontal Logos with Edge Headless
# We use standard typography from Plus Jakarta Sans / Inter to make it ultra-crisp
# Two versions:
# - zapai-logo-dark.png (for LIGHT backgrounds: Dark Navy 'Zap' + Royal Blue 'AI')
# - zapai-logo-light.png (for DARK backgrounds: White 'Zap' + Electric Cyan/Blue 'AI')

html_template_light_bg = """<!DOCTYPE html>
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
    .wrapper {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-left: 10px;
    }
    .icon {
      width: 84px;
      height: 84px;
      object-fit: contain;
    }
    .brand-name {
      font-size: 54px;
      font-weight: 800;
      letter-spacing: -1.8px;
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
  <div class="wrapper">
    <img class="icon" src="zapai-symbol.png" />
    <div class="brand-name">
      <span class="zap">Zap</span><span class="ai">AI</span>
    </div>
  </div>
</body>
</html>"""

html_template_dark_bg = """<!DOCTYPE html>
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
    .wrapper {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-left: 10px;
    }
    .icon {
      width: 84px;
      height: 84px;
      object-fit: contain;
      filter: drop-shadow(0 4px 14px rgba(37, 99, 235, 0.35));
    }
    .brand-name {
      font-size: 54px;
      font-weight: 800;
      letter-spacing: -1.8px;
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
  <div class="wrapper">
    <img class="icon" src="zapai-symbol.png" />
    <div class="brand-name">
      <span class="zap">Zap</span><span class="ai">AI</span>
    </div>
  </div>
</body>
</html>"""

temp_light_html = os.path.join(PUBLIC_DIR, "_temp_light.html")
temp_dark_html = os.path.join(PUBLIC_DIR, "_temp_dark.html")

with open(temp_light_html, "w", encoding="utf-8") as f:
    f.write(html_template_light_bg)

with open(temp_dark_html, "w", encoding="utf-8") as f:
    f.write(html_template_dark_bg)

# Render zapai-logo-dark.png (Dark text on light background)
out_logo_dark = os.path.join(PUBLIC_DIR, "zapai-logo-dark.png")
cmd1 = [
    EDGE_PATH,
    "--headless",
    "--disable-gpu",
    "--default-background-color=00000000",
    f"--screenshot={out_logo_dark}",
    "--window-size=480,120",
    f"file:///{temp_light_html.replace(os.sep, '/')}"
]
subprocess.run(cmd1, capture_output=True)

# Render zapai-logo-light.png (Light text on dark background)
out_logo_light = os.path.join(PUBLIC_DIR, "zapai-logo-light.png")
cmd2 = [
    EDGE_PATH,
    "--headless",
    "--disable-gpu",
    "--default-background-color=00000000",
    f"--screenshot={out_logo_light}",
    "--window-size=480,120",
    f"file:///{temp_dark_html.replace(os.sep, '/')}"
]
subprocess.run(cmd2, capture_output=True)

# Cleanup temporary html files
if os.path.exists(temp_light_html):
    os.remove(temp_light_html)
if os.path.exists(temp_dark_html):
    os.remove(temp_dark_html)

# Copy to aliases
shutil.copy2(out_logo_dark, os.path.join(PUBLIC_DIR, "logo.png"))
shutil.copy2(out_logo_dark, os.path.join(PUBLIC_DIR, "zapai-logo-header.png"))
shutil.copy2(out_logo_dark, os.path.join(PUBLIC_DIR, "logo_full.png"))
shutil.copy2(out_logo_light, os.path.join(PUBLIC_DIR, "logo_full_dark.png"))
shutil.copy2(out_logo_dark, os.path.join(PUBLIC_DIR, "logo_full_trans.png"))
shutil.copy2(os.path.join(PUBLIC_DIR, "zapai-symbol.png"), os.path.join(PUBLIC_DIR, "logo_icon.png"))
shutil.copy2(os.path.join(PUBLIC_DIR, "zapai-symbol.png"), os.path.join(PUBLIC_DIR, "logo_icon_dark.png"))
shutil.copy2(os.path.join(PUBLIC_DIR, "zapai-symbol.png"), os.path.join(PUBLIC_DIR, "logo_icon_trans.png"))

print("All horizontal logo assets rendered and copied to public!")
