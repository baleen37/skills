---
name: search
description: Answer a question from the LLM wiki with citations to its pages, and file valuable answers back into it. Use when the user asks what the wiki knows, or asks to look something up in it.
---

# Search the wiki

The wiki is `~/wiki/llm_wiki/`.

## Steps

1. **Open the wiki.** If `~/wiki/llm_wiki/index.md` is missing, tell the user to create the wiki with
   `wiki:init`. Read `~/wiki/llm_wiki/CLAUDE.md`: its conventions override this skill.
2. **Locate pages.** Read `index.md` and pick the candidate pages; grep the wiki folder for terms the index misses. If
   the schema names a search tool (e.g. `qmd`), use it.
3. **Read and follow links.** Read each candidate, following `[[wikilinks]]` one hop where they bear on the question,
   including links into the rest of the vault. Done when every claim in your answer traces to a page you read.
4. **Answer.** Synthesize the answer, citing pages as `[[page]]`. Pick the form that fits: prose, a comparison table, a
   chart, or slides. Name gaps the wiki cannot answer and the source that would fill them.
5. **File back.** If the answer is a reusable synthesis (a comparison, an analysis, a new connection), offer to save it
   as a page in the schema's analyses category. When the user agrees, save it, add it to `index.md`, and append
   `## [YYYY-MM-DD] query | <question>` to `log.md`.
