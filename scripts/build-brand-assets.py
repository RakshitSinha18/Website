"""
Compose the site's brand images from the 3D monogram master render.

Input:  /tmp/brand-tile-hq.png  (1024x1024, transparent, from render-brand-og.py)
Output: public/rs-logo-3d.png            — the monogram tile, tight-cropped
        public/brand/og-image.png        — 1200x630 social card (tile + wordmark)
        public/brand/icon-192.png         — PWA icon
        public/brand/icon-512.png         — PWA icon
        public/brand/apple-touch-icon.png — 180, iOS home screen
        public/brand/favicon-32.png       — browser tab
        public/brand/favicon-16.png       — browser tab

Text is drawn with Pillow using a bundled sans font. Colours from BRAND.md.
Idempotent — safe to re-run. Requires Pillow.
"""

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
BRAND = os.path.join(PUB, "brand")
MASTER = "/tmp/brand-tile-hq.png"

INK = (11, 15, 25)          # #0b0f19
INK_RAISED = (20, 26, 43)   # #141a2b
SKY = (56, 189, 248)        # #38bdf8
AMBER = (251, 191, 36)      # #fbbf24
FG = (245, 247, 250)        # #f5f7fa
MUTED = (139, 151, 168)     # #8b97a8


def load_font(size, bold=True):
    candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def load_mono(size):
    for p in ["/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Monaco.ttf"]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return load_font(size)


def tight_tile(master, margin_frac=0.06):
    """Crop the master to its content, add a small transparent margin back."""
    bbox = master.getbbox()
    tile = master.crop(bbox)
    w, h = tile.size
    m = int(max(w, h) * margin_frac)
    out = Image.new("RGBA", (w + 2 * m, h + 2 * m), (0, 0, 0, 0))
    out.paste(tile, (m, m), tile)
    return out


def radial_ink(size, center_color, edge_color):
    """Cheap radial wash: edge color base, center color blended in a soft blob."""
    w, h = size
    base = Image.new("RGB", (w, h), edge_color)
    blob = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(blob)
    cx, cy = int(w * 0.32), int(h * 0.5)
    rad = int(max(w, h) * 0.6)
    for i in range(rad, 0, -2):
        a = int(150 * (1 - i / rad))
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=a)
    center = Image.new("RGB", (w, h), center_color)
    return Image.composite(center, base, blob)


def build_og(tile):
    W, H = 1200, 630
    bg = radial_ink((W, H), INK_RAISED, INK)
    card = bg.convert("RGBA")

    # Top hairline accent (sky->amber), like the current card.
    accent = Image.new("RGBA", (W, 4), (0, 0, 0, 0))
    ad = accent.load()
    for x in range(W):
        t = x / (W - 1)
        ad[x, 0] = (
            int(SKY[0] + (AMBER[0] - SKY[0]) * t),
            int(SKY[1] + (AMBER[1] - SKY[1]) * t),
            int(SKY[2] + (AMBER[2] - SKY[2]) * t),
            255,
        )
    for y in range(4):
        for x in range(W):
            accent.putpixel((x, y), accent.getpixel((x, 0)))
    card.alpha_composite(accent, (0, 0))

    # 3D monogram tile on the left.
    t = tight_tile(tile, 0.02)
    target = 300
    t = t.resize((target, target), Image.LANCZOS)
    card.alpha_composite(t, (120, (H - target) // 2))

    draw = ImageDraw.Draw(card)
    name_font = load_font(76)
    role_font = load_font(34)
    mono_font = load_mono(24)

    tx = 120 + target + 56
    draw.text((tx, 232), "Rakshit Sinha", font=name_font, fill=FG)
    draw.text((tx, 322), "Senior Business Intelligence · Mentor", font=role_font, fill=MUTED)

    # Skills line in mono, sky-tinted. Kept short so it never runs to the edge.
    skills = "SQL  ·  Tableau  ·  Power BI  ·  Fabric"
    draw.text((tx, 392), skills, font=mono_font, fill=SKY)
    draw.text((tx, 430), "sinharakshit.com  ·  1-on-1 evening classes", font=mono_font, fill=MUTED)

    card.convert("RGB").save(os.path.join(BRAND, "og-image.png"))
    print("wrote og-image.png")


def build_icon(tile, size, path, bg=INK):
    t = tight_tile(tile, 0.02)
    # Icons: tile fills most of the frame on the ink background (square,
    # opaque — home-screen icons shouldn't be transparent).
    canvas = Image.new("RGBA", (size, size), bg + (255,))
    inner = int(size * 0.92)
    t = t.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    canvas.alpha_composite(t, (off, off))
    canvas.convert("RGB").save(path)
    print("wrote", os.path.basename(path))


def main():
    if not os.path.exists(MASTER):
        raise SystemExit(f"Master render missing: {MASTER}\nRun render-brand-og.py first.")
    master = Image.open(MASTER).convert("RGBA")

    # Standalone tight tile for the site (nav/loader/hero can use this PNG).
    tight_tile(master, 0.06).save(os.path.join(PUB, "rs-logo-3d.png"))
    print("wrote rs-logo-3d.png")

    build_og(master)
    # Large icons: the 3D render shines here.
    build_icon(master, 512, os.path.join(BRAND, "icon-512.png"))
    build_icon(master, 192, os.path.join(BRAND, "icon-192.png"))
    build_icon(master, 180, os.path.join(BRAND, "apple-touch-icon.png"))
    # Tiny favicons (16/32) are rendered from the crisp flat SVG in a separate
    # step — 3D detail turns muddy at that size. See build-favicons below.
    print("note: favicon-16/32 come from the SVG (run build_favicons)")


if __name__ == "__main__":
    main()
