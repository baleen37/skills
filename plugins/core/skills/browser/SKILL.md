---
name: browser
description: Read when you need browser automation (QA, element interaction, screenshots, network capture, recording), or work in the user's logged-in accounts and apps (e.g. Slack, X, LinkedIn) through their real browser.
---

# browse

`browse` drives the user's own Chrome (their tabs, logins and extensions) with deterministic Playwright code. Same
commands as MCP tools and as the `browse` CLI.

## Start

1. `hostname` and `browse status --json`: say which computer you run on and which browser (`extension.browsers[].id`)
   you will drive.
2. `extension.connected` must be `true`. If not, see **Not connected** below.
3. `browse skill`: read all of it before the first action. It is the version-matched usage guide.

Not installed (`command not found`): `npx @opencode/browse install -a claude`. The user adds the Chrome Web Store
extension.

## Not connected

`connected: false` with `pairingState: "unpaired"` usually means the browser is **unreachable**, not unpaired: Chrome
closed, computer asleep, tunnel down. The extension reconnects on its own within about 15 seconds once the path is back.
Poll `status` for 30 seconds; still down, tell the user which browser is offline and stop.

Pair only when the path is up and it still says unpaired:

```bash
browse pair    # prints a one-time code, valid 10 minutes, and waits
# on the browser's computer, in the profile that has the extension:
open -na "Google Chrome" --args --profile-directory="<Profile N>" \
  "chrome-extension://mfnicocicmmlkpjnaffgihfjhdgjkdjg/welcome.html#code=<code>"
```

No shell on the browser's computer: give the user the code to enter under browse **Options → advanced → Pairing code**.

## Logins

Ask for a credential **once**: store it as a site secret, then type it without seeing it.

```bash
op read "op://<vault>/<item>/password" | browse secrets add <name> --origin https://<site>
browse session new <session> --allow-origin <site>
```

```js
await secrets.type(page.locator("#password"), "<name>")
```

Secrets live on the relay's computer. Each `op` call may raise a Touch ID prompt, so batch them while the user watches.

## Traps

- **Password manager overlay** (1Password and similar): typing into a login field drops the debugger
  (`Chrome re-attached the debugger`, page ends on `about:blank`). Ask the user to set that extension's **Site access**
  to **On click** in `chrome://extensions`.
- **Wait, then click**: `await Promise.all([page.waitForURL("**/next"), page.click("button[type=submit]")])`.
- **Extension pages** (browse Options included) cannot be automated; only the user can change them.
- **Agent on another computer**: see [remote.md](references/remote.md).
