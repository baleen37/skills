# Several computers and profiles

Three things can sit on different machines: the **agent**, the **relay** it talks to (always the agent's own
`127.0.0.1:19988`), and the **browser** (one Chrome profile with the extension). Name all three before acting.

## Identify the browser

- One extension install is one Chrome profile, and it connects to **one relay at a time**. A browser serving a
  server's agent is not serving its own computer's agent.
- A relay can hold several browsers. `browse status --json` lists each with `id`, `name` and `default`. New sessions
  open in the default browser unless you name one: MCP `session_new` with `browser: "<id or name>"`. The CLI
  `session new --browser` flag arrived after 0.0.16; check `browse session new --help`.
- The relay names a browser `"<Brand> on <computer>"`. The computer comes from the connection: the relay's own
  hostname for a local connection, else the reverse DNS name of the peer (Tailscale MagicDNS gives the real name).
- **Through an SSH tunnel every browser looks local**, so a Mac's Chrome shows up as `Chrome on <server>`. Two profiles
  on one computer also get the same name. Ask the user to set a distinct name per profile on the extension's status
  page (for example `macbook · work`), and target browsers by `id` in the meantime.

## Agent on a server, browser on a Mac

The tested setup keeps the server relay private and forwards the Mac's relay port to it. The extension keeps its default
`localhost` address, so no options-page change is needed.

```bash
# on the Mac: free the port held by the Mac's own relay, then forward it
kill $(lsof -tiTCP:19988 -sTCP:LISTEN)
ssh -f -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 \
  -L 127.0.0.1:19988:127.0.0.1:19988 <user>@<server>
```

Then pair through the tunnel ([connection.md](connection.md)): `browse pair` on the server, the pairing link on the Mac.

What this costs:

- The tunnel dies with sleep, reboot or a network change, and the browser drops until it is restored.
- While it is up, the Mac's own `browse` CLI reaches the server relay and is refused (different install and token).
  Mac-side browser work waits until the tunnel is closed and the Mac relay starts again.
- Site secrets live on the server relay: add them there.

## Direct over Tailscale

`browse set hostname 0.0.0.0` on the server opens the relay to the network, and the user enters the server's Tailscale
name under the extension's **Relay address**. browse does not encrypt the link, so keep it to Tailscale or a trusted
LAN. This gives correct browser names and needs no tunnel, but it is not yet verified here: in one trial the address
did not stick and the extension stayed on `localhost`. Confirm with the relay log
(`~/.local/state/browse/logs/relay.log`) showing `extension.connected` from the peer before relying on it, and set the
relay back with `browse set hostname 127.0.0.1` when abandoning it.
