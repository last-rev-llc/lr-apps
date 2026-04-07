#!/usr/bin/env python3
"""Generate app card images using Higgsfield API."""

import os
import sys
import csv
import urllib.request
import time
from pathlib import Path

from dotenv import load_dotenv

# Load env from project root
load_dotenv(Path(__file__).parent.parent / '.env.local')
os.environ['HF_API_KEY'] = os.environ['HIGGSFIELDS_API_KEY']
os.environ['HF_API_SECRET'] = os.environ['HIGGSFIELDS_API_SECRET']

from higgsfield_client import subscribe

OUTPUT_DIR = Path(__file__).parent.parent / 'apps' / 'web' / 'public' / 'images' / 'app-cards'
PROMPTS_CSV = OUTPUT_DIR / 'prompts.csv'
MODEL = 'higgsfield-ai/soul/standard'


def generate_image(slug: str, prompt: str) -> str | None:
    """Generate a single app card image. Returns the local file path or None on failure."""
    output_path = OUTPUT_DIR / f'{slug}.png'
    if output_path.exists():
        print(f'  SKIP {slug} (already exists)')
        return str(output_path)

    print(f'  GENERATING {slug}...')
    try:
        result = subscribe(
            MODEL,
            {
                'prompt': prompt,
                'aspect_ratio': '3:2',
                'resolution': '1080p',
            },
            on_queue_update=lambda s: print(f'    [{slug}] {s}'),
        )
        image_url = result['images'][0]['url']
        urllib.request.urlretrieve(image_url, str(output_path))
        print(f'  DONE {slug} -> {output_path}')
        return str(output_path)
    except Exception as e:
        print(f'  FAILED {slug}: {e}')
        return None


def load_prompts(only_slugs: list[str] | None = None) -> list[dict]:
    """Load prompts from CSV, optionally filtering to specific slugs."""
    prompts = []
    with open(PROMPTS_CSV, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if only_slugs is None or row['app_slug'] in only_slugs:
                prompts.append(row)
    return prompts


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Accept optional slug args to generate specific apps
    only_slugs = sys.argv[1:] if len(sys.argv) > 1 else None

    prompts = load_prompts(only_slugs)
    if not prompts:
        print('No prompts matched. Available slugs:')
        for p in load_prompts():
            print(f'  {p["app_slug"]}')
        return

    print(f'Generating {len(prompts)} app card images...\n')
    results = []
    for p in prompts:
        path = generate_image(p['app_slug'], p['prompt'])
        results.append((p['app_slug'], path))
        time.sleep(1)  # Small delay between requests

    print(f'\n--- Results ---')
    success = sum(1 for _, p in results if p)
    print(f'{success}/{len(results)} images generated successfully')
    for slug, path in results:
        status = 'OK' if path else 'FAILED'
        print(f'  [{status}] {slug}')


if __name__ == '__main__':
    main()
