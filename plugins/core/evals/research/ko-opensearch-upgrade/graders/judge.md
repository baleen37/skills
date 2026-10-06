---
type: llm
focus:
  source: file
  path: notes/research.md
---

Judge the notes written to `notes/research.md`. PASS only if all hold:
1. The upgrade path from 2.11 to 3.x is stated, including any required intermediate version, with a docs.aws.amazon.com citation for that claim.
2. Custom package behavior during the upgrade is addressed, either with a cited AWS source or with an explicit statement that the official docs do not cover it.
3. No version number or behavior is asserted as fact without a citation or an explicit "not documented" / inference marker.
FAIL otherwise.
