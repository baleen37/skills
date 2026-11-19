---
name: init
description: Create the LLM wiki at ~/wiki/llm_wiki inside the ~/wiki Obsidian vault.
disable-model-invocation: true
---

# Create the LLM wiki

The pattern is Karpathy's LLM Wiki, kept verbatim in [`references/llm-wiki.md`](references/llm-wiki.md). Read it first:
every choice below instantiates it.

The wiki lives inside the user's existing PARA vault at `~/wiki`. Read `~/wiki/CLAUDE.md` for the vault's rules; the
wiki follows them and leaves every vault file outside `llm_wiki/` untouched, apart from the one-line entry in step 3.

## Steps

1. **Check.** If `~/wiki/llm_wiki/index.md` already exists, stop: the wiki is set up. Otherwise ask the user
   for the wiki's domain (research topic, book, team, personal).
2. **Agree on the schema.** Propose the default schema below, adapted to the domain, and adjust it with the user: page
   categories, frontmatter fields, ingest style (one source at a time with discussion, or batch). Done when the user
   approves it.
3. **Scaffold.** Create:

   ```text
   ~/wiki/llm_wiki/
     AGENTS.md        # the schema: single source of truth for every wiki skill
     CLAUDE.md        # one line: @AGENTS.md
     index.md         # catalog: one line per page, grouped by category
     log.md           # append-only timeline
     raw/             # immutable external sources (articles, papers, transcripts)
   ```

   If the repository structure list in `~/wiki/CLAUDE.md` lacks `llm_wiki/`, add one entry in its style: the folder is
   the LLM-maintained wiki, and agents working there follow `llm_wiki/AGENTS.md`. Done when every path above exists and
   the vault lists the folder.

4. **Log it.** Append `## [YYYY-MM-DD] init | <wiki title>` to `log.md`, then tell the user the next move: run
   `wiki:ingest` with a URL, a file, or one of their vault notes.

## Default schema for `AGENTS.md`

Write these sections, filled in for the domain:

- **Purpose**: what the wiki tracks and for whom.
- **Ownership**: the agent writes only inside `llm_wiki/` and saves images to `~/wiki/Attachments/`. Files in `raw/`
  are never edited after saving. Every other vault note (journal, inbox,
  projects, areas, resources) is a read-only source: cite it with a `[[link]]`, never edit, move, or copy it.
- **Page categories**: e.g. `sources/` (one summary per source), `entities/`, `concepts/`, `analyses/` (answers filed
  back from `wiki:search`). Each category is a folder inside `llm_wiki/`, created on first use.
- **Page format**: YAML frontmatter (`type`, `sources`, `updated`). Every claim links its source; write no number, date,
  or quote the source does not contain. When sources disagree, keep both claims under a `Disputed` note citing each.
- **Links**: filename-only `[[wikilinks]]`, per the vault convention, so page filenames must be unique across the vault.
- **index.md format**: `- [[page]] — one-line summary` under a heading per category.
- **log.md format**: entries start `## [YYYY-MM-DD] <op> | <title>` where `<op>` is `init`, `ingest`, or `query`, so
  `grep "^## \[" log.md | tail -5` shows recent activity.
- **Workflows**: ingest and query preferences agreed in step 2. The user and agent revise this file as the wiki matures.
