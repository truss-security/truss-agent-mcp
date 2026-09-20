# Customer path — install and run Agent MCP

**Status:** Target operator journey (no MCP host required)  
**Depends on:** [01-what-is-agent-mcp](./01-what-is-agent-mcp.md), [05-config-and-secrets](./05-config-and-secrets.md), [07-chat-and-serve](./07-chat-and-serve.md)

Most customers never install Agent MCP. Investigation is **Server MCP** (hosted URL or the Truss dashboard). Agent MCP is only for customers who will **push intel into their own systems**.

Those customers typically **do not have Cursor**. They never start `truss-mcp mcp`. They install a CLI, fill in config + `.env`, and leave `truss-mcp serve` running.

MCP hosts (Cursor/Claude) are an **optional** overlay: [03-dual-server-host](./03-dual-server-host.md), [09-run-job-now](./09-run-job-now.md).

---

## What they need

- A Truss API key from the dashboard (public REST search)
- A Discord incoming webhook for the destination channel (value stays on their machine)
- Node.js 18+
- A machine they control (laptop for a trial; SOC host for production)

Package is **not on npm yet**. After publish: `npm install -g @truss-security/truss-agent-mcp`. Until then, install from this repo.

---

## Step by step

1. Get a Truss API key from the Truss dashboard.

2. Create a Discord incoming webhook for the channel that should receive intel. Copy the URL; do not paste it into JSON, chat, or tickets.

3. Install the CLI:

```bash
git clone https://github.com/truss-security/truss-agent-mcp.git
cd truss-agent-mcp
npm install && npm run build
npm install -g .
```

4. Copy example config (these files store env **names**, never secrets):

```bash
cp config/connections.example.json config/connections.json
cp config/jobs.example.json config/jobs.json
cp config/agent.example.json config/agent.json
```

5. Create `.env` in the directory they will run from:

```bash
TRUSS_API_KEY=their_key
DISCORD_WEBHOOK_ALERTS=https://discord.com/api/webhooks/...
```

`connections.json` must point at that **name**, for example `"webhookUrlEnv": "DISCORD_WEBHOOK_ALERTS"`. Never put the webhook URL in JSON.

6. Edit `config/jobs.json`: FilterQL filter, window, schedule (minutes), and `connectionName`. Example: malware, last 60 minutes, every 60 minutes, connection `discord-alerts`.

7. Check setup (does not POST to Discord):

```bash
truss-mcp doctor
```

Expect: API key present, JSON valid, `DISCORD_WEBHOOK_ALERTS` set.

8. Test once:

```bash
truss-mcp run-job discord-malware-hourly
```

Matches in that window → Discord metadata post. Empty search → no post, not a failure.

9. Leave it running on a box they control:

```bash
truss-mcp serve
```

That process wakes on the job schedule, searches Truss, POSTs to Discord. No LLM. Ctrl+C stops it. Later wrap the same command in systemd or Docker.

---

## Day to day

- Change filters or schedules in JSON, then restart `serve`
- `truss-mcp run-job <name>` for a one-shot
- Do **not** run `truss-mcp mcp` — that command is only for Cursor/Claude

Investigation without Cursor is the **Truss dashboard** (or REST). Agent MCP does not replace the UI; it delivers what the job’s filter already describes.

---

## Optional: MCP host

If they later use Cursor or Claude: attach hosted Server MCP for investigation **and** local `truss-mcp mcp` for `run_job_now`. Same `.env` and `config/`. Not required for the path above.

---

## Notes for this repo (not customer-facing)

Example filenames should be `connections.example.json`, `jobs.example.json`, `agent.example.json`. This clone may still have awkwardly named copies (`jobs.example copy.json`). Fix before public install docs.

Do not put this walkthrough in the shipped README until phase 6 ([04-migration-phases](./04-migration-phases.md)).
