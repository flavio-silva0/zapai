import os
import subprocess
import shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
ARTIFACT_DIR = r"C:\Users\FlavioJuniorCarvalho\.gemini\antigravity\brain\a772fc6f-7ffb-480f-b486-e463e9bb9a98"
PUBLIC_DIR = os.path.join(PROJECT_DIR, "frontend", "public")
NEW_BRAND_DIR = os.path.join(PUBLIC_DIR, "new_brand")
os.makedirs(NEW_BRAND_DIR, exist_ok=True)
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# ==============================================================================
# 1. OPTION 1: DUAL BUBBLE INTERLOCK (O Diálogo Inteligente)
# Dois balões geométricos lapidados (Cliente e Atendente Zap) sobrepostos na diagonal,
# com a letra Z esculpida com pureza geométrica na intersecção.
# ==============================================================================

svg_option_1_symbol = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="emeraldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
    <filter id="subtleDrop" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.10"/>
    </filter>
  </defs>

  <g filter="url(#subtleDrop)">
    <!-- Balão 1: Cliente / Entrada (Midnight Slate #0F172A) -->
    <!-- Top-left oriented message bubble with smooth squircle radii and clean pointer -->
    <path d="M 150 96 
             L 370 96 
             C 416 96, 440 120, 440 166 
             L 440 220 
             C 440 266, 416 290, 370 290 
             L 280 290 
             L 200 360 
             L 210 290 
             L 150 290 
             C 104 290, 80 266, 80 220 
             L 80 166 
             C 80 120, 104 96, 150 96 Z" 
          fill="#0F172A" />

    <!-- Balão 2: Atendente ZapAI / Resposta (Emerald #10B981) -->
    <!-- Bottom-right oriented message bubble with inverted symmetry -->
    <path d="M 362 416 
             L 142 416 
             C 96 416, 72 392, 72 346 
             L 72 292 
             C 72 246, 96 222, 142 222 
             L 232 222 
             L 312 152 
             L 302 222 
             L 362 222 
             C 408 222, 432 246, 432 292 
             L 432 346 
             C 432 392, 408 416, 362 416 Z" 
          fill="url(#emeraldGrad1)" />

    <!-- O 'Z' de alta velocidade recortado em espaço negativo com proporção perfeita -->
    <path d="M 180 178 
             L 342 178 
             L 342 216 
             L 232 298 
             L 342 298 
             L 342 334 
             L 170 334 
             L 170 296 
             L 280 214 
             L 180 214 Z" 
          fill="#FFFFFF" />
  </g>
</svg>"""

# ==============================================================================
# 2. OPTION 2: THE MODERN Z-CHAT MONOGRAM (O Monograma Contínuo)
# Inspirado na identidade de marcas modernas (como Linear / Wise).
# O 'Z' é esculpido como uma forma sólida e confiante, onde a base
# é um balão de diálogo com a cauda característica do WhatsApp.
# ==============================================================================

svg_option_2_symbol = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="emeraldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="50%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="softGlowSubtle" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#059669" flood-opacity="0.16"/>
    </filter>
  </defs>

  <g filter="url(#softGlowSubtle)">
    <!-- O corpo principal do Z-Chat Monogram -->
    <path d="M 116 112 
             L 384 112 
             C 408 112, 424 130, 412 152 
             L 246 348 
             L 364 348 
             C 388 348, 404 366, 404 390 
             L 404 408 
             L 438 438 
             L 392 438 
             L 148 438 
             C 124 438, 108 420, 120 398 
             L 286 202 
             L 168 202 
             C 144 202, 128 184, 128 160 
             L 128 128 
             C 128 119, 134 112, 116 112 Z" 
          fill="url(#emeraldGrad2)" />
    
    <!-- Ponto de status / IA conectada (sutil e elegante) -->
    <circle cx="420" cy="112" r="14" fill="#10B981" />
  </g>
</svg>"""

# ==============================================================================
# 3. HORIZONTAL LOGOS (Ícone + Tipografia ZapAI para Dark e Light mode)
# ==============================================================================

def make_horizontal_svg(theme="dark", option=1):
    is_dark = theme == "dark"
    text_zap_color = "#FFFFFF" if is_dark else "#0F172A"
    text_ai_color = "#10B981" # Emerald vibrante
    subtitle_color = "#94A3B8" if is_dark else "#64748B"
    bg_tile_fill = "#1E293B" if is_dark else "#F1F5F9"

    # We embed the symbol scaled down to 72x72
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 120" width="540" height="120">
  <defs>
    <linearGradient id="hz_emerald_{theme}_{option}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
  </defs>

  <!-- ICON CONTAINER (Squircle moderno) -->
  <g transform="translate(16, 16)">
    <rect width="88" height="88" rx="22" fill="{bg_tile_fill}" />
    
    <!-- Scaled Symbol inside Squircle (512x512 scaled to 64x64 at offset 12, 12) -->
    <g transform="translate(12, 12) scale(0.125)">
      <path d="M 150 96 L 370 96 C 416 96, 440 120, 440 166 L 440 220 C 440 266, 416 290, 370 290 L 280 290 L 200 360 L 210 290 L 150 290 C 104 290, 80 266, 80 220 L 80 166 C 80 120, 104 96, 150 96 Z" fill="{'#FFFFFF' if is_dark else '#0F172A'}" />
      <path d="M 362 416 L 142 416 C 96 416, 72 392, 72 346 L 72 292 C 72 246, 96 222, 142 222 L 232 222 L 312 152 L 302 222 L 362 222 C 408 222, 432 246, 432 292 L 432 346 C 432 392, 408 416, 362 416 Z" fill="url(#hz_emerald_{theme}_{option})" />
      <path d="M 180 178 L 342 178 L 342 216 L 232 298 L 342 298 L 342 334 L 170 334 L 170 296 L 280 214 L 180 214 Z" fill="{'#1E293B' if is_dark else '#FFFFFF'}" />
    </g>
  </g>

  <!-- WORDMARK: ZapAI -->
  <g transform="translate(124, 72)">
    <text font-family="Inter, system-ui, -apple-system, sans-serif" 
          font-size="46" 
          font-weight="800" 
          letter-spacing="-1">
      <tspan fill="{text_zap_color}">Zap</tspan><tspan fill="{text_ai_color}">AI</tspan>
    </text>
  </g>

  <!-- SUBTITLE / TAGLINE -->
  <g transform="translate(126, 94)">
    <text font-family="Inter, system-ui, -apple-system, sans-serif" 
          font-size="11" 
          font-weight="600" 
          letter-spacing="2.2" 
          fill="{subtitle_color}">
      ATENDENTE INTELIGENTE NO WHATSAPP
    </text>
  </g>
</svg>"""

# ==============================================================================
# 4. APP ICON (Squircle para iOS / Android / Favicon)
# ==============================================================================

svg_app_icon = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="appBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="emeraldApp" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
  </defs>

  <!-- Base Squircle com Cantos Super Elípticos -->
  <rect width="512" height="512" rx="112" fill="url(#appBg)" />

  <!-- Símbolo ZapAI centralizado -->
  <g transform="translate(32, 32) scale(0.875)">
    <!-- Balão 1 (Branco no app escuro para máximo contraste) -->
    <path d="M 150 96 L 370 96 C 416 96, 440 120, 440 166 L 440 220 C 440 266, 416 290, 370 290 L 280 290 L 200 360 L 210 290 L 150 290 C 104 290, 80 266, 80 220 L 80 166 C 80 120, 104 96, 150 96 Z" fill="#334155" />
    <!-- Balão 2 (Emerald) -->
    <path d="M 362 416 L 142 416 C 96 416, 72 392, 72 346 L 72 292 C 72 246, 96 222, 142 222 L 232 222 L 312 152 L 302 222 L 362 222 C 408 222, 432 246, 432 292 L 432 346 C 432 392, 408 416, 362 416 Z" fill="url(#emeraldApp)" />
    <!-- Z em destaque -->
    <path d="M 180 178 L 342 178 L 342 216 L 232 298 L 342 298 L 342 334 L 170 334 L 170 296 L 280 214 L 180 214 Z" fill="#FFFFFF" />
  </g>
</svg>"""

# Render dictionary
RENDER_TASKS = [
    {"name": "zapai_symbol_op1", "svg": svg_option_1_symbol, "w": 512, "h": 512},
    {"name": "zapai_symbol_op2", "svg": svg_option_2_symbol, "w": 512, "h": 512},
    {"name": "zapai_logo_dark", "svg": make_horizontal_svg("dark", 1), "w": 540, "h": 120},
    {"name": "zapai_logo_light", "svg": make_horizontal_svg("light", 1), "w": 540, "h": 120},
    {"name": "zapai_app_icon", "svg": svg_app_icon, "w": 512, "h": 512},
]

for task in RENDER_TASKS:
    name = task["name"]
    svg_content = task["svg"]
    w = task["w"]
    h = task["h"]

    # Save SVG in new_brand and artifact dir
    for target_dir in [NEW_BRAND_DIR, ARTIFACT_DIR]:
        svg_file = os.path.join(target_dir, f"{name}.svg")
        with open(svg_file, "w", encoding="utf-8") as f:
            f.write(svg_content)

    # HTML for Edge render
    html_file = os.path.join(NEW_BRAND_DIR, f"{name}.html")
    png_file = os.path.join(NEW_BRAND_DIR, f"{name}.png")
    artifact_png = os.path.join(ARTIFACT_DIR, f"{name}.png")

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html>
<html>
<head><style>body {{ margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: {w}px; height: {h}px; overflow: hidden; }}</style></head>
<body>
{svg_content}
</body>
</html>""")

    cmd = [
        EDGE_PATH,
        "--headless",
        "--disable-gpu",
        "--default-background-color=00000000",
        f"--screenshot={png_file}",
        f"--window-size={w},{h}",
        f"file:///{html_file.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd, capture_output=True)
    if os.path.exists(png_file):
        shutil.copy2(png_file, artifact_png)
        print(f"Generated {name}.png ({os.path.getsize(png_file)} bytes)")

print("All brand assets successfully built!")
