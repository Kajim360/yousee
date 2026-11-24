# Photography & Visual System

## Rule
No emoji, sparkle, star, pin or icon glyph is ever rendered. The repository enforces this with `node scripts/check-no-glyphs.mjs`, which scans `src/app`, `src/components` and `src/lib` and fails CI on disallowed code points. Visual meaning comes from typography, two-letter text badges (`CategoryBadge`), CSS colour dots (`EmotionDot`) and colour blocks.

## Image registry
`src/lib/media.ts` is the single source of truth for all photography. It imports the local files from `src/assets/images/` and records a key, alt text, caption, credit, theme and subject for each. All files are local source files in `src/assets/images/`, imported via the barrel `src/assets/images/index.ts` (e.g. `import { cityManila } from "@/assets/images"`). The images were downloaded from Pexels under the Pexels licence.

Themes: city (Manila, Pasig, Baguio, night city), flooding (flooded streets), community (dialogue, volunteers, tree planting), environment (Candijay coastline, mangroves).

## Systematic placement
| Placement | Image | Emotional purpose |
|---|---|---|
| Homepage hero | Manila at sunset | Warmth, city as a lived place |
| Homepage photo essay (3 cards) | flooded street / neighbours talking / tree planting | Experience -> listening -> possibility |
| Homepage full-width band | floodwater in a residential street | Urgency and dignity |
| Homepage recognition block | tree planting | Agency and care |
| Page headers | one image per main page, themed to the section | Consistent visual rhythm |
| Login | Manila skyline | Welcome, belonging |
| Recognition | tree planting, community dialogue | Collective effort |
| Updates | city at night | Editorial calm |
| Admin post covers | chosen from the same registry | Consistent, never evidence |

Every `PhotoFrame`, `PhotoEssay`, `PhotoBand`, `PageHeader photo` and login image carries a caption, the photographer credit, and `PHOTO_DISCLOSURE`: "Illustrative regional photography. Not Bandar Lampung, not a YouSee report and not evidence about any place or incident."

## Why these images
The user asked for cities of the Philippines, flooding, community engagements and the environment. Photos from Manila, Pasig, Baguio and Candijay anchor the regional city identity; flooding and community/environment images show the everyday conditions and collective responses YouSees studies. Because YouSee's pilot is Bandar Lampung, Indonesia, the disclosure is essential: these photographs set emotional context and must never be mistaken for pilot evidence.
