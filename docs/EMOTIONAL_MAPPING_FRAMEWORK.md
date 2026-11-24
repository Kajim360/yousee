# Emotional & Cognitive Mapping Framework

## Two separate layers
1. **User-facing emotions** (optional): Happy, Calm, Neutral, Frustrated, Sad, Unsafe, Other/Not sure, plus an optional note. Stored in `contributions.emotion`. Never re-labelled.
2. **Analytical frame** (researcher-facing, exploratory): Open (green), Fight (red), Flight (yellow), Freeze (blue), Fawn (orange), Unknown (purple). Stored only as an AI or heuristic *suggestion* in `ai_interpretations`, with rationale and confidence, and is reviewable.

## Theoretical assumptions
- People's relationships with places can be described along patterns of engagement, contestation, avoidance, immobilisation and accommodation, drawing on environmental psychology and cognitive mapping (Lynch), by analogy to stress-response vocabulary.
- The frame describes **a contribution's relationship to a place**, not a person.

## Limitations
- Not clinical, not diagnostic, not validated. Borrowing stress-response terms risks over-psychologising urban experience.
- Selected emotion ≠ frame. For example, “Unsafe” may correspond to Flight, Freeze or Fawn, or none of them.
- Heuristic suggestions are weak and default to Unknown.
- Cultural and linguistic variation (Bahasa Indonesia and local languages) has not been studied.

## Cognitive mapping inputs
important place · frequent place · avoided area · memory place · important route · disconnected area · place of difficulty · place to improve. Geometry: point, route (LineString) or area (Polygon), or no location.

## Validation plan
Inter-coder reliability between two human coders, then between humans and AI; participant comprehension tests during facilitated sessions; revision of categories based on results. Record methodological changes in CHANGELOG.md.
