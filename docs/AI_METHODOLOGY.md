# AI Methodology

AI is an assistant, never a decision-maker. All prompts live in `src/lib/ai.ts`. Versions are tracked in `PROMPT_VERSIONS`.

## Capabilities
| Capability | Prompt version | Output | Fallback (no API key / failure) |
|---|---|---|---|
| Contribution categorisation + exploratory frame | `categorize-v1` | Zod-validated JSON: suggestedCategory, themes, suggestedFrame, frameRationale, confidence, caveat | keyword heuristic; frame defaults to `unknown`; confidence `low` |
| Insight drafting | `insight-v1` | JSON: title, summary (cites [R#]), themes, confidence, uncertaintyNote | extractive summary (counts, recurring words, example titles) |
| Ask Your City (RAG) | `ask-v1` | cited prose answer | top passages shown verbatim with references |

## Guardrails encoded in prompts and code
- Answer only from the provided evidence and cite every claim. Resident items are phrased as “residents reported”.
- No causal claims unless stated by residents or sources. Report concentration ≠ prevalence.
- Never label areas or communities as unsafe, and never infer personal characteristics.
- Fewer than 5 records → confidence forced to `low` in code.
- PII (phones, emails, 16-digit IDs) is redacted before text is sent to the model.
- Evidence sufficiency: if the top retrieval score is below 0.7, the answer is flagged “limited evidence” and the model is told to say so.
- Synthetic records are labelled inside the retrieval context.

## Storage & review
- `ai_interpretations` holds suggestions separately. Moderators accept or reject them, and the citizen's own category is never overwritten.
- Insights store `method`, `model` and `prompt_version`. Human edits append `+human-edited`.
- Publication requires at least one validation record.

## Evaluation (Admin → AI evaluation)
Currently logged: question volume, LLM vs retrieval-only, low-evidence rate, helpful/unhelpful feedback, human acceptance rate
of AI suggestions, and community agreement with insights. Planned: a fixed test set of 30 bilingual questions scored for
retrieval relevance, attribution accuracy, factual consistency and hallucination; inter-coder agreement (Cohen's κ) for frames.

## Not done (deliberately)
No fine-tuning and no embeddings until the core workflow is validated and the corpus grows.
