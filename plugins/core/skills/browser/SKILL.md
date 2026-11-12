---
name: browser
description: Read when you need browser automation (QA, element interaction, screenshots, network capture, recording), or work in the user's logged-in accounts and apps (e.g. Slack, X, LinkedIn) through their real browser.
---

# browse

`browse` drives the user's own Chromium browser (their tabs, logins and extensions) through the browse extension. It is
a **driver**, not an agent: you decide each step and run deterministic Playwright code in background tabs. The same
commands exist as the `browse` MCP server tools and the `browse` CLI.

## Load the reference

Run `browse skill` and read all of it before the first browser action. It ships with the installed CLI, so it matches
the running version: sessions, `execute` globals, snapshots, handoffs, secrets, allowlists, recording and network
capture all live there.

## Check the connection

```bash
browse status   # expect "Extension: connected"
browse doctor   # when status is unclear
```

`browse: command not found` means it is not installed. `npx @opencode/browse install -a claude` installs the CLI,
registers the MCP server and pairs the extension. Adding the Chrome Web Store extension is a click only the user can
make: ask for it.

## Known traps

- **Password manager menus** (1Password, Bitwarden, LastPass): typing into a login field makes the manager inject its
  own frame, and Chrome drops the debugger. The symptom is `Chrome re-attached the debugger` or
  `Detached while handling command`, and the script ends on `about:blank`. Retrying does not help. Ask the user to set
  the password manager extension's **Site access** to **On click** in `chrome://extensions`, then rerun.
- **Wait before the click.** `await Promise.all([page.waitForURL("**/next"), page.click("button[type=submit]")])`.
  Starting the wait after the click can miss a fast navigation.
- **Secrets**: pair `secrets.type()` with a session allowlist (`browse session new <name> --allow-origin <host>`). The
  value then reaches only its own origin, and you never see it.

## Browser on another computer

When the agent runs on a server and the browser runs on the user's Mac, keep the server relay on `127.0.0.1` and forward
the Mac's relay port to it over SSH. The extension keeps its default `localhost` relay address:

```bash
# on the Mac: free the port held by the Mac's own relay, then forward it
kill $(lsof -tiTCP:19988 -sTCP:LISTEN)
ssh -f -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 \
  -L 127.0.0.1:19988:127.0.0.1:19988 <user>@<server>
```

Pair through the tunnel: run `browse pair` on the server, then hand its code to the extension on the Mac:

```bash
open -na "Google Chrome" --args --profile-directory="<profile dir>" \
  "chrome-extension://mfnicocicmmlkpjnaffgihfjhdgjkdjg/welcome.html#code=<code>"
```

The server prints `Paired` once the extension accepts it. While the tunnel is up, `browse` on the Mac reaches the server
relay, not a local one.
