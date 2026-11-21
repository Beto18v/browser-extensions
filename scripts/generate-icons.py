import os
import math
from PIL import Image, ImageDraw, ImageFilter

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(ROOT_DIR, 'icons')

os.makedirs(os.path.join(ICONS_DIR, 'docguard'), exist_ok=True)
os.makedirs(os.path.join(ICONS_DIR, 'dark-mode'), exist_ok=True)
os.makedirs(os.path.join(ICONS_DIR, 'recordflow'), exist_ok=True)

# 1. Copy DocGuard existing icons
docguard_source = os.path.join(ROOT_DIR, 'extensions', 'docguard', 'public', 'icons')
for sz in [16, 48, 128]:
    src = os.path.join(docguard_source, f'icon-{sz}.png')
    dst = os.path.join(ICONS_DIR, 'docguard', f'icon-{sz}.png')
    if os.path.exists(src):
        with open(src, 'rb') as f_in, open(dst, 'wb') as f_out:
            f_out.write(f_in.read())
print("✅ Copied DocGuard icons to icons/docguard/")

# Helper for rounded rectangles (squircles)
def draw_squircle(draw, bounds, radius, fill):
    draw.rounded_rectangle(bounds, radius=radius, fill=fill)

# 2. Generate Eclipse Icon (Universal Dark Mode)
# Concept: Deep obsidian background, celestial glowing aura, vibrant cyan/teal crescent moon
def generate_eclipse_hi_res():
    size = 512
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    # Rounded squircle base
    margin = 32
    draw_squircle(draw, [margin, margin, size - margin, size - margin], radius=110, fill=(15, 23, 42, 255)) # Slate 900

    # Glow layer
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    center = (256, 256)
    radius_glow = 150
    glow_draw.ellipse([center[0]-radius_glow, center[1]-radius_glow, center[0]+radius_glow, center[1]+radius_glow], fill=(20, 184, 166, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    im = Image.alpha_composite(im, glow)
    draw = ImageDraw.Draw(im)

    # Eclipse ring / sun rim behind
    draw.ellipse([140, 140, 372, 372], outline=(45, 212, 191, 140), width=10)

    # Sharp Crescent Moon
    # Outer circle (teal)
    moon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    moon_draw = ImageDraw.Draw(moon)
    moon_draw.ellipse([150, 150, 362, 362], fill=(20, 184, 166, 255))
    
    # Inner cutout to make crescent
    moon_draw.ellipse([200, 130, 395, 325], fill=(0, 0, 0, 0))
    
    # Paste moon
    im = Image.alpha_composite(im, moon)
    draw = ImageDraw.Draw(im)

    # Small celestial sparkle / star
    star_x, star_y = 350, 175
    draw.line([star_x - 16, star_y, star_x + 16, star_y], fill=(255, 255, 255, 240), width=5)
    draw.line([star_x, star_y - 16, star_x, star_y + 16], fill=(255, 255, 255, 240), width=5)
    draw.ellipse([star_x - 5, star_y - 5, star_x + 5, star_y + 5], fill=(255, 255, 255, 255))

    return im

# 3. Generate RecordFlow Icon (Screen & Camera Recorder)
# Concept: Deep indigo background, glowing video lens / camera aperture with vivid recording red dot and waveform pulse
def generate_recordflow_hi_res():
    size = 512
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    # Rounded squircle base (indigo/violet)
    margin = 32
    draw_squircle(draw, [margin, margin, size - margin, size - margin], radius=110, fill=(30, 27, 75, 255)) # Indigo 950

    # Glow layer
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    center = (256, 256)
    radius_glow = 150
    glow_draw.ellipse([center[0]-radius_glow, center[1]-radius_glow, center[0]+radius_glow, center[1]+radius_glow], fill=(99, 102, 241, 120))
    glow = glow.filter(ImageFilter.GaussianBlur(35))
    im = Image.alpha_composite(im, glow)
    draw = ImageDraw.Draw(im)

    # Outer camera lens aperture ring (indigo 400)
    draw.ellipse([140, 140, 372, 372], outline=(99, 102, 241, 230), width=18)
    
    # Broadcast signal waves on top right
    draw.arc([100, 100, 412, 412], start=295, end=345, fill=(129, 140, 248, 200), width=12)
    draw.arc([75, 75, 437, 437], start=298, end=342, fill=(165, 180, 252, 160), width=10)

    # Dark inner lens
    draw.ellipse([185, 185, 327, 327], fill=(15, 23, 42, 255))

    # Glowing Coral-Red Record Core
    core_glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    core_draw = ImageDraw.Draw(core_glow)
    core_draw.ellipse([210, 210, 302, 302], fill=(239, 68, 68, 180))
    core_glow = core_glow.filter(ImageFilter.GaussianBlur(15))
    im = Image.alpha_composite(im, core_glow)
    draw = ImageDraw.Draw(im)

    # Solid record dot
    draw.ellipse([220, 220, 292, 292], fill=(244, 63, 94, 255))
    
    # Lens glint (subtle highlight on core)
    draw.ellipse([234, 234, 252, 252], fill=(255, 255, 255, 220))

    return im

eclipse_512 = generate_eclipse_hi_res()
recordflow_512 = generate_recordflow_hi_res()

# Downsample and save to icons/<app>/
for sz in [128, 48, 16]:
    e_img = eclipse_512.resize((sz, sz), Image.Resampling.LANCZOS)
    e_img.save(os.path.join(ICONS_DIR, 'dark-mode', f'icon-{sz}.png'), format='PNG')
    
    r_img = recordflow_512.resize((sz, sz), Image.Resampling.LANCZOS)
    r_img.save(os.path.join(ICONS_DIR, 'recordflow', f'icon-{sz}.png'), format='PNG')

print("✅ Generated icons for Eclipse and RecordFlow at 128x128, 48x48, 16x16")
