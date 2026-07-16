from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"c:\Projects\GameStore\apps\web\public")
BRAND = ROOT / "brand"
OG = ROOT / "og"
DARK = (6, 7, 13, 255)
PURPLE = (168, 85, 247, 255)
CYAN = (6, 182, 212, 255)
PURPLE_DEEP = (124, 58, 237, 255)
CYAN_DEEP = (8, 145, 178, 255)
CORE = (103, 232, 249, 255)
WHITE = (237, 242, 255, 255)
MUTED = (148, 163, 184, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))


def draw_prism(draw: ImageDraw.ImageDraw, cx: float, cy: float, scale: float):
    def p(x, y):
        return (cx + (x - 32) * scale, cy + (y - 32) * scale)

    # incomplete ring
    bbox = [
        cx - 20.5 * scale,
        cy - 20.5 * scale,
        cx + 20.5 * scale,
        cy + 20.5 * scale,
    ]
    draw.arc(bbox, start=-35, end=250, fill=PURPLE, width=max(2, int(2.25 * scale)))
    r = 2.25 * scale
    draw.ellipse([cx + 20.5 * scale - r, cy - r, cx + 20.5 * scale + r, cy + r], fill=CYAN)

    top = [p(32, 10), p(48, 24), p(32, 38), p(16, 24)]
    draw.polygon(top, fill=PURPLE)
    # overlay cyan towards bottom-right of top face via second pass approximation
    br = [p(32, 10), p(48, 24), p(32, 38)]
    draw.polygon(br, fill=lerp(PURPLE, CYAN, 0.55))

    draw.polygon([p(32, 38), p(48, 24), p(48, 40), p(32, 54)], fill=PURPLE_DEEP)
    draw.polygon([p(32, 38), p(16, 24), p(16, 40), p(32, 54)], fill=CYAN_DEEP)

    draw.polygon([p(32, 20), p(40, 27), p(32, 34), p(24, 27)], fill=CORE)
    draw.polygon([p(32, 34), p(40, 27), p(40, 35), p(32, 42)], fill=(165, 243, 252, 180))
    draw.polygon([p(32, 34), p(24, 27), p(24, 35), p(32, 42)], fill=(6, 182, 212, 200))


def make_icon(size: int, pad_ratio: float = 0.12) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # rounded dark tile
    margin = int(size * 0.04)
    radius = max(4, int(size * 0.18))
    draw.rounded_rectangle(
        [margin, margin, size - margin - 1, size - margin - 1],
        radius=radius,
        fill=(10, 12, 22, 255),
        outline=(168, 85, 247, 120),
        width=max(1, size // 48),
    )
    scale = (size * (1 - 2 * pad_ratio)) / 64
    draw_prism(draw, size / 2, size / 2, scale)
    return img


def save_ico(path: Path):
    """Write a PNG-compressed multi-resolution ICO."""
    import io
    import struct

    base = make_icon(512)
    sizes = [16, 32, 48]
    images_data = []
    entries = []
    offset = 6 + 16 * len(sizes)
    for s in sizes:
        im = base.resize((s, s), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, format="PNG")
        data = buf.getvalue()
        w = 0 if s >= 256 else s
        h = 0 if s >= 256 else s
        entries.append(struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(data), offset))
        images_data.append(data)
        offset += len(data)
    header = struct.pack("<HHH", 0, 1, len(sizes))
    path.write_bytes(header + b"".join(entries) + b"".join(images_data))


def make_og() -> Image.Image:
    w, h = 1200, 630
    img = Image.new("RGBA", (w, h), DARK)
    draw = ImageDraw.Draw(img)

    # ambient glows
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([-200, -250, 500, 450], fill=(168, 85, 247, 55))
    gdraw.ellipse([700, 200, 1400, 900], fill=(6, 182, 212, 45))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # prism mark
    draw_prism(draw, 220, 315, 4.2)

    # wordmark
    try:
        font_lg = ImageFont.truetype("arialbd.ttf", 72)
        font_sm = ImageFont.truetype("arial.ttf", 28)
    except OSError:
        font_lg = ImageFont.load_default()
        font_sm = font_lg

    x, y = 380, 250
    draw.text((x, y), "Offline", font=font_lg, fill=MUTED)
    off_w = draw.textlength("Offline", font=font_lg)
    draw.text((x + off_w + 8, y), "Game", font=font_lg, fill=WHITE)
    game_w = draw.textlength("Game", font=font_lg)
    # NIA in purple (gradient approximation)
    draw.text((x + off_w + 8 + game_w, y), "NIA", font=font_lg, fill=PURPLE)
    draw.text(
        (x, y + 90),
        "Premium offline game activation",
        font=font_sm,
        fill=MUTED,
    )
    return img.convert("RGB")


def main():
    BRAND.mkdir(parents=True, exist_ok=True)
    OG.mkdir(parents=True, exist_ok=True)

    make_icon(512).save(BRAND / "offline-prism-512.png")
    make_icon(180).save(BRAND / "apple-touch-icon.png")
    make_icon(32).save(BRAND / "favicon-32.png")
    make_icon(16).save(BRAND / "favicon-16.png")
    save_ico(ROOT / "favicon.ico")
    make_og().save(OG / "default.png", format="PNG", optimize=True)
    print("Brand assets generated.")


if __name__ == "__main__":
    main()
