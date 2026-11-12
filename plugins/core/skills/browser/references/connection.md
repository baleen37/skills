# Connection and pairing

Diagnose from `browse status --json` on the computer whose relay the agent uses. The fields that matter:
`extension.connected`, `extension.pairingState`, `extension.browsers[]` (`id`, `name`, `connected`) and
`relay.version`.

## States

| What `status` shows | Meaning | Action |
| --- | --- | --- |
| `connected: true`, target in `browsers` | Ready | Work |
| `connected: false`, `pairingState: "unpaired"`, `browsers: []` | Usually **not reachable**, not revoked: Chrome closed, the computer asleep, a tunnel down | Wait, then recheck (below) |
| `pairingState: "unpaired"` that survives Chrome running and the path being up | No key for this relay | Pair (below) |
| Relay log `code=4006 "Pairing revoked"` | Someone ran `browse pair --revoke` | Pair (below) |
| CLI prints `Running relay build ... is newer than CLI build` | CLI and relay come from different installs | Use the CLI of the install that runs the relay; `browse update` |

`unpaired` with an empty browser list is what an unreachable browser looks like too. Before asking the user to pair,
confirm the path: Chrome is open on the browser's computer, and any tunnel or network link is up.

## Reconnecting

The extension reconnects on its own with backoff (at most 15 seconds). Measured: a relay restart reconnected
immediately, a restored SSH tunnel within 8 seconds. Poll `browse status --json` for about 30 seconds after the path
returns. Still disconnected after that: tell the user which browser (`id`, computer, profile) is offline and stop.

Named sessions survive relay restarts, so reuse the session name after reconnecting.

The user clicking **Cancel** on Chrome's "started debugging" bar disconnects browse from every tab on purpose. Ask
before reattaching.

## Pairing

A browser holds one key per relay. Pair when the relay has no key for it:

1. On the relay's computer, run `browse pair` in the background. It prints a one-time code (`XXXX-XXXX`, ten minutes)
   and waits for the browser.
2. Hand the code to the extension:
   - **You can run commands on the browser's computer** (it is this machine, or you can `ssh` to it): open the pairing
     link in the Chrome profile that has the extension. The extension redeems the code with no typing.

     ```bash
     open -na "Google Chrome" --args --profile-directory="<profile dir>" \
       "chrome-extension://mfnicocicmmlkpjnaffgihfjhdgjkdjg/welcome.html#code=<code>"
     ```

   - **Otherwise**: give the user the code. They enter it under browse's Options, **advanced**, **Pairing code**, then
     click **Connect**.
3. Done when `browse pair` prints `Paired` and `status` shows the browser connected.

Profile directories (`Default`, `Profile 3`, ...) live under `~/Library/Application Support/Google/Chrome/`; the one
holding `Extensions/mfnicocicmmlkpjnaffgihfjhdgjkdjg` has browse.

Each new pairing of the same profile adds an entry with a suffixed id (`chrome-macbook-2`). After re-pairing, list
them with `browse pair --list` and revoke the stale one so the id agents target stays unambiguous.
