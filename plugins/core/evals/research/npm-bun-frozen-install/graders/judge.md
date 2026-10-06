---
type: llm
focus:
  source: file
  path: notes/research.md
---

PASS only if the notes written to `notes/research.md` state that both `npm ci` and `bun install --frozen-lockfile` fail (exit with an error instead of updating the lockfile) when package.json and the lockfile disagree, and each of those two claims carries a citation to that tool's official documentation. FAIL if either claim is missing, uncited, or contradicted.
