---
name: higgsfield-images
description: >
  Generate images using the Higgsfield API Python SDK (higgsfield-client). Covers text-to-image generation,
  image editing, model selection, prompt crafting, and file handling. Use this skill whenever the user wants
  to generate an image, create AI art, make a picture, edit an image with AI, or mentions Higgsfield -- even
  casual requests like "make me an image of X", "generate a hero image", "create a banner", or "I need a
  picture for the blog". Also trigger when the user asks about available image models or wants to tweak
  generation parameters like aspect ratio or resolution.
---

# Higgsfield Image Generation

Generate images using the Higgsfield Python SDK (`higgsfield-client`). The SDK is already installed.

## Authentication

API credentials are in the project `.env` file as `HIGGSFIELDS_API_KEY` and `HIGGSFIELDS_API_SECRET`. The SDK reads `HF_API_KEY` and `HF_API_SECRET`, so every script must map them:

```python
import os
from dotenv import load_dotenv
load_dotenv()

# Map project env vars to what the SDK expects
os.environ['HF_API_KEY'] = os.environ['HIGGSFIELDS_API_KEY']
os.environ['HF_API_SECRET'] = os.environ['HIGGSFIELDS_API_SECRET']
```

After this, the SDK picks up credentials automatically. No need to pass them to any function.

## How the API Works

Higgsfield is async/queue-based. You submit a request, get a `request_id`, and wait for it to complete. The SDK's `subscribe()` function handles this automatically -- it submits and blocks until the result is ready.

**Request lifecycle:** `queued` → `in_progress` → `completed` / `failed` / `nsfw`

Failed and NSFW results get credits refunded automatically.

## SDK API

The module is `higgsfield_client` (not `higgsfield`). Key functions:

- `subscribe(application, arguments)` — submit and wait for result (blocking)
- `submit(application, arguments)` — submit and get back a request controller
- `upload_file(path)` — upload a local file, returns a URL
- `upload(data, content_type)` — upload raw bytes
- `upload_image(pil_image, format)` — upload a PIL Image

The `application` parameter is the model ID string. The `arguments` parameter is a dict of generation parameters.

## Image Models

| Model ID | What it does | Best for |
|----------|-------------|----------|
| `higgsfield-ai/soul/standard` | Text-to-image | General purpose image generation |
| `reve/text-to-image` | Text-to-image | Alternative style/aesthetic |
| `bytedance/seedream/v4/edit` | Image editing | Modifying existing images with prompts |

When in doubt, default to `higgsfield-ai/soul/standard`. The full model catalog is at `cloud.higgsfield.ai/explore`.

## Generating an Image

Write a Python script and run it. Here's the working pattern:

```python
import os
from dotenv import load_dotenv
load_dotenv()
os.environ['HF_API_KEY'] = os.environ['HIGGSFIELDS_API_KEY']
os.environ['HF_API_SECRET'] = os.environ['HIGGSFIELDS_API_SECRET']

from higgsfield_client import subscribe

result = subscribe(
    'higgsfield-ai/soul/standard',
    {
        'prompt': 'a photorealistic coastal sunset with dramatic orange clouds reflecting on wet sand',
        'aspect_ratio': '16:9',
        'resolution': '1080p'
    },
    on_queue_update=lambda s: print(f'Status: {s}')
)

# result is a dict with 'images' list, each containing a 'url'
image_url = result['images'][0]['url']
print(image_url)
```

### Key Parameters (passed in the arguments dict)

- **`prompt`** (required) — The text description. Be specific about style, mood, colors, composition, lighting.
- **`aspect_ratio`** — e.g., `"1:1"`, `"16:9"`, `"9:16"`, `"4:3"`. Pick based on where the image will be used.
- **`resolution`** — e.g., `"720p"`, `"1080p"`. Higher = more credits.

### Downloading the Result

The API returns a URL in `result['images'][0]['url']`. Download it:

```python
import urllib.request
urllib.request.urlretrieve(image_url, "output.png")
```

## Image Editing

For editing an existing image, upload it first, then use the edit model:

```python
from higgsfield_client import subscribe, upload_file

# Upload the source image
uploaded_url = upload_file("source_image.png")

# Edit it
result = subscribe(
    'bytedance/seedream/v4/edit',
    {
        'prompt': 'change the sky to a dramatic sunset',
        'image_url': uploaded_url
    }
)
```

## Alternative: Submit + Poll

If you need progress updates or want more control, use `SyncClient`:

```python
from higgsfield_client import SyncClient

client = SyncClient()
controller = client.submit(
    'higgsfield-ai/soul/standard',
    {
        'prompt': 'a minimalist logo of a mountain range in blue ink',
        'aspect_ratio': '1:1'
    }
)

# Poll until done
import time
while True:
    status_obj = controller.status()
    print(f'Status: {status_obj}')
    if status_obj.status in ('completed', 'failed', 'nsfw'):
        break
    time.sleep(2)

result = controller.result()
```

## Prompt Crafting Tips

Good prompts are specific. Include:
- **Subject** — what's in the image
- **Style** — photorealistic, illustration, watercolor, minimal, etc.
- **Mood/lighting** — dramatic, soft, golden hour, neon, etc.
- **Composition** — close-up, wide shot, bird's eye, centered, etc.
- **Colors** — specific palette or dominant colors

For detailed prompt crafting guidance (anti-stock-photo techniques, design system color matching, lighting descriptions), use the `image-prompt-craft` skill.

## Common Aspect Ratios

| Use case | Ratio | Why |
|----------|-------|-----|
| Blog hero image | `16:9` | Standard widescreen banner |
| Social media post | `1:1` | Square, works everywhere |
| Phone wallpaper / Story | `9:16` | Tall portrait |
| Thumbnail | `4:3` | Classic photo ratio |
| Open Graph image | `16:9` | 1200x630 standard |

## Error Handling

Wrap generation in try/except. Common failure modes:
- **NSFW detection** — the API blocks content it flags. Rephrase the prompt.
- **Timeout** — long queue times. The `subscribe()` call will wait, but if it takes too long, use submit + poll with a timeout.
- **Invalid model** — double-check the model ID string.

```python
try:
    result = subscribe('higgsfield-ai/soul/standard', {'prompt': '...', 'aspect_ratio': '16:9'})
except Exception as e:
    print(f"Generation failed: {e}")
```

## Saving to the Project

When generating images for the Last Rev marketing site:
- Blog hero images go in `blog/images/` with descriptive names: `hero-agentic-coding-tools.png`
- Update the blog post's JSON data file: set `"promoImage": "images/hero-filename.png"`
- Prefer `16:9` for hero banners, `1:1` for thumbnails

## Alt Text & Accessibility (Required)

Every generated image MUST have alt text before it's considered done. This is required for ADA/WCAG compliance and SEO.

**When saving to the project:**
- Set `imageAlt` in the blog JSON data file (under 125 chars, descriptive of what the image depicts)
- Add `image-alt="..."` to the `<cc-blog>`, `<cc-hero>`, or `<cc-card>` element in the HTML
- For inline `<img>` tags, set the `alt` attribute directly

**Alt text rules:**
- Describe what the image shows, not just the page topic ("Geometric network diagram with interconnected nodes" not "AI agents blog post image")
- Under 125 characters
- Don't start with "Image of" or "Picture of"
- Include key visual elements: composition, colors, objects, mood
- If the image is purely decorative with no informational content, use `alt=""` -- but this is rare for generated hero images
