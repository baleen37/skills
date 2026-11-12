---
name: browser
description: Read when you need browser automation (QA, element interaction, screenshots, network capture, recording), or work in the user's logged-in accounts and apps (e.g. Slack, X, LinkedIn) through their real browser.
---

# browse

`browse` drives the user's own Chromium browser (their tabs, logins and extensions) through the browse extension. It is
a **driver**, not an agent: you decide each step and run deterministic Playwright code in background tabs. The same
commands exist as the `browse` MCP server tools and the `browse` CLI.

## Start every browser task

1. **Locate.** Run `hostname` and `browse status --json`. Say which computer this agent runs on and which browser
   (`extension.browsers[].id` and `name`) it will drive. A relay can hold browsers from several computers and profiles,
   and the name alone can mislead: see [remote.md](references/remote.md).
2. **Connect.** `extension.connected` is `true` and the target browser is listed. Anything else: follow
   [connection.md](references/connection.md) before touching a page.
3. **Load the reference.** Run `browse skill` and read all of it before the first browser action. It ships with the
   installed CLI, so it matches the running version: sessions, `execute` globals, snapshots, handoffs, secrets,
   allowlists, recording and network capture all live there.

`browse: command not found` means it is not installed. `npx @opencode/browse install -a claude` installs the CLI,
registers the MCP server and pairs the extension. Adding the Chrome Web Store extension is a click only the user can
make: ask for it.

## Logins and secrets

Store a password once and reuse it with no further prompts: [secrets.md](references/secrets.md). Read it before any
login, any 1Password (`op`) use, or when the user complains about repeated permission prompts.

## Known traps

- **Password manager menus** (1Password, Bitwarden, LastPass): typing into a login field makes the manager inject its
  own frame, and Chrome drops the debugger. The symptom is `Chrome re-attached the debugger` or
  `Detached while handling command`, and the script ends on `about:blank`. Retrying does not help. Ask the user to set
  the password manager extension's **Site access** to **On click** in `chrome://extensions`, then rerun.
- **Wait before the click.** `await Promise.all([page.waitForURL("**/next"), page.click("button[type=submit]")])`.
  Starting the wait after the click can miss a fast navigation.
- **Extension pages are out of reach.** Chrome blocks every extension, Claude in Chrome included, from driving another
  extension's pages, so browse's options page is a step only the user can take. Pairing links are the exception: see
  [connection.md](references/connection.md).
