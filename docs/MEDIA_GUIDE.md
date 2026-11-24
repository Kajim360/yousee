# Photography & Visual System

## Rule
No emoji, sparkle, star, pin or icon glyph is ever rendered. The repository enforces this with `node scripts/check-no-glyphs.mjs`, which scans `src/app`, `src/components` and `src/lib`. Visual meaning comes from typography, text badges, CSS colour dots and colour blocks.

## Image registry
`src/lib/media.ts` is the single source of truth for photography. Each entry records a key, local path, alt text, caption, credit, theme and subject. Image files are served locally from `public/images/`; the app does not depend on third-party image hosts at runtime.

The supplied, locally stored Pexels images are:

| File | Subject | Pexels photo |
|---|---|---|
| `temanggung-village.jpg` | Hillside village in Temanggung, Central Java | 38539723 |
| `mountain-village.jpg` | Village rooftops with mountains | 36832138 |
| `coastal-mangroves.jpg` | Mangrove-framed shoreline | 28908035 |
| `tanjong-sepat-mangroves.jpg` | Mangroves at low tide in Tanjong Sepat, Malaysia | 30004134 |

Pexels permits use on websites under its [license](https://www.pexels.com/license/). Photo IDs are retained in the visible credits. Some registry keys are legacy names; captions and alt text describe the actual image rather than the old key.

The following image files are still not present and need suitable replacements before their placements can display:
`city-night.jpg`, `city-baguio.jpg`, `flood-street.jpg`, `flood-village.jpg`, `community-dialogue.jpg`, `community-volunteers.jpg`, `community-tree-planting.jpg`.

## Systematic placement
| Placement | Image | Emotional purpose |
|---|---|---|
| Homepage hero | Temanggung village, Central Java | A lived-in regional setting |
| City page headers | Temanggung and mountain-village scenes | Regional city context |
| Homepage photo essay (3 cards) | Flooding, community dialogue and tree planting images (assets not present) | Experience -> listening -> possibility |
| Homepage full-width band | Flooded residential street (asset not present) | Urgency and dignity |
| Environment pages | Coastal mangroves and Tanjong Sepat at low tide | Coastal and ecological context |
| Login | Temanggung village | Welcome and belonging |
| Admin post covers | Chosen from the same registry | Consistent, never evidence |

Every `PhotoFrame`, `PhotoEssay`, `PhotoBand`, `PageHeader photo` and login image carries a caption, source credit and `PHOTO_DISCLOSURE`: "Illustrative regional photography. Not Bandar Lampung, not a YouSee report and not evidence about any place or incident."

## Why these images
The supplied images show Central Java village scenes and coastal mangrove landscapes. They provide regional context only; none depicts Bandar Lampung or constitutes evidence about a report or location. Do not assign them to flooding or community-engagement placements. Restore those placements with matching, properly licensed photographs.
