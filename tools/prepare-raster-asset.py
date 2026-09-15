#!/usr/bin/env python3
"""Prepare generated or legacy raster assets for the game.

The script removes either an ImageGen checkerboard or an opaque dark border
background and can then fit the result into the dimensions expected by the
runtime.  It deliberately removes only background components: neutral pixels
inside a white shirt or dark pixels inside a crest remain untouched.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


def components(mask: bytearray, width: int, height: int):
    seen = bytearray(width * height)
    for start, value in enumerate(mask):
        if not value or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        pixels = []
        touches_edge = False
        min_x = max_x = start % width
        min_y = max_y = start // width
        while queue:
            pos = queue.popleft()
            pixels.append(pos)
            x, y = pos % width, pos // width
            touches_edge |= x == 0 or y == 0 or x == width - 1 or y == height - 1
            min_x, max_x = min(min_x, x), max(max_x, x)
            min_y, max_y = min(min_y, y), max(max_y, y)
            if x and mask[pos - 1] and not seen[pos - 1]:
                seen[pos - 1] = 1
                queue.append(pos - 1)
            if x + 1 < width and mask[pos + 1] and not seen[pos + 1]:
                seen[pos + 1] = 1
                queue.append(pos + 1)
            if y and mask[pos - width] and not seen[pos - width]:
                seen[pos - width] = 1
                queue.append(pos - width)
            if y + 1 < height and mask[pos + width] and not seen[pos + width]:
                seen[pos + width] = 1
                queue.append(pos + width)
        yield pixels, touches_edge, (min_x, min_y, max_x, max_y)


def remove_checker(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size
    source = list(rgb.get_flattened_data())
    # Saturated colours and dark ink identify the illustrated object while the
    # generated checker is neutral and bright. Keep its largest connected body.
    ink = bytearray(width * height)
    for pos, (red, green, blue) in enumerate(source):
        value = (red + green + blue) / 3
        ink[pos] = max(red, green, blue) - min(red, green, blue) > 10 or value < 170
    groups = list(components(ink, width, height))
    alpha = bytearray(width * height)
    if groups:
        for pos in max(groups, key=lambda item: len(item[0]))[0]:
            alpha[pos] = 255

    # Fill light areas enclosed by the outline (white shorts, letters, badges).
    # Preserve enclosed checker areas such as the opening between the legs.
    empty = bytearray(value == 0 for value in alpha)
    for pixels, edge, _ in components(empty, width, height):
        if edge:
            continue
        grey = sum(1 for pos in pixels if 185 <= sum(source[pos]) / 3 <= 231)
        light = sum(1 for pos in pixels if sum(source[pos]) / 3 >= 243)
        checker = len(pixels) >= 350 and grey / len(pixels) >= 0.18 and light / len(pixels) >= 0.18
        if not checker:
            for pos in pixels:
                alpha[pos] = 255

    # These sprites intentionally use a dark silhouette behind the legs. Some
    # generated repairs expose the checker there, so restore that shared shape.
    for y in range(round(height * 0.54), round(height * 0.74)):
        progress = (y / height - 0.54) / 0.20
        half_width = width * (0.035 + 0.11 * progress)
        for x in range(max(0, round(width / 2 - half_width)), min(width, round(width / 2 + half_width))):
            pos = y * width + x
            red, green, blue = source[pos]
            neutral = max(red, green, blue) - min(red, green, blue) <= 12
            if neutral and (red + green + blue) / 3 >= 140:
                source[pos] = (0, 0, 0)
                alpha[pos] = 255

    rgb.putdata(source)
    rgba = rgb.convert("RGBA")
    rgba.putalpha(Image.frombytes("L", (width, height), bytes(alpha)))
    return rgba


def remove_dark_border(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    source = list(rgba.get_flattened_data())
    mask = bytearray(width * height)
    for pos, (red, green, blue, old_alpha) in enumerate(source):
        mask[pos] = old_alpha > 0 and max(red, green, blue) <= 42

    alpha = bytearray(pixel[3] for pixel in source)
    for pixels, edge, _ in components(mask, width, height):
        if edge:
            for pos in pixels:
                alpha[pos] = 0
    rgba.putalpha(Image.frombytes("L", (width, height), bytes(alpha)))
    return rgba


def fit(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    if image.size == size:
        return image
    scale = min(target_w / image.width, target_h / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(
        resized,
        ((target_w - resized.width) // 2, (target_h - resized.height) // 2),
    )
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--mode", choices=("checker", "dark", "alpha"), required=True)
    parser.add_argument("--size", metavar="WIDTHxHEIGHT")
    args = parser.parse_args()

    image = Image.open(args.input)
    if args.mode == "checker":
        prepared = remove_checker(image)
    elif args.mode == "dark":
        prepared = remove_dark_border(image)
    else:
        prepared = image.convert("RGBA")
    if args.size:
        width, height = (int(value) for value in args.size.lower().split("x", 1))
        prepared = fit(prepared, (width, height))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    prepared.save(args.output, optimize=True)


if __name__ == "__main__":
    main()
