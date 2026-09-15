#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera gli stemmi nazionali mancanti nello stesso stile "patch ricamata con
bordo oro" dei 4 già esistenti (brazil_2002, france_1998, germany_1990,
italy_2006), al posto del segnaposto piatto "sigla + banda diagonale".
Non tocca i 4 file già buoni.
"""
import math, os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'assets', 'crests', 'national')
SS = 4                      # supersampling factor
SIZE = 480 * SS             # working canvas
FINAL = 480

def first_font(*paths):
    for path in paths:
        if os.path.isfile(path):
            return path
    raise FileNotFoundError('Nessun font di sistema compatibile trovato')


FONT_BOLD = first_font(
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Verdana Bold.ttf",
)
FONT_SERIF_BOLD = first_font(
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
)

GOOD = {'brazil_2002', 'france_1998', 'germany_1990', 'italy_2006'}

# ---------------------------------------------------------------- geometry --

def catmull_rom(points, n_out, closed=True):
    pts = points[:]
    if closed:
        ext = [pts[-1]] + pts + [pts[0], pts[1]]
    else:
        ext = [pts[0]] + pts + [pts[-1]]
    out = []
    segs = len(pts) if closed else len(pts) - 1
    per_seg = max(2, n_out // segs)
    for i in range(segs):
        p0, p1, p2, p3 = ext[i], ext[i + 1], ext[i + 2], ext[i + 3]
        for j in range(per_seg):
            t = j / per_seg
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t +
                       (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                       (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t +
                       (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                       (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    return out

# Sagoma a scudo appuntito (spalle arrotondate, punta in basso), in coordinate
# normalizzate 0..1 dentro il proprio riquadro.
SHIELD_KEY = [
    (0.50, 0.015), (0.72, 0.05), (0.90, 0.14), (0.985, 0.27),
    (0.97, 0.47), (0.88, 0.68), (0.72, 0.85), (0.50, 0.99),
    (0.28, 0.85), (0.12, 0.68), (0.03, 0.47), (0.015, 0.27),
    (0.10, 0.14), (0.28, 0.05),
]

def shield_points(box, n=240):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    key = [(x0 + kx * w, y0 + ky * h) for kx, ky in SHIELD_KEY]
    return catmull_rom(key, n, closed=True)

def scale_points(points, factor, center):
    cx, cy = center
    return [(cx + (x - cx) * factor, cy + (y - cy) * factor) for x, y in points]

def centroid(points):
    n = len(points)
    return (sum(p[0] for p in points) / n, sum(p[1] for p in points) / n)

# -------------------------------------------------------------- flag fills --

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def fill_h(img, colors, ratios=None):
    w, h = img.size
    d = ImageDraw.Draw(img)
    n = len(colors)
    ratios = ratios or [1] * n
    total = sum(ratios)
    y = 0
    for c, r in zip(colors, ratios):
        band = h * r / total
        d.rectangle([0, y, w, y + band + 1], fill=hexc(c))
        y += band

def fill_v(img, colors, ratios=None):
    w, h = img.size
    d = ImageDraw.Draw(img)
    n = len(colors)
    ratios = ratios or [1] * n
    total = sum(ratios)
    x = 0
    for c, r in zip(colors, ratios):
        band = w * r / total
        d.rectangle([x, 0, x + band + 1, h], fill=hexc(c))
        x += band

def fill_cross_nordic(img, bg, fg):
    w, h = img.size
    img.paste(hexc(bg), [0, 0, w, h])
    d = ImageDraw.Draw(img)
    bar = h * 0.22
    cx = w * 0.36
    d.rectangle([0, h / 2 - bar / 2, w, h / 2 + bar / 2], fill=hexc(fg))
    d.rectangle([cx - bar / 2, 0, cx + bar / 2, h], fill=hexc(fg))

def fill_cross_plain(img, bg, fg):
    w, h = img.size
    img.paste(hexc(bg), [0, 0, w, h])
    d = ImageDraw.Draw(img)
    bar = h * 0.26
    d.rectangle([0, h / 2 - bar / 2, w, h / 2 + bar / 2], fill=hexc(fg))
    d.rectangle([w / 2 - bar / 2, 0, w / 2 + bar / 2, h], fill=hexc(fg))

def fill_saltire(img, bg, fg):
    w, h = img.size
    img.paste(hexc(bg), [0, 0, w, h])
    d = ImageDraw.Draw(img)
    lw = h * 0.16
    for (x0, y0, x1, y1) in [(0, 0, w, h), (0, h, w, 0)]:
        ang = math.atan2(y1 - y0, x1 - x0)
        dx, dy = math.sin(ang) * lw / 2, -math.cos(ang) * lw / 2
        d.polygon([(x0 + dx, y0 + dy), (x1 + dx, y1 + dy),
                   (x1 - dx, y1 - dy), (x0 - dx, y0 - dy)], fill=hexc(fg))

def fill_canton(img, canton_frac, color, draw_extra=None):
    w, h = img.size
    d = ImageDraw.Draw(img)
    cw, ch = w * canton_frac[0], h * canton_frac[1]
    d.rectangle([0, 0, cw, ch], fill=hexc(color))
    if draw_extra:
        draw_extra(d, (0, 0, cw, ch))

def star(d, cx, cy, r, color, rot=-math.pi / 2, points=5):
    pts = []
    for i in range(points * 2):
        rad = r if i % 2 == 0 else r * 0.4
        a = rot + i * math.pi / points
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    d.polygon(pts, fill=color)

def fill_circle_disc(img, bg, fg, r_frac=0.3):
    w, h = img.size
    img.paste(hexc(bg), [0, 0, w, h])
    d = ImageDraw.Draw(img)
    r = min(w, h) * r_frac
    d.ellipse([w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r], fill=hexc(fg))

def fill_wedge(img, top, bottom, wedge):
    w, h = img.size
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, h / 2], fill=hexc(top))
    d.rectangle([0, h / 2, w, h], fill=hexc(bottom))
    d.polygon([(0, 0), (w * 0.5, h / 2), (0, h)], fill=hexc(wedge))

def fill_korea(img):
    w, h = img.size
    img.paste((255, 255, 255), [0, 0, w, h])
    d = ImageDraw.Draw(img)
    r = min(w, h) * 0.26
    cx, cy = w / 2, h / 2
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=hexc('#CD2E3A'))
    d.pieslice([cx - r, cy - r, cx + r, cy + r], 90, 270, fill=hexc('#0047A0'))
    for s, yy in ((hexc('#CD2E3A'), cy - r / 2), (hexc('#0047A0'), cy + r / 2)):
        d.ellipse([cx - r / 2, yy - r / 2, cx + r / 2, yy + r / 2], fill=s)

def fill_turkey(img):
    w, h = img.size
    img.paste(hexc('#E30A17'), [0, 0, w, h])
    d = ImageDraw.Draw(img)
    r = h * 0.22
    cx, cy = w * 0.46, h * 0.5
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255))
    d.ellipse([cx - r + r * 0.34, cy - r, cx + r + r * 0.34, cy + r], fill=hexc('#E30A17'))
    star(d, cx + r * 1.55, cy, r * 0.32, (255, 255, 255))

def fill_australia(img):
    w, h = img.size
    img.paste(hexc('#00247D'), [0, 0, w, h])
    d = ImageDraw.Draw(img)
    rnd = random.Random(7)
    for _ in range(10):
        star(d, rnd.uniform(w * 0.15, w * 0.9), rnd.uniform(h * 0.15, h * 0.9),
             h * 0.045, (255, 255, 255), rot=rnd.uniform(0, math.pi))

def fill_southafrica(img):
    fill_h(img, ['#DE3831', '#FFFFFF', '#007A4D', '#FFFFFF', '#001489'], [1, .3, 1.4, .3, 1])
    w, h = img.size
    d = ImageDraw.Draw(img)
    d.polygon([(0, 0), (w * 0.42, h / 2), (0, h)], fill=hexc('#FFB612'))
    d.polygon([(0, h * 0.1), (w * 0.34, h / 2), (0, h * 0.9)], fill=(0, 0, 0))

def fill_greece(img):
    fill_h(img, ['#0D5EAF', '#FFFFFF'] * 4 + ['#0D5EAF'])
    w, h = img.size
    cw, ch = w * 0.42, h * 0.42
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, cw, ch], fill=hexc('#0D5EAF'))
    bar = ch * 0.22
    d.rectangle([0, ch / 2 - bar / 2, cw, ch / 2 + bar / 2], fill=(255, 255, 255))
    d.rectangle([cw / 2 - bar / 2, 0, cw / 2 + bar / 2, ch], fill=(255, 255, 255))

def fill_chile(img):
    w, h = img.size
    fill_h(img, ['#FFFFFF', '#D52B1E'])
    cw, ch = w * 0.4, h * 0.5
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, cw, ch], fill=hexc('#0039A6'))
    star(d, cw / 2, ch / 2, min(cw, ch) * 0.32, (255, 255, 255))

def fill_usa(img):
    fill_h(img, ['#B22234', '#FFFFFF'] * 3 + ['#B22234'])
    w, h = img.size
    d = ImageDraw.Draw(img)
    cw, ch = w * 0.46, h * 0.5
    d.rectangle([0, 0, cw, ch], fill=hexc('#3C3B6E'))
    rnd = random.Random(3)
    for _ in range(9):
        star(d, rnd.uniform(cw * 0.12, cw * 0.88), rnd.uniform(ch * 0.15, ch * 0.85),
             ch * 0.07, (255, 255, 255))

def fill_saudi(img):
    w, h = img.size
    img.paste(hexc('#006C35'), [0, 0, w, h])
    d = ImageDraw.Draw(img)
    d.rectangle([w * 0.14, h * 0.62, w * 0.86, h * 0.7], fill=(255, 255, 255))

def fill_morocco(img):
    w, h = img.size
    img.paste(hexc('#C1272D'), [0, 0, w, h])
    d = ImageDraw.Draw(img)
    star(d, w / 2, h / 2, h * 0.2, hexc('#006233'), points=5)

def fill_japan(img):
    fill_circle_disc(img, '#FFFFFF', '#BC002D', 0.24)

def fill_uruguay(img):
    fill_h(img, ['#FFFFFF', '#0038A8'] * 3 + ['#FFFFFF'])
    w, h = img.size
    d = ImageDraw.Draw(img)
    cw, ch = w * 0.34, h * 0.34
    d.rectangle([0, 0, cw, ch], fill=(255, 255, 255))
    d.ellipse([cw * 0.3, ch * 0.3, cw * 0.7, ch * 0.7], fill=hexc('#FCD116'))

def fill_brazil_alt(img):
    w, h = img.size
    img.paste(hexc('#009739'), [0, 0, w, h])
    d = ImageDraw.Draw(img)
    d.polygon([(w * 0.5, h * 0.08), (w * 0.94, h * 0.5), (w * 0.5, h * 0.92), (w * 0.06, h * 0.5)],
              fill=hexc('#FEDD00'))
    r = h * 0.24
    d.ellipse([w / 2 - r, h / 2 - r, w / 2 + r, h / 2 + r], fill=hexc('#002776'))

FLAGS = {
    'argentina': lambda im: fill_h(im, ['#74ACDF', '#FFFFFF', '#74ACDF']),
    'australia': fill_australia,
    'austria': lambda im: fill_h(im, ['#ED2939', '#FFFFFF', '#ED2939']),
    'belgium': lambda im: fill_v(im, ['#000000', '#FAE042', '#ED2939']),
    'brazil': fill_brazil_alt,
    'bulgaria': lambda im: fill_h(im, ['#FFFFFF', '#00966E', '#D62612']),
    'cameroon': lambda im: fill_v(im, ['#007A5E', '#CE1126', '#FCD116']),
    'chile': fill_chile,
    'colombia': lambda im: fill_h(im, ['#FCD116', '#003893', '#CE1126'], [2, 1, 1]),
    'costarica': lambda im: fill_h(im, ['#002B7F', '#FFFFFF', '#CE1126', '#FFFFFF', '#002B7F'], [1, 1, 2, 1, 1]),
    'croatia': lambda im: fill_h(im, ['#FF0000', '#FFFFFF', '#171796']),
    'czech': lambda im: fill_wedge(im, '#FFFFFF', '#D7141A', '#11457E'),
    'denmark': lambda im: fill_cross_nordic(im, '#C60C30', '#FFFFFF'),
    'england': lambda im: fill_cross_plain(im, '#FFFFFF', '#CE1124'),
    'france': lambda im: fill_v(im, ['#0055A4', '#FFFFFF', '#EF4135']),
    'germany': lambda im: fill_h(im, ['#000000', '#DD0000', '#FFCC00']),
    'ghana': lambda im: fill_h(im, ['#CE1126', '#FCD116', '#006B3F']),
    'greece': fill_greece,
    'ireland': lambda im: fill_v(im, ['#169B62', '#FFFFFF', '#FF883E']),
    'italy': lambda im: fill_v(im, ['#008C45', '#F4F5F0', '#CD212A']),
    'ivory': lambda im: fill_v(im, ['#F77F00', '#FFFFFF', '#009E60']),
    'japan': fill_japan,
    'korea': fill_korea,
    'mexico': lambda im: fill_v(im, ['#006341', '#FFFFFF', '#CE1126']),
    'morocco': fill_morocco,
    'netherlands': lambda im: fill_h(im, ['#AE1C28', '#FFFFFF', '#21468B']),
    'nigeria': lambda im: fill_v(im, ['#008751', '#FFFFFF', '#008751']),
    'norway': lambda im: fill_cross_nordic(im, '#EF2B2D', '#002868'),
    'paraguay': lambda im: fill_h(im, ['#D52B1E', '#FFFFFF', '#0038A8']),
    'poland': lambda im: fill_h(im, ['#FFFFFF', '#DC143C']),
    'portugal': lambda im: fill_v(im, ['#046A38', '#FF0000'], [2, 3]),
    'romania': lambda im: fill_v(im, ['#002B7F', '#FCD116', '#CE1126']),
    'russia': lambda im: fill_h(im, ['#FFFFFF', '#0039A6', '#D52B1E']),
    'saudi': fill_saudi,
    'scotland': lambda im: fill_saltire(im, '#0065BD', '#FFFFFF'),
    'senegal': lambda im: fill_v(im, ['#00853F', '#FDEF42', '#E31B23']),
    'southafrica': fill_southafrica,
    'spain': lambda im: fill_h(im, ['#AA151B', '#F1BF00', '#AA151B'], [1, 2, 1]),
    'sweden': lambda im: fill_cross_nordic(im, '#006AA7', '#FECC00'),
    'switzerland': lambda im: fill_cross_plain(im, '#D52B1E', '#FFFFFF'),
    'turkey': fill_turkey,
    'uruguay': fill_uruguay,
    'usa': fill_usa,
    'yugoslavia': lambda im: fill_h(im, ['#0000FF', '#FFFFFF', '#FF0000']),
}

NAMES_IT = {
    'argentina': 'ARGENTINA', 'australia': 'AUSTRALIA', 'austria': 'AUSTRIA',
    'belgium': 'BELGIO', 'brazil': 'BRASILE', 'bulgaria': 'BULGARIA',
    'cameroon': 'CAMERUN', 'chile': 'CILE', 'colombia': 'COLOMBIA',
    'costarica': 'COSTA RICA', 'croatia': 'CROAZIA', 'czech': 'REP. CECA',
    'denmark': 'DANIMARCA', 'england': 'INGHILTERRA', 'france': 'FRANCIA',
    'germany': 'GERMANIA', 'ghana': 'GHANA', 'greece': 'GRECIA',
    'ireland': 'IRLANDA', 'italy': 'ITALIA', 'ivory': "COSTA D'AVORIO",
    'japan': 'GIAPPONE', 'korea': 'COREA DEL SUD', 'mexico': 'MESSICO',
    'morocco': 'MAROCCO', 'netherlands': 'OLANDA', 'nigeria': 'NIGERIA',
    'norway': 'NORVEGIA', 'paraguay': 'PARAGUAY', 'poland': 'POLONIA',
    'portugal': 'PORTOGALLO', 'romania': 'ROMANIA', 'russia': 'RUSSIA',
    'saudi': 'ARABIA SAUDITA', 'scotland': 'SCOZIA', 'senegal': 'SENEGAL',
    'southafrica': 'SUDAFRICA', 'spain': 'SPAGNA', 'sweden': 'SVEZIA',
    'switzerland': 'SVIZZERA', 'turkey': 'TURCHIA', 'uruguay': 'URUGUAY',
    'usa': 'USA', 'yugoslavia': 'JUGOSLAVIA',
}

CODES = {
    'argentina': 'AFA', 'australia': 'AUS', 'austria': 'ÖFB', 'belgium': 'BEL',
    'brazil': 'CBF', 'bulgaria': 'BFS', 'cameroon': 'CMR', 'chile': 'CHI',
    'colombia': 'COL', 'costarica': 'CRC', 'croatia': 'HNS', 'czech': 'ČR',
    'denmark': 'DBU', 'england': 'ENG', 'france': 'FFF', 'germany': 'DFB',
    'ghana': 'GFA', 'greece': 'ΕΠΟ', 'ireland': 'FAI', 'italy': 'FIGC',
    'ivory': 'CIV', 'japan': 'JFA', 'korea': 'KFA', 'mexico': 'FMF',
    'morocco': 'FRMF', 'netherlands': 'KNVB', 'nigeria': 'NFF', 'norway': 'NFF',
    'paraguay': 'APF', 'poland': 'PZPN', 'portugal': 'FPF', 'romania': 'FRF',
    'russia': 'RFS', 'saudi': 'SAFF', 'scotland': 'SFA', 'senegal': 'FSF',
    'southafrica': 'SAFA', 'spain': 'RFEF', 'sweden': 'SVFF',
    'switzerland': 'ASF', 'turkey': 'TFF', 'uruguay': 'AUF', 'usa': 'USSF',
    'yugoslavia': 'FSJ',
}

# ------------------------------------------------------------------ render --

def font_fit(path, text, max_w, start=64, min_size=18):
    size = start
    while size > min_size:
        f = ImageFont.truetype(path, size)
        bbox = f.getbbox(text)
        if bbox[2] - bbox[0] <= max_w:
            return f
        size -= 2
    return ImageFont.truetype(path, min_size)

def render_crest(country, year):
    W = H = SIZE
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    pad = W * 0.05
    box = (pad, pad, W - pad, H - pad * 0.94)
    base_pts = shield_points(box)
    c = centroid(base_pts)

    shadow_pts = [(x + W * 0.012, y + W * 0.016) for x, y in scale_points(base_pts, 1.04, c)]
    outer_pts = scale_points(base_pts, 1.045, c)
    bevel_pts = scale_points(base_pts, 1.0, c)
    field_pts = scale_points(base_pts, 0.955, c)

    shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow_layer).polygon(shadow_pts, fill=(0, 0, 0, 130))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(W * 0.012))
    img = Image.alpha_composite(img, shadow_layer)

    d = ImageDraw.Draw(img)
    d.polygon(outer_pts, fill=(20, 16, 8, 255))
    gold_top, gold_bot = hexc('#f4dd97'), hexc('#a9812f')
    gold_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gold_layer)
    for yy in range(int(box[1]), int(box[3])):
        t = (yy - box[1]) / (box[3] - box[1])
        gd.line([(0, yy), (W, yy)], fill=lerp(gold_top, gold_bot, t) + (255,))
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).polygon(scale_points(base_pts, 1.03, c), fill=255)
    img.paste(gold_layer, (0, 0), mask)

    d = ImageDraw.Draw(img)
    d.polygon(bevel_pts, fill=hexc('#f3ecd8') + (255,))

    field_img = Image.new('RGB', (W, H), (255, 255, 255))
    FLAGS[country](field_img)
    fmask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(fmask).polygon(field_pts, fill=255)
    img.paste(field_img.convert('RGBA'), (0, 0), fmask)

    shade = Image.new('L', (W, H), 0)
    sd = ImageDraw.Draw(shade)
    for yy in range(int(box[1]), int(box[3])):
        t = (yy - box[1]) / (box[3] - box[1])
        v = int(70 * (1 - t) * 0.5)
        sd.line([(0, yy), (W, yy)], fill=v)
    shade_layer = Image.new('RGBA', (W, H), (255, 255, 255, 0))
    shade_layer.putalpha(shade)
    fmask2 = Image.new('L', (W, H), 0)
    ImageDraw.Draw(fmask2).polygon(field_pts, fill=90)
    shade_layer.putalpha(ImageChops.multiply(shade, fmask2))
    img = Image.alpha_composite(img, shade_layer)

    # Fine diagonal thread lines give the flag field the same embroidered
    # material language as the four bespoke crests.
    weave = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    wd = ImageDraw.Draw(weave)
    step = max(8, int(W * 0.009))
    for offset in range(-H, W, step):
        wd.line([(offset, 0), (offset + H, H)], fill=(255, 255, 255, 22), width=max(1, SS))
        wd.line([(offset + step // 2, 0), (offset + H + step // 2, H)],
                fill=(8, 12, 24, 16), width=max(1, SS))
    weave.putalpha(ImageChops.multiply(weave.getchannel('A'), fmask))
    img = Image.alpha_composite(img, weave)

    # Federation medallion: a smaller inset shield and a strong national code
    # fill the formerly empty centre while keeping each flag recognisable.
    d = ImageDraw.Draw(img)
    med_box = (W * 0.29, H * 0.28, W * 0.71, H * 0.70)
    med_pts = shield_points(med_box, n=180)
    med_center = centroid(med_pts)
    med_shadow = [(x + W * 0.008, y + W * 0.011) for x, y in med_pts]
    d.polygon(med_shadow, fill=(0, 0, 0, 105))
    d.polygon(scale_points(med_pts, 1.055, med_center), fill=hexc('#f2d47c') + (255,))
    d.polygon(scale_points(med_pts, 1.015, med_center), fill=hexc('#121b38') + (255,))
    d.polygon(scale_points(med_pts, 0.90, med_center), fill=hexc('#173b78') + (245,))
    d.line(med_pts + [med_pts[0]], fill=hexc('#fff0b1') + (255,), width=int(W * 0.006))

    code = CODES.get(country, country[:3].upper())
    cf = font_fit(FONT_SERIF_BOLD, code, W * 0.32, start=int(W * 0.13), min_size=int(W * 0.07))
    cb = cf.getbbox(code)
    ctw, cth = cb[2] - cb[0], cb[3] - cb[1]
    code_y = H * 0.47
    d.text((W / 2 - ctw / 2 - cb[0] + W * 0.003, code_y - cth / 2 - cb[1] + W * 0.004),
           code, font=cf, fill=(0, 0, 0, 105))
    d.text((W / 2 - ctw / 2 - cb[0], code_y - cth / 2 - cb[1]), code,
           font=cf, fill=hexc('#f9e8aa') + (255,), stroke_width=int(W * 0.002),
           stroke_fill=hexc('#8b6421') + (255,))
    for x in (W * 0.40, W * 0.50, W * 0.60):
        star(d, x, H * 0.61, W * 0.023, hexc('#f3d166'))

    d = ImageDraw.Draw(img)
    name = NAMES_IT[country]
    band_w = (field_pts and (max(p[0] for p in field_pts) - min(p[0] for p in field_pts))) * 0.86
    f = font_fit(FONT_BOLD, name, band_w, start=int(W * 0.075), min_size=int(W * 0.028))
    bbox = f.getbbox(name)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    band_cx = c[0]
    band_cy = box[1] + (box[3] - box[1]) * 0.155
    pad_y = th * 0.55
    d.rectangle([band_cx - tw / 2 - th * 0.6, band_cy - th / 2 - pad_y * 0.5,
                 band_cx + tw / 2 + th * 0.6, band_cy + th / 2 + pad_y * 0.5],
                fill=(10, 10, 10, 225))
    d.text((band_cx - tw / 2 - bbox[0], band_cy - th / 2 - bbox[1] - pad_y * 0.08),
           name, font=f, fill=(255, 255, 255, 255))

    ribbon_cy = box[3] - (box[3] - box[1]) * 0.055
    ribbon_w = (box[2] - box[0]) * 0.62
    ribbon_h = (box[3] - box[1]) * 0.1
    rx0, rx1 = c[0] - ribbon_w / 2, c[0] + ribbon_w / 2
    ry0, ry1 = ribbon_cy - ribbon_h / 2, ribbon_cy + ribbon_h / 2
    notch = ribbon_h * 0.5
    d.polygon([(rx0, ry0), (rx1, ry0), (rx1, ry1), (rx0, ry1)], fill=hexc('#f3ecd8') + (255,))
    d.polygon([(rx0 - notch, ry0 + notch * 0.4), (rx0, ry0), (rx0, ry1), (rx0 - notch, ry1 - notch * 0.4)],
              fill=hexc('#cdbb84') + (255,))
    d.polygon([(rx1 + notch, ry0 + notch * 0.4), (rx1, ry0), (rx1, ry1), (rx1 + notch, ry1 - notch * 0.4)],
              fill=hexc('#cdbb84') + (255,))
    d.rectangle([rx0, ry0, rx1, ry1], outline=hexc('#8a6f2e') + (255,), width=int(W * 0.004))
    yf = font_fit(FONT_SERIF_BOLD, year, ribbon_w * 0.7, start=int(W * 0.065), min_size=int(W * 0.03))
    ybbox = yf.getbbox(year)
    ytw, yth = ybbox[2] - ybbox[0], ybbox[3] - ybbox[1]
    d.text((c[0] - ytw / 2 - ybbox[0], ribbon_cy - yth / 2 - ybbox[1]), year, font=yf,
           fill=hexc('#1a2340') + (255,))

    d.line(bevel_pts + [bevel_pts[0]], fill=(30, 24, 10, 200), width=int(W * 0.0035))

    return img.resize((FINAL, FINAL), Image.LANCZOS)

def main():
    made = 0
    for fname in sorted(os.listdir(OUT_DIR)):
        if not fname.endswith('.png'):
            continue
        stem = fname[:-4]
        if stem in GOOD:
            continue
        country, year = stem.rsplit('_', 1)
        if country not in FLAGS:
            print('SKIP (no flag def):', stem)
            continue
        out = render_crest(country, year)
        out.save(os.path.join(OUT_DIR, fname), 'PNG', optimize=True)
        made += 1
    print('generated', made)

if __name__ == '__main__':
    main()
