import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connectionsFileSchema, deliveryJobSchema } from '../src/delivery/schemas.ts';
import { loadDeliveryBundle, resolveWindowMinutes } from '../src/delivery/load-bundle.ts';
import { envRefIsSet, maskWebhookUrl, webhookEnvNameFromConnectionName } from '../src/delivery/secret-refs.ts';
import { executeJob } from '../src/delivery/execute-job.ts';
import { formatDiscordMetadata } from '../src/delivery/formatters/metadata.ts';
import { collectDeliveryDoctorChecks } from '../src/delivery/doctor-checks.ts';
import { listRunnableJobs } from '../src/delivery/serve.ts';
import type { DeliveryJob, DiscordConnection } from '../src/delivery/schemas.ts';

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz';

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'truss-delivery-'));
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function validConnection(overrides: Partial<DiscordConnection> = {}): DiscordConnection {
  return {
    name: 'discord-alerts',
    type: 'discord',
    enabled: true,
    webhookUrlEnv: 'DISCORD_WEBHOOK_ALERTS',
    ...overrides,
  };
}

function validJob(overrides: Partial<DeliveryJob> = {}): DeliveryJob {
  return {
    name: 'discord-malware-hourly',
    enabled: true,
    connectionName: 'discord-alerts',
    schedule: 60,
    outputFormat: 'metadata',
    includeIndicators: false,
    filter: { filterExpression: 'category = "Malware"' },
    ...overrides,
  };
}

describe('delivery schemas', () => {
  it('accepts webhookUrlEnv and rejects inline webhookUrl', () => {
    const ok = connectionsFileSchema.safeParse({
      connections: [validConnection()],
    });
    assert.equal(ok.success, true);

    const bad = connectionsFileSchema.safeParse({
      connections: [
        {
          name: 'discord-alerts',
          type: 'discord',
          enabled: true,
          webhookUrl: DISCORD_WEBHOOK,
        },
      ],
    });
    assert.equal(bad.success, false);
  });

  it('rejects job-level discordWebhookUrl', () => {
    const bad = deliveryJobSchema.safeParse({
      name: 'j',
      connectionName: 'discord-alerts',
      schedule: 60,
      outputFormat: 'metadata',
      discordWebhookUrl: DISCORD_WEBHOOK,
    });
    assert.equal(bad.success, false);
  });
});

describe('secret refs', () => {
  it('masks discord webhook paths', () => {
    const masked = maskWebhookUrl(DISCORD_WEBHOOK);
    assert.equal(masked.includes('abcdefghijklmnopqrstuvwxyz'), false);
    assert.equal(masked.includes(DISCORD_WEBHOOK), false);
    assert.match(masked, /discord\.com/);
  });

  it('builds env names from connection names', () => {
    assert.equal(webhookEnvNameFromConnectionName('discord-alerts'), 'WEBHOOK_DISCORD_ALERTS');
  });

  it('reports env refs as set or unset without values', () => {
    assert.equal(envRefIsSet('MISSING_WEBHOOK', {}), false);
    assert.equal(envRefIsSet('DISCORD_WEBHOOK_ALERTS', { DISCORD_WEBHOOK_ALERTS: DISCORD_WEBHOOK }), true);
  });
});

describe('executeJob', () => {
  it('does not POST when search returns no products', async () => {
    let posted = 0;
    const result = await executeJob({
      job: validJob(),
      connection: validConnection(),
      agentName: 'test-agent',
      deps: {
        search: async () => [],
        postDiscord: async () => {
          posted += 1;
        },
        env: { DISCORD_WEBHOOK_ALERTS: DISCORD_WEBHOOK },
      },
    });
    assert.equal(result.pushed, false);
    assert.equal(result.skipReason, 'empty');
    assert.equal(posted, 0);
  });

  it('fails closed when webhook env is unset', async () => {
    let posted = 0;
    let searched = 0;
    const result = await executeJob({
      job: validJob(),
      connection: validConnection(),
      agentName: 'test-agent',
      deps: {
        search: async () => {
          searched += 1;
          return [{ title: 'should not search' }];
        },
        postDiscord: async () => {
          posted += 1;
        },
        env: {},
      },
    });
    assert.equal(result.pushed, false);
    assert.match(result.skipReason ?? '', /DISCORD_WEBHOOK_ALERTS/);
    assert.equal(posted, 0);
    assert.equal(searched, 0);
  });

  it('posts metadata when products exist', async () => {
    let postedBody: unknown;
    const result = await executeJob({
      job: validJob(),
      connection: validConnection(),
      agentName: 'test-agent',
      deps: {
        search: async () => [{ id: 1, title: 'Sample malware', category: 'Malware' }],
        postDiscord: async (_url, body) => {
          postedBody = body;
        },
        env: { DISCORD_WEBHOOK_ALERTS: DISCORD_WEBHOOK },
      },
    });
    assert.equal(result.pushed, true);
    assert.equal(result.productCount, 1);
    const formatted = formatDiscordMetadata(
      [{ id: 1, title: 'Sample malware', category: 'Malware' }],
      'test-agent'
    );
    assert.deepEqual(postedBody, formatted);
  });
});

describe('delivery doctor and serve selection', () => {
  it('checks env presence without posting', () => {
    const dir = tempDir();
    mkdirSync(join(dir, 'config'));
    writeJson(join(dir, 'config', 'agent.json'), { agentName: 'test-agent' });
    writeJson(join(dir, 'config', 'connections.json'), {
      connections: [validConnection()],
    });
    writeJson(join(dir, 'config', 'jobs.json'), {
      formatVersion: 2,
      jobs: [validJob()],
    });

    const unset = collectDeliveryDoctorChecks(dir, {});
    assert.equal(
      unset.some((c) => c.name.startsWith('Connection') && c.ok === false),
      true
    );

    const set = collectDeliveryDoctorChecks(dir, { DISCORD_WEBHOOK_ALERTS: DISCORD_WEBHOOK });
    assert.equal(
      set.some((c) => c.name.startsWith('Connection') && c.ok === true),
      true
    );

    rmSync(dir, { recursive: true, force: true });
  });

  it('lists interval jobs that are enabled on both sides', () => {
    const dir = tempDir();
    mkdirSync(join(dir, 'config'));
    writeJson(join(dir, 'config', 'connections.json'), {
      connections: [validConnection()],
    });
    writeJson(join(dir, 'config', 'jobs.json'), {
      formatVersion: 2,
      jobs: [validJob()],
    });
    const bundle = loadDeliveryBundle(dir);
    const runnable = listRunnableJobs(bundle);
    assert.equal(runnable.length, 1);
    assert.equal(runnable[0]?.intervalMs, 60 * 60 * 1000);
    assert.equal(resolveWindowMinutes(validJob(), validConnection()), 60);
    assert.equal(
      resolveWindowMinutes(validJob({ windowMinutes: 6000 }), validConnection()),
      6000
    );
    rmSync(dir, { recursive: true, force: true });
  });
});
