from PIL import Image

def convert_to_transparent(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        r, g, b, a = item
        # Use the maximum color value as the alpha channel
        alpha = max(r, g, b)
        
        if alpha == 0:
            new_data.append((0, 0, 0, 0))
        else:
            # Un-premultiply the colors to restore full brightness
            nr = int((r / alpha) * 255)
            ng = int((g / alpha) * 255)
            nb = int((b / alpha) * 255)
            new_data.append((nr, ng, nb, alpha))
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

convert_to_transparent("C:\\Users\\fjrcs\\Documents\\PROJETOS\\DentistAI\\frontend\\public\\logo_icon_dark.png", "C:\\Users\\fjrcs\\Documents\\PROJETOS\\DentistAI\\frontend\\public\\logo_icon_trans.png")
convert_to_transparent("C:\\Users\\fjrcs\\Documents\\PROJETOS\\DentistAI\\frontend\\public\\logo_full_dark.png", "C:\\Users\\fjrcs\\Documents\\PROJETOS\\DentistAI\\frontend\\public\\logo_full_trans.png")
