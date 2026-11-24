# Decisions, Risks & Open Questions

## Product decisions
- Default to anonymous participation; SheLens defaults to district-only location.
- Synthetic demo data is included but labelled everywhere, excluded from homepage counts and toggleable in Explore, Understand and insight generation.
- YouSee explicitly states it is not an official complaint channel and points to LAPOR!.
- Publication requires at least one community validation response. This is the minimal operational form of “collective validation”.

## Technical decisions
See SYSTEM_ARCHITECTURE.md (kept stack, no PostGIS yet, DB photos, lexical RAG, server actions).

## Risks
| Risk | Mitigation |
|---|---|
| Unequal participation | coverage-gap panel; planned facilitated sessions; Bahasa UI |
| AI misinterpretation | separated storage, human review, low-confidence defaults |
| Reporting bias read as prevalence | disclaimers on Explore, Understand, insights; representation notes |
| Re-identification | precision reduction, n ≥ 5 suppression, PII redaction |
| Overclaiming | no metrics or partnerships claimed; methodology marked exploratory |

## Open questions
See PRODUCT_REQUIREMENTS.md → “Requires product clarification”.

## Research assumptions
- Lived-experience reports add information not captured by official datasets (to be tested).
- The exploratory frame is interpretable by researchers with acceptable agreement (to be tested).
