# Truss Agent

Scheduled Truss threat-intelligence delivery on a machine you control.

Image: `ghcr.io/truss-security/truss-agent:1.1.0`

The container runs `serve`. On each job interval it calls `POST /product/search` and, when the window has products, delivers them. An empty search does not send anything. No model runs on the timer.

The first job is an hourly Discord post for new malware. The Discord webhook and the Truss API key stay in a `.env` file on your host. They are not in the image, and the job JSON stores only the env var name.

Investigation in Cursor or Claude uses hosted Truss MCP at `https://api.truss-security.com/mcp`. This image does not replace that.

## Run it

Create a directory and save these files into it. You do not need this git repository.

```text
discord-feed/
  compose.yaml
  .env
  config/
    connections.json
    jobs.json
    agent.json
```

`compose.yaml`:

```yaml
name: truss-discord

services:
  discord:
    image: ghcr.io/truss-security/truss-agent:1.1.0
    init: true
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./config:/app/config:ro
```

`.env` (do not commit this file):

```bash
TRUSS_API_KEY=
DISCORD_WEBHOOK_ALERTS=
```

`TRUSS_API_KEY` is an API key from the Truss dashboard. `DISCORD_WEBHOOK_ALERTS` is the incoming webhook URL you create in Discord (channel → Integrations → Webhooks).

`config/connections.json`:

```json
{
  "connections": [
    {
      "name": "discord-alerts",
      "type": "discord",
      "description": "Threat intel channel",
      "enabled": true,
      "webhookUrlEnv": "DISCORD_WEBHOOK_ALERTS"
    }
  ]
}
```

`config/jobs.json`:

```json
{
  "formatVersion": 2,
  "jobs": [
    {
      "name": "discord-malware-hourly",
      "connectionName": "discord-alerts",
      "schedule": 60,
      "outputFormat": "metadata",
      "enabled": true,
      "includeIndicators": false,
      "filter": {
        "filterExpression": "category = \"Malware\""
      },
      "windowMinutes": 60
    }
  ]
}
```

`config/agent.json`:

```json
{
  "agentName": "truss-agent"
}
```

From `discord-feed/`:

```bash
docker compose pull
docker compose run --rm discord run-job discord-malware-hourly
docker compose up -d
```

`pull` downloads the image. `run-job` searches once and posts only when that window has malware. `up -d` leaves the same job running every 60 minutes. `docker compose down` stops it.

Change the filter or schedule in `config/jobs.json`, then `docker compose up -d` again so the container reloads the files.

## What stays where

| Value | Where it lives |
|-------|----------------|
| Discord webhook | Host `.env` as `DISCORD_WEBHOOK_ALERTS` |
| Truss API key | Host `.env` as `TRUSS_API_KEY` |
| Filter, interval, env var name | `config/*.json` |
| Image | `ghcr.io/truss-security/truss-agent` |

JSON uses `webhookUrlEnv`. Do not put the webhook URL in JSON or in the image.

## Also in this repository

The same repo contains the `truss-mcp` CLI: terminal search, local stdio MCP, and `doctor` / `validate-remote` for hosted OAuth. Container users do not need those commands. The CLI is not on npm yet; build it from this repo using [getting started](guides/getting-started.md).

Hosted MCP for Cursor and Claude Desktop is `https://api.truss-security.com/mcp` (OAuth, Growth+). Samples: [config/cursor.mcp.json](config/cursor.mcp.json) · [config/claude_desktop_config.json](config/claude_desktop_config.json).

Guides: [getting started](guides/getting-started.md) · [terminal REPL](guides/truss-cli.md) · [publishing](guides/publishing.md) · [changelog](CHANGELOG.md)

## Development

```bash
npm install && npm run build
npm test
```

Build and publish the image from this repo with Docker Buildx. The tag matches the package version.

MIT
