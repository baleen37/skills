---
name: ingest
description: Ingest a source into the LLM wiki — summarize it, then integrate it into entity, concept, index, and log pages. Use when the user adds an article, paper, transcript, or one of their own notes to the wiki.
---

# Ingest a source

The wiki is `~/wiki/004_RESOURCE/LLM Wiki/`; external sources live in `~/wiki/004_RESOURCE/raw/`.

## Steps

1. **Open the wiki.** If `~/wiki/004_RESOURCE/LLM Wiki/index.md` is missing, tell the user to create the wiki with
   `wiki:init`. Read `~/wiki/004_RESOURCE/LLM Wiki/AGENTS.md`: its conventions override this skill.
2. **Place the source.** An external source (a URL, pasted text, a file outside the vault) is saved as markdown into
   `004_RESOURCE/raw/`, images into `~/wiki/Attachments/`. A note already in the vault stays where it is, untouched.
   Done when the source has a vault path.
3. **Read and discuss.** Read the source in full (text first, then any referenced images). Share the key takeaways with
   the user and ask what to emphasize, unless the schema sets batch ingest.
4. **Write the source page.** Create the summary page in the schema's sources category, linking the source note.
5. **Integrate.** Read `index.md` to find every existing page the source bears on. For each: update the facts, add
   cross-links both ways, and mark where the new source contradicts an existing claim (keep both, cite both). Create
   pages for new entities or concepts the source makes central. Done when every page the source touches is accounted
   for — typically 5–15 pages.
6. **Record.** Add new pages to `index.md`; append `## [YYYY-MM-DD] ingest | <source title>` to `log.md` with the list
   of pages touched. Report that list to the user.
