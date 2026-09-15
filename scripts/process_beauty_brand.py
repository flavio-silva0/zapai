import os
from PIL import Image, ImageChops
import subprocess

ARTIFACT_DIR = r"C:\Users\FlavioJuniorCarvalho\.gemini\antigravity\brain\a772fc6f-7ffb-480f-b486-e463e9bb9a98"
PUBLIC_DIR = r"c:\Users\FlavioJuniorCarvalho\Documents\Pessoal\ZapAI\frontend\public"
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# 1. Process Concept 4 (The Fluid Z)
img4_path = os.path.join(ARTIFACT_DIR, "zapai_beauty_concept_4_1789409565238.jpg")
img4 = Image.open(img4_path).convert("RGBA")

# Concept 4 has a pure white/off-white background. Let's make it transparent.
# Detect background color from corner pixel
bg_color = img4.getpixel((10, 10))[:3]
print("Concept 4 BG color:", bg_color)

datas = img4.getdata()
new_data = []
for item in datas:
    r, g, b, a = item
    # Distance from background color
    diff = max(abs(r - bg_color[0]), abs(g - bg_color[1]), abs(b - bg_color[2]))
    if diff < 15:
        new_data.append((255, 255, 255, 0))
    elif diff < 40:
        # Smooth alpha blend for antialiasing
        alpha = int(((diff - 15) / 25) * 255)
        new_data.append((r, g, b, alpha))
    else:
        new_data.append((r, g, b, 255))

img4_trans = Image.new("RGBA", img4.size)
img4_trans.putdata(new_data)

# Crop to bounding box
bbox = img4_trans.getbbox()
print("Concept 4 bbox:", bbox)
cropped4 = img4_trans.crop(bbox)

# Add comfortable padding around mark
pad = 40
padded_size = (cropped4.width + pad * 2, cropped4.height + pad * 2)
mark_trans = Image.new("RGBA", padded_size, (0, 0, 0, 0))
mark_trans.paste(cropped4, (pad, pad), cropped4)

# Resize to standard 512x512 icon
icon_512 = mark_trans.resize((512, 512), Image.Resampling.LANCZOS)
icon_512_path = os.path.join(PUBLIC_DIR, "zapai-symbol.png")
icon_512.save(icon_512_path, "PNG")
print("Saved zapai-symbol.png")

# Also create favicon (64x64)
fav = icon_512.resize((64, 64), Image.Resampling.LANCZOS)
fav.save(os.path.join(PUBLIC_DIR, "zapai-favicon.png"), "PNG")

# 2. Build Horizontal Logos with Wordmark using HTML/Edge for ultimate typography perfection
# We will use the transparent symbol we just saved
temp_html_dark = os.path.join(PUBLIC_DIR, "render_dark_logo.html")
temp_html_light = os.path.join(PUBLIC_DIR, "render_light_logo.html")

# zapai-logo-dark.png (for light backgrounds -> Dark text "Zap" + Green "AI")
html_for_light_bg = f"""<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap" rel="stylesheet">
  <style>
    body {{
      margin: 0;
      padding: 0;
      background: transparent;
      display: flex;
      align-items: center;
      height: 100px;
      width: 360px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }}
    .logo-container {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}
    .icon {{
      width: 64px;
      height: 64px;
      object-fit: contain;
    }}
    .text {{
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -1.2px;
      line-height: 1;
    }}
    .zap {{
      color: #0F172A;
    }}
    .ai {{
      color: #10B981;
    }}
  </style>
</head>
<body>
  <div class="logo-container">
    <img class="icon" src="zapai-symbol.png" />
    <div class="text">
      <span class="zap">Zap</span><span class="ai">AI</span>
    </div>
  </div>
</body>
</html>"""

# zapai-logo-light.png (for dark backgrounds -> White text "Zap" + Green "AI")
html_for_dark_bg = f"""<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap" rel="stylesheet">
  <style>
    body {{
      margin: 0;
      padding: 0;
      background: transparent;
      display: flex;
      align-items: center;
      height: 100px;
      width: 360px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }}
    .logo-container {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}
    .icon {{
      width: 64px;
      height: 64px;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(16, 185, 129, 0.2));
    }}
    .text {{
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -1.2px;
      line-height: 1;
    }}
    .zap {{
      color: #FFFFFF;
    }}
    .ai {{
      color: #10B981;
    }}
  </style>
</head>
<body>
  <div class="logo-container">
    <img class="icon" src="zapai-symbol.png" />
    <div class="text">
      <span class="zap">Zap</span><span class="ai">AI</span>
    </div>
  </div>
</body>
</html>"""

with open(temp_html_dark, "w", encoding="utf-8") as f:
    f.write(html_for_light_bg)

with open(temp_html_light, "w", encoding="utf-8") as f:
    f.write(html_for_dark_bg)

# Render zapai-logo-dark.png (for light backgrounds)
out_dark_logo = os.path.join(PUBLIC_DIR, "zapai-logo-dark.png")
cmd1 = [
    EDGE_PATH,
    "--headless",
    "--disable-gpu",
    "--default-background-color=00000000",
    f"--screenshot={out_dark_logo}",
    "--window-size=360,100",
    f"file:///{temp_html_dark.replace(os.sep, '/')}"
]
subprocess.run(cmd1, capture_output=True)
print("Rendered zapai-logo-dark.png")

# Render zapai-logo-light.png (for dark backgrounds)
out_light_logo = os.path.join(PUBLIC_DIR, "zapai-logo-light.png")
cmd2 = [
    EDGE_PATH,
    "--headless",
    "--disable-gpu",
    "--default-background-color=00000000",
    f"--screenshot={out_light_logo}",
    "--window-size=360,100",
    f"file:///{temp_html_light.replace(os.sep, '/')}"
]
subprocess.run(cmd2, capture_output=True)
print("Rendered zapai-logo-light.png")

# Also copy to logo.png
import shutil
shutil.copy2(out_dark_logo, os.path.join(PUBLIC_DIR, "logo.png"))
shutil.copy2(out_dark_logo, os.path.join(PUBLIC_DIR, "zapai-logo-header.png"))
shutil.copy2(icon_512_path, os.path.join(PUBLIC_DIR, "zapai-logo-transparent.png"))

print("All frontend public assets updated!")
