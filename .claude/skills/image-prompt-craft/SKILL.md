---
name: image-prompt-craft
description: >
  Craft high-quality image generation prompts for AI models like Higgsfield Soul 2.0, Midjourney, Flux, or DALL-E.
  Produces prompts that feel cinematic, candid, and editorial -- never stock-photo-ish. Extracts design system
  colors and aesthetics from the codebase to ensure visual consistency. Use this skill whenever the user wants to
  write image prompts, brainstorm hero images, plan visual content for a site, create a prompt CSV/batch, or asks
  for help describing what an image should look like for AI generation -- even casual requests like "what should
  the hero image look like" or "write me a prompt for an image of X". Also trigger when the higgsfield-images
  skill needs a well-crafted prompt before generating. Do NOT use for actually generating images (use
  higgsfield-images for that).
---

# Image Prompt Craft

Write prompts for AI image generation that produce cinematic, authentic, editorial-quality images -- not stock photos.

This skill is about the *writing* of prompts, not the generation. It can feed into the `higgsfield-images` skill or any other image generation tool.

## The Core Problem

AI image models default to stock-photo aesthetics: perfect lighting, forced smiles, sterile environments, generic poses. The goal of this skill is to write prompts that break through that and produce images that feel like they were shot by a documentary photographer or pulled from an editorial magazine spread.

## Step 1: Extract the Design System

Before writing any prompts, read the project's CSS to extract the actual visual identity. This matters because the generated images need to feel like they belong on the site, not like generic AI art dropped onto a page.

**What to extract:**
- Background colors (e.g., the deep black of the page body)
- Accent/brand colors (primary, secondary, tertiary)
- Surface/card colors and treatments (glass effects, border styles)
- Typography style (serif vs. sans-serif, what font families)
- Overall mood (dark mode vs. light, minimal vs. busy)

**For this project (Last Rev marketing site):**
- Background: deep black `#08080f`
- Primary accent: amber `#f59e0b` (gradient to `#fbbf24`)
- Secondary accents: violet `#8b5cf6`, green `#22c55e` / `#10b981`, blue `#3b82f6`, pink `#ec4899`
- Card/surface color: dark slate `#1e293b`
- Text: off-white `#e2e8f0`, muted `#94a3b8`
- Mood: premium dark tech, minimal, atmospheric

**How to use colors in prompts:**
- Hex codes work well for color direction -- include them inline (e.g., "warm amber #f59e0b light")
- Do NOT use CSS notation in prompts. No `rgba()`, `box-shadow`, `border-radius`, or opacity percentages -- image models interpret these as visual text to render, not as styling instructions
- Translate design tokens into photographic language: a `box-shadow glow` becomes "a warm amber halo", a `backdrop-filter: blur` becomes "frosted glass"

## Step 2: Kill the Stock Photo

Stock photos have recognizable tells. Avoid every one of these:

### Poses to Avoid
- Looking directly at camera with a big smile
- Arms crossed "confident professional" stance
- Generic presenting gesture (hands open, palms up)
- Shaking hands
- Pointing at a whiteboard/screen while smiling at camera
- Group of people looking at laptop and smiling
- Standing in a row

### What to Do Instead -- Candid Moments
The image should feel like a photographer was embedded in someone's life and caught a real moment:

- **Mid-action, not posed**: typing, mid-sip of coffee, drawing on a whiteboard with their back partly turned, looking up from a screen mid-thought
- **Mid-conversation, not presenting**: explaining something to someone off-frame, looking just past camera, mouth slightly open mid-sentence
- **Natural expressions**: slight smirk of satisfaction, eyebrow raised, caught mid-laugh, absorbed concentration, thoughtful gaze off-camera
- **Imperfect details that signal "real"**: pushed-up sleeves, slightly messy hair, a half-drunk coffee, phone face-down on desk, tangled charger cable, scattered sticky notes, a single AirPod, a notebook with scribbled notes

### Device Interaction
When a computer/device appears in the image:
- **Typing**: hands on keyboard, looking at the screen, properly engaged
- **Showing the screen**: holding laptop or turning monitor, angled so viewer can see what's on screen
- **Never**: hovering hands near a keyboard, gesturing vaguely at a screen, or holding a laptop like a serving tray

## Step 3: Describe Screen Content Explicitly

AI image models can render recognizable UI layouts if you describe them as visual compositions, not abstract concepts.

**Don't say:** "a dashboard" or "a website"

**Do say:** "a dark navigation bar across the top with a logo on the left and menu items 'Home' 'About' 'Services' 'Contact', below it a large hero section with a bold headline, a subtitle in lighter gray, and a bright amber call-to-action button, below that a row of three content cards each with a thumbnail image, a title, and a short description"

**Key principles:**
- Describe the visual layout spatially: "across the top", "below it", "on the left", "in a row"
- Name specific UI elements: "navigation bar", "hero section", "content cards", "input fields", "submit button"
- Include specific text where it helps: menu items, button labels, headline text
- Describe charts/data visually: "a line graph trending upward", "horizontal bars in amber, violet, and green at varying lengths", "a donut chart"
- For icons, name the shape: "a lightning bolt icon", "a gear icon", "a brain icon"

## Step 4: Light with Photography, Not CSS

This is the most common source of weird artifacts. Image models take lighting descriptions literally.

### What Creates Problems
- "Glowing orbs" → renders literal floating spheres
- "Radial gradient" → renders a visible gradient disc
- "30% opacity" → confuses the model
- "Border at 8% white" → renders visible borders with text labels

### What Works
Describe all lighting as a photographer would:

| Instead of | Write |
|-----------|-------|
| "amber glow orb upper-left" | "diffused warm amber light washing from the upper-left, like colored stage lighting" |
| "radial gradient behind him" | "soft atmospheric ambient light in the background" |
| "violet at 18% opacity" | "a faint hint of violet from the right" |
| "five glow orbs at various positions" | "the room is lit by subtle colored ambient light -- warm amber dominant from one side, hints of violet and blue in the deeper shadows" |
| "box-shadow halo" | "a warm amber halo around it" |
| "frosted glass with 4% white tint" | "translucent frosted-glass surface" |

**Three-point lighting is your friend:**
- **Key light**: the main light source (screen glow, desk lamp, window). Name it and say where it hits
- **Fill light**: the ambient/secondary light. Describe as atmospheric color wash
- **Rim/accent light**: edge lighting that separates subject from background. Describe as coming from a direction

## Step 5: Create Pose Variety Across a Set

When writing multiple prompts for the same site/project, actively vary these dimensions:

### Body Position
Mix across: sitting at desk, sitting on couch/edge of furniture, standing, walking, crouching/kneeling, leaning against something

### Camera Angle
Mix across: three-quarter angle, profile, through-a-window, low angle looking up, over-the-shoulder, wide establishing shot, tight close-up

### Setting
Mix across: at a desk, on a couch, at a standing desk, in a hallway, at a whiteboard, in a studio, at a conference table, on the floor

### Relationship to Camera
Mix across: looking past camera (explaining to someone off-frame), looking at their screen (absorbed), looking back over shoulder, looking up from work, caught mid-laugh with another person

### Clothing Notes
Keep wardrobe consistent for the same character across a set but add small variations:
- Same base garment (e.g., "dark charcoal v-neck") with variations like "slightly pushed-up sleeves" or "with a dark blazer over it" for more formal shots

## Step 6: The Closing Details

Every prompt should end with production direction:

- **Photography style**: "Photorealistic, documentary style" or "editorial portrait lighting" or "available-light cinematic feel"
- **Depth of field**: "shallow depth of field" with what should be soft ("background glow", "the window frame", "the other person")
- **Aspect ratio**: Match the placement -- `16:9` for hero banners, `1:1` for thumbnails, `9:16` for stories
- **Mood summary**: One sentence that captures the feeling -- "the shot feels like a documentary photographer caught him mid-work-session" or "the mood is raw and behind-the-scenes"

## Step 7: Write the Alt Text

Every prompt must be paired with alt text for the generated image. This is required for ADA/WCAG compliance and SEO -- an image without alt text is an incomplete deliverable.

**Write alt text that:**
- Describes what the generated image will depict (under 125 characters)
- Focuses on the visual content, not the page context ("Abstract geometric network with cyan nodes on dark background" not "Blog post hero image")
- Doesn't start with "Image of" or "Picture of"
- Includes key visual elements: composition, dominant colors, objects, mood

**Where alt text goes:**
- `imageAlt` field in blog JSON data files
- `image-alt` attribute on `<cc-hero>`, `<cc-card>`, `<cc-blog>` components
- `alt` attribute on inline `<img>` tags

## Output Format

When writing prompts for a batch of images (e.g., hero images for multiple pages), output as CSV:

```
page_path,placement,prompt,alt_text
/index.html,hero,"The full prompt text here...","Concise alt text under 125 chars"
/about.html,hero,"The full prompt text here...","Concise alt text under 125 chars"
```

When writing a single prompt, output the prompt text followed by the alt text:
```
**Prompt:** [full prompt]
**Alt text:** [under 125 chars]
```

## Anti-Patterns Checklist

Before delivering any prompt, check for these:

- [ ] No "orbs", "spheres", or geometric lighting shapes
- [ ] No CSS notation (`rgba()`, `box-shadow`, `px`, `rem`, `opacity: 0.3`)
- [ ] No stock-photo poses (arms crossed, looking at camera smiling, handshake)
- [ ] No vague screen content ("a dashboard" without describing what's on it)
- [ ] No repeated poses if writing a set (check variety matrix above)
- [ ] Device interaction is natural (typing properly or holding up to show)
- [ ] At least one "imperfect detail" that signals authenticity
- [ ] Lighting described in photographic terms, not technical notation
- [ ] Expression is specific and natural, not generic ("confident smile")
- [ ] Hex codes included for key brand colors
- [ ] Alt text is included (under 125 chars, descriptive, no "Image of..." prefix)
