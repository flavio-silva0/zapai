import os
from PIL import Image
import subprocess
import shutil

ARTIFACT_DIR = r"C:\Users\FlavioJuniorCarvalho\.gemini\antigravity\brain\a772fc6f-7ffb-480f-b486-e463e9bb9a98"
PUBLIC_DIR = r"c:\Users\FlavioJuniorCarvalho\Documents\Pessoal\ZapAI\frontend\public"
OPTIONS_DIR = os.path.join(PUBLIC_DIR, "brand_options")
os.makedirs(OPTIONS_DIR, exist_ok=True)
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Define the 4 master options to process
OPTIONS = [
    {
        "id": "blue_opt1_wave",
        "title": "Opção 1: Cobalt Wave Z (Paleta Azul)",
        "file": "zapai_blue_opt1_1789410165497.jpg",
        "primary_color": "#2563EB",
        "accent_color": "#38BDF8",
        "desc": "Monograma Z fluido e aerodinâmico em tons de azul cobalto e marinho real. Estilo Linear/Stripe, veloz e de alta credibilidade corporativa."
    },
    {
        "id": "blue_opt2_bubble",
        "title": "Opção 2: Pacific Chat Bubble (Paleta Azul)",
        "file": "zapai_blue_opt2_1789410235278.jpg",
        "primary_color": "#1D4ED8",
        "accent_color": "#38BDF8",
        "desc": "Balão de conversa arredondado moderno em azul royal com o Z esculpido por ondas dinâmicas de mensagem. Forte apelo de comunicação."
    },
    {
        "id": "blue_opt4_origami",
        "title": "Opção 3: Prism Ribbon (Paleta Azul & Ciano)",
        "file": "zapai_blue_opt4_1789410371717.jpg",
        "primary_color": "#1D4ED8",
        "accent_color": "#06B6D4",
        "desc": "Fita geométrica dobrada com precisão arquitetônica em azul e ciano elétrico. Ultra moderno, marcante e tecnológico."
    },
    {
        "id": "green_opt3_loop",
        "title": "Opção 4: Emerald Chat Loop (Paleta Verde Pura)",
        "file": "zapai_green_opt3_1789410306003.jpg",
        "primary_color": "#10B981",
        "accent_color": "#047857",
        "desc": "Fita contínua em degradê esmeralda e jade profundo (sem preto). Curvas orgânicas e acolhedoras que formam o balão e o Z com naturalidade."
    }
]

def make_transparent_icon(src_path, out_icon_path):
    img = Image.open(src_path).convert("RGBA")
    bg = img.getpixel((10, 10))[:3]
    
    datas = img.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        diff = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
        if diff < 14:
            new_data.append((255, 255, 255, 0))
        elif diff < 38:
            alpha = int(((diff - 14) / 24) * 255)
            new_data.append((r, g, b, alpha))
        else:
            new_data.append((r, g, b, 255))
            
    img_trans = Image.new("RGBA", img.size)
    img_trans.putdata(new_data)
    
    # We want only the icon (top part of the 1024x1024 image, before the text)
    # Crop top 70% to avoid any image-generated text glitches
    w, h = img_trans.size
    icon_region = img_trans.crop((0, 0, w, int(h * 0.72)))
    bbox = icon_region.getbbox()
    if bbox:
        cropped = icon_region.crop(bbox)
        # Pad to square
        max_dim = max(cropped.width, cropped.height)
        pad = int(max_dim * 0.1)
        sq_size = max_dim + pad * 2
        sq_img = Image.new("RGBA", (sq_size, sq_size), (0, 0, 0, 0))
        sq_img.paste(cropped, (pad + (max_dim - cropped.width) // 2, pad + (max_dim - cropped.height) // 2), cropped)
        final_icon = sq_img.resize((512, 512), Image.Resampling.LANCZOS)
        final_icon.save(out_icon_path, "PNG")
        return final_icon
    return None

def render_horizontal_logos(icon_path, opt_id, primary_color):
    # Generates both dark-text and white-text versions with Edge headless
    html_dark_text = os.path.join(OPTIONS_DIR, f"{opt_id}_dark_text.html")
    html_white_text = os.path.join(OPTIONS_DIR, f"{opt_id}_white_text.html")
    png_dark_text = os.path.join(OPTIONS_DIR, f"{opt_id}_logo_on_light.png")
    png_white_text = os.path.join(OPTIONS_DIR, f"{opt_id}_logo_on_dark.png")
    
    icon_rel = os.path.basename(icon_path)
    
    # 1. Logo for light background (Dark text "Zap" + colored "AI")
    with open(html_dark_text, "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap" rel="stylesheet">
  <style>
    body {{ margin: 0; padding: 0; background: transparent; display: flex; align-items: center; width: 380px; height: 100px; font-family: 'Plus Jakarta Sans', sans-serif; }}
    .box {{ display: flex; align-items: center; gap: 14px; padding-left: 10px; }}
    .icon {{ width: 68px; height: 68px; object-fit: contain; }}
    .text {{ font-size: 44px; font-weight: 800; letter-spacing: -1.2px; }}
    .zap {{ color: #0F172A; }}
    .ai {{ color: {primary_color}; }}
  </style>
</head>
<body>
  <div class="box">
    <img class="icon" src="{icon_rel}">
    <div class="text"><span class="zap">Zap</span><span class="ai">AI</span></div>
  </div>
</body>
</html>""")

    # 2. Logo for dark background (White text "Zap" + colored "AI")
    with open(html_white_text, "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap" rel="stylesheet">
  <style>
    body {{ margin: 0; padding: 0; background: transparent; display: flex; align-items: center; width: 380px; height: 100px; font-family: 'Plus Jakarta Sans', sans-serif; }}
    .box {{ display: flex; align-items: center; gap: 14px; padding-left: 10px; }}
    .icon {{ width: 68px; height: 68px; object-fit: contain; filter: drop-shadow(0 2px 8px {primary_color}44); }}
    .text {{ font-size: 44px; font-weight: 800; letter-spacing: -1.2px; }}
    .zap {{ color: #FFFFFF; }}
    .ai {{ color: {primary_color}; }}
  </style>
</head>
<body>
  <div class="box">
    <img class="icon" src="{icon_rel}">
    <div class="text"><span class="zap">Zap</span><span class="ai">AI</span></div>
  </div>
</body>
</html>""")

    for h_file, p_file in [(html_dark_text, png_dark_text), (html_white_text, png_white_text)]:
        cmd = [
            EDGE_PATH,
            "--headless",
            "--disable-gpu",
            "--default-background-color=00000000",
            f"--screenshot={p_file}",
            "--window-size=380,100",
            f"file:///{h_file.replace(os.sep, '/')}"
        ]
        subprocess.run(cmd, capture_output=True)

# Process all 4 options
for opt in OPTIONS:
    src_path = os.path.join(ARTIFACT_DIR, opt["file"])
    out_icon_path = os.path.join(OPTIONS_DIR, f"{opt['id']}_icon.png")
    print(f"Processing {opt['id']}...")
    make_transparent_icon(src_path, out_icon_path)
    render_horizontal_logos(out_icon_path, opt["id"], opt["primary_color"])
    print(f"Done {opt['id']}.")

# Set Option 2 (Pacific Chat Bubble) as default in public dir for now so the website has active logos
default_icon = os.path.join(OPTIONS_DIR, "blue_opt2_bubble_icon.png")
default_dark = os.path.join(OPTIONS_DIR, "blue_opt2_bubble_logo_on_light.png")
default_light = os.path.join(OPTIONS_DIR, "blue_opt2_bubble_logo_on_dark.png")

shutil.copy2(default_icon, os.path.join(PUBLIC_DIR, "zapai-symbol.png"))
shutil.copy2(default_dark, os.path.join(PUBLIC_DIR, "zapai-logo-dark.png"))
shutil.copy2(default_light, os.path.join(PUBLIC_DIR, "zapai-logo-light.png"))
shutil.copy2(default_dark, os.path.join(PUBLIC_DIR, "logo.png"))
shutil.copy2(default_dark, os.path.join(PUBLIC_DIR, "zapai-logo-header.png"))

# Create 64x64 favicon
fav = Image.open(default_icon).resize((64, 64), Image.Resampling.LANCZOS)
fav.save(os.path.join(PUBLIC_DIR, "zapai-favicon.png"), "PNG")

print("All options processed and default deployed!")
