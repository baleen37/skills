---
type: llm
focus:
  source: file
  path: notes/research.md
---

Judge the notes written to `notes/research.md`. PASS only if all hold:
1. Both viewpoints (1) sort keys in the cursor and (2) fallback vs error on a mismatched cursor get an explicit answer.
2. Each answer cites at least one official source URL (Relay spec, GitHub or Shopify GraphQL docs, or OpenSearch docs).
3. Statements that the sources do not directly say are marked as inference or recommendation, not presented as documented fact.
FAIL if any viewpoint is missing, uncited, or if a vendor's behavior is asserted without a source.
