# Agent on a server, browser on a Mac

The agent always talks to its own relay (`127.0.0.1:19988`). One Chrome profile connects to one relay at a time.

## Connect through an SSH tunnel

```bash
# on the Mac: free the Mac relay's port, then forward it to the server relay
kill $(lsof -tiTCP:19988 -sTCP:LISTEN)
ssh -f -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 \
  -L 127.0.0.1:19988:127.0.0.1:19988 <user>@<server>
```

Then pair as in `SKILL.md`: `browse pair` on the server, the pairing link on the Mac.

## Know the costs

- The tunnel dies with sleep, reboot or a network change; rerun the `ssh` line.
- While it is up, the Mac's own `browse` cannot work.
- Store site secrets on the server.
- Every tunneled browser is named after the server (`Chrome on <server>`). Target browsers by `id`, and ask the user to
  set a real name on the extension's status page.
- Re-pairing adds an id with a `-2` suffix: `browse pair --list`, then `browse pair --revoke <old id>`.
