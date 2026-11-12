# Logins, secrets and prompts

The goal is to ask the user **once** per credential and never again. Prefer the first option that fits.

## 1. browse site secrets (preferred for website logins)

Store the value once on the relay's computer; agents type it only on its origin and never see it.

```bash
op read "op://<vault>/<item>/password" | browse secrets add <name> --origin https://<site>
```

```js
// in execute, inside a session created with --allow-origin <site>
await secrets.type(page.locator("#password"), "<name>")
```

- `op read` prompts once (Touch ID) at store time; later logins prompt nothing.
- The secret lives with the **relay**. For a server relay, pipe the value over SSH:
  `op read ... | ssh <server> 'browse secrets add <name> --origin https://<site>'`. Tested: stored on the server,
  login succeeded, the value never printed.
- An empty stdin is refused (`The secret value is empty`): check that `op read` succeeded.
- `secrets.type()` refuses fields on other origins (`domain_not_allowed`). Pair it with a session allowlist so a
  prompt-injected page cannot carry the session elsewhere.
- Rotation: when the password changes, run `secrets add` again with the same name. `browse secrets list` shows names
  and origins, never values.

## 2. 1Password values outside the browser

For API keys and other values used by commands, not typed into pages.

- **Desktop app integration** (`op` on a Mac with 1Password running): each `op` call can raise a Touch ID prompt, and a
  dismissed or unattended prompt fails with `authorization prompt dismissed`. Batch every `op read` you need into one
  command while the user is watching, and say a prompt is coming.
- **`op-auto`** (when installed): signs in with a master password kept in the login Keychain and caches the session,
  so it never prompts after the Keychain's one-time "Always Allow". Use it like `op`: `op-auto read "op://..."`.
- **Servers** have no Keychain or desktop app. Use a 1Password service account scoped to the vaults the server needs
  (`OP_SERVICE_ACCOUNT_TOKEN`, delivered as a managed secret). It cannot read Private vaults. Keep master passwords off
  servers.

## 3. Hand off to the user

2FA, passkeys, CAPTCHAs and payments go to the user with `handoff()` (see `browse skill`). Never store a TOTP seed
unless the user asks: it collapses two factors into one.

## Fewer permission prompts

- Agent permission prompts for every browse tool: allow the `browse` MCP server's tools in the agent's settings (Claude
  Code: `mcp__browse__*` in `permissions.allow`).
- Password manager overlays breaking logins are a site-access problem, not a prompt: see the trap in `SKILL.md`.
- Chrome's "started debugging" bar cannot be turned off; it is Chrome's own notice while browse is attached.
