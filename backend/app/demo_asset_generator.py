"""
Generates fictional package-label images for the three switchable demo
products (Section 14 of the brief: "Prototype Sample Data"). These are
synthetic mockups drawn with Pillow — not photos of any real brand — so
the prototype never implies a compliance judgement about an actual
product on the market.
"""
from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_DIR = "/usr/share/fonts/truetype/dejavu"
W, H = 900, 1200


def _font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = os.path.join(FONT_DIR, name)
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


F_BRAND = lambda s=48: _font("DejaVuSans-Bold.ttf", s)
F_HEAD = lambda s=30: _font("DejaVuSans-Bold.ttf", s)
F_BODY = lambda s=22: _font("DejaVuSans.ttf", s)
F_SMALL = lambda s=16: _font("DejaVuSans.ttf", s)


def _label_canvas(bg_hex: str, panel_hex: str = "#FFFFFF") -> tuple[Image.Image, ImageDraw.Draw]:
    img = Image.new("RGB", (W, H), bg_hex)
    draw = ImageDraw.Draw(img)
    margin = 60
    draw.rounded_rectangle(
        [margin, 140, W - margin, H - 100], radius=18,
        fill=panel_hex, outline="#C9CFC9", width=3,
    )
    return img, draw


def _wrap_text(draw, text, font, max_width):
    words = text.split()
    lines, current = [], ""
    for w in words:
        trial = f"{current} {w}".strip()
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def generate_compliant(path_front: str):
    img, d = _label_canvas("#E9F3EC")
    x = 100
    d.text((x, 190), "GREENVALLEY KITCHEN", font=F_BRAND(), fill="#0B2545")
    d.text((x, 260), "Refined Sunflower Cooking Oil", font=F_HEAD(), fill="#10231C")
    d.line([(x, 320), (W - 100, 320)], fill="#C9CFC9", width=2)

    d.text((x, 350), "Mfg. Date: 03/2026", font=F_BODY(), fill="#10231C")
    d.text((x, 400), "Net Wt. 1 L", font=F_BODY(), fill="#10231C")
    d.text((x + 380, 400), "MRP Rs. 185.00", font=F_BODY(), fill="#10231C")
    d.text((x + 380, 430), "(incl. of all taxes)", font=F_SMALL(), fill="#5B6B65")

    d.line([(x, 480), (W - 100, 480)], fill="#C9CFC9", width=2)
    manu_lines = _wrap_text(
        d, "Manufactured and Packed by: GreenValley AgroFoods Pvt. Ltd., "
        "Plot 14, MIDC Industrial Area, Nashik, Maharashtra - 422010",
        F_BODY(20), W - 2 * x,
    )
    y = 510
    for line in manu_lines:
        d.text((x, y), line, font=F_BODY(20), fill="#10231C")
        y += 28

    d.line([(x, y + 20), (W - 100, y + 20)], fill="#C9CFC9", width=2)
    d.text((x, y + 45), "Consumer Care: care@greenvalleykitchen.in", font=F_BODY(20), fill="#10231C")
    d.text((x, y + 75), "Toll Free: 1800-419-2233", font=F_BODY(20), fill="#10231C")

    d.text((x, H - 170), "FSSAI Lic. No. 10419022001234", font=F_SMALL(), fill="#5B6B65")
    d.text((x, H - 145), "Best Before 12 months from Mfg. Date  •  Vegetarian", font=F_SMALL(), fill="#5B6B65")

    img.save(path_front, quality=92)


def generate_non_compliant(path_front: str):
    img, d = _label_canvas("#F3ECE9")
    x = 100
    d.text((x, 190), "FRESHBITE", font=F_BRAND(), fill="#0B2545")
    d.text((x, 260), "Wheat Crackers Biscuits", font=F_HEAD(), fill="#10231C")
    d.line([(x, 320), (W - 100, 320)], fill="#C9CFC9", width=2)

    d.text((x, 350), "Mfg Date: 06/2026", font=F_BODY(), fill="#10231C")
    d.text((x, 400), "Net Wt. 100 g", font=F_BODY(), fill="#10231C")
    d.text((x + 380, 400), "MRP Rs. 30.00", font=F_BODY(), fill="#10231C")
    d.text((x + 380, 430), "incl. of all taxes", font=F_SMALL(), fill="#5B6B65")

    d.line([(x, 480), (W - 100, 480)], fill="#C9CFC9", width=2)
    # Intentionally NO manufacturer name/address block — this is the
    # demo's missing-declaration scenario.
    d.text((x, 520), "(manufacturer / packer details not printed on this panel)",
            font=F_SMALL(), fill="#B9B2AC")

    d.line([(x, 600), (W - 100, 600)], fill="#C9CFC9", width=2)
    d.text((x, 630), "For Customer Care queries, please contact us.", font=F_BODY(20), fill="#10231C")

    img = img.filter(ImageFilter.GaussianBlur(2.6))
    img.save(path_front, quality=80)


def generate_needs_review(path_front: str):
    img, d = _label_canvas("#EDEFF3")
    x = 100
    d.text((x, 190), "NUTRIMAX", font=F_BRAND(), fill="#0B2545")
    d.text((x, 260), "Whey Protein Bar - Chocolate Flavour", font=F_HEAD(26), fill="#10231C")
    d.line([(x, 320), (W - 100, 320)], fill="#C9CFC9", width=2)

    d.text((x, 350), "Pkd on 07/2026", font=F_BODY(), fill="#10231C")
    # Net quantity printed small/faint with no "Net Wt." label — the
    # realistic case that trips a low extraction-confidence review.
    d.text((x, 405), "35g", font=F_SMALL(15), fill="#9AA6A0")
    d.text((x + 380, 400), "MRP Rs. 60.00", font=F_BODY(), fill="#10231C")

    d.line([(x, 460), (W - 100, 460)], fill="#C9CFC9", width=2)
    d.text((x, 490), "Manufactured by: Nutrimax Wellness Foods,", font=F_BODY(20), fill="#10231C")
    d.text((x, 520), "Sector 8, Gurugram, Haryana", font=F_BODY(20), fill="#10231C")

    d.line([(x, 580), (W - 100, 580)], fill="#C9CFC9", width=2)
    d.text((x, 610), "customercare@nutrimaxfoods.com", font=F_BODY(20), fill="#10231C")

    img.save(path_front, quality=90)


def ensure_demo_assets(demo_dir: str):
    os.makedirs(demo_dir, exist_ok=True)
    paths = {
        "compliant": os.path.join(demo_dir, "compliant_front.png"),
        "non_compliant": os.path.join(demo_dir, "non_compliant_front.png"),
        "needs_review": os.path.join(demo_dir, "needs_review_front.png"),
    }
    if not os.path.exists(paths["compliant"]):
        generate_compliant(paths["compliant"])
    if not os.path.exists(paths["non_compliant"]):
        generate_non_compliant(paths["non_compliant"])
    if not os.path.exists(paths["needs_review"]):
        generate_needs_review(paths["needs_review"])
    return paths
