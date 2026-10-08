#!/usr/bin/env python3
"""Builds every logo and icon file in public/ from the two transparent Smart Pro logos in tools/brand/:
smart-pro-logo-light.png (black + teal, for light backgrounds) and smart-pro-logo-dark.png (silver + teal,
for dark backgrounds). Run again whenever a source logo changes:  python3 tools/brand-assets.py

  assets/img/logo-mark.png / logo-mark-dark.png   SP mark only (header), light / dark theme
  assets/img/logo-full.png / logo-full-dark.png   mark + SMART PRO (launch screen), light / dark theme
  assets/icons/icon-*.png, maskable-*.png, apple-touch-icon.png, favicon.ico   silver mark on the dark tile
  assets/icons/og-image.png                       link preview (1200x630)
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / 'tools/brand'
PUB = ROOT / 'public'
TILE = (11, 15, 14)  # icon and link-preview background: the logo's near-black

def load(name):
    img = Image.open(BRAND / name).convert('RGBA')
    # Drop near-invisible specks left around the artwork so trimming finds the real edges.
    a = img.getchannel('A').point(lambda v: 0 if v < 24 else v)
    img.putalpha(a)
    return trim(img)

def trim(img):
    return img.crop(img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())

def split(full):
    """The mark is everything above the empty band between the SP and the SMART PRO text."""
    alpha = full.getchannel('A')
    ink = [any(alpha.getpixel((x, y)) > 8 for x in range(0, full.width, 2)) for y in range(full.height)]
    gap = next(y for y in range(int(full.height * 0.6), full.height) if not ink[y])
    return trim(full.crop((0, 0, full.width, gap)))

def fit(img, box):
    img = img.copy()
    img.thumbnail(box, Image.LANCZOS)
    return img

def place(canvas, img, box_w, box_h):
    img = fit(img, (box_w, box_h))
    canvas.alpha_composite(img, ((canvas.width - img.width) // 2, (canvas.height - img.height) // 2))
    return canvas

def tile_icon(mark, size, scale):
    return place(Image.new('RGBA', (size, size), TILE + (255,)), mark, round(size * scale), round(size * scale))

def main():
    full, full_dark = load('smart-pro-logo-light.png'), load('smart-pro-logo-dark.png')
    mark, mark_dark = split(full), split(full_dark)

    img = PUB / 'assets/img'
    for name, src in [('logo-mark', mark), ('logo-mark-dark', mark_dark)]:
        place(Image.new('RGBA', (160, 160), (0, 0, 0, 0)), src, 160, 160).save(img / f'{name}.png', optimize=True)
    for name, src in [('logo-full', full), ('logo-full-dark', full_dark)]:
        fit(src, (360, 360)).save(img / f'{name}.png', optimize=True)

    icons = PUB / 'assets/icons'
    for s in (192, 512):
        tile_icon(mark_dark, s, 0.72).save(icons / f'icon-{s}.png', optimize=True)
        tile_icon(mark_dark, s, 0.56).save(icons / f'maskable-{s}.png', optimize=True)  # inside the 80% safe zone
    tile_icon(mark_dark, 180, 0.70).convert('RGB').save(PUB / 'apple-touch-icon.png', optimize=True)
    tile_icon(mark_dark, 256, 0.80).save(PUB / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

    og = Image.new('RGBA', (1200, 630), TILE + (255,))
    place(og, full_dark, 540, 500).convert('RGB').save(icons / 'og-image.png', optimize=True)
    print('mark', mark.size, mark_dark.size, 'full', full.size, full_dark.size)

if __name__ == '__main__':
    main()
