#!/usr/bin/env python3
"""Validate crest and kit coverage, transparency and pair uniqueness."""

from __future__ import annotations

import hashlib
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
EXPECTED = {"italian": 32, "foreign": 32, "national": 61}
KIT_SIZE = {"italian": (420, 540), "foreign": (181, 543), "national": (768, 1024)}


def pngs(path: Path) -> list[Path]:
    return sorted(path.glob("*.png"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    decoded = 0

    for family, expected in EXPECTED.items():
        crest_files = pngs(ASSETS / "crests" / family)
        home_files = pngs(ASSETS / "kits" / family / "home")
        away_files = pngs(ASSETS / "kits" / family / "away")
        groups = {"stemmi": crest_files, "casa": home_files, "trasferta": away_files}

        for label, files in groups.items():
            if len(files) != expected:
                errors.append(f"{family}/{label}: attesi {expected}, trovati {len(files)}")

        crest_names = {path.stem for path in crest_files}
        home_names = {path.stem for path in home_files}
        away_names = {path.stem for path in away_files}
        if crest_names != home_names or home_names != away_names:
            errors.append(f"{family}: stemmi, kit casa e kit trasferta non coprono gli stessi ID")

        for path in crest_files + home_files + away_files:
            try:
                with Image.open(path) as image:
                    image.load()
                    decoded += 1
                    if image.mode != "RGBA":
                        errors.append(f"{path.relative_to(ROOT)}: formato {image.mode}, richiesto RGBA")
                        continue
                    minimum, maximum = image.getchannel("A").getextrema()
                    if minimum != 0 or maximum != 255:
                        errors.append(f"{path.relative_to(ROOT)}: alpha incompleto {minimum}..{maximum}")
                    if path in home_files + away_files and image.size != KIT_SIZE[family]:
                        errors.append(
                            f"{path.relative_to(ROOT)}: dimensione {image.size}, richiesta {KIT_SIZE[family]}"
                        )
            except Exception as exc:  # pragma: no cover - reports corrupt source assets
                errors.append(f"{path.relative_to(ROOT)}: PNG non leggibile ({exc})")

        for home in home_files:
            away = ASSETS / "kits" / family / "away" / home.name
            if away.exists() and digest(home) == digest(away):
                errors.append(f"{family}/{home.name}: casa e trasferta sono identiche")

    if errors:
        print(f"FAIL: {len(errors)} problemi asset")
        for error in errors:
            print(f" - {error}")
        return 1

    total_editions = sum(EXPECTED.values())
    print(
        f"PASS: {decoded} PNG verificati; {total_editions} edizioni; "
        "stemmi + kit casa/trasferta completi, RGBA e senza coppie duplicate."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
