---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Delegate the reading to **one** `core:researcher` agent, in the foreground, and wait for its result. Do not start a second agent for the same question. If you are already running as a subagent, do the research yourself instead of invoking this skill or delegating.

First pick the findings file: save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible. Pass its path to the researcher.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them, within the researcher's source budget.
2. Write the findings to that file, citing each claim's source. Create it in its first tool calls and update it after each source, so an interruption doesn't lose what it has found.
3. Return the findings.

When it returns, make sure the file holds its final result, and tell the user where it is.
