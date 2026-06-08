import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const trussApiKey = process.env.TRUSS_API_KEY?.trim();
const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
const runLive =
  process.env.TRUSS_RUN_INTEGRATION === '1' && trussApiKey && anthropicApiKey;

const skipReason =
  'Set TRUSS_RUN_INTEGRATION=1, TRUSS_API_KEY, and ANTHROPIC_API_KEY to run live ask test';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = join(packageRoot, 'dist', 'truss-cli.js');

describe('ask integration (optional)', () => {
  it('runs a single turn against Claude and Truss MCP', async (t) => {
    if (!runLive) {
      t.skip(skipReason);
      return;
    }

    process.env.TRUSS_MCP_SERVER_PATH = serverPath;

    const { loadAskConfig } = await import('../src/ask/config.ts');
    const { connectMcpSession } = await import('../src/ask/mcp-session.ts');
    const { runTurn } = await import('../src/ask/run-turn.ts');
    const { getSystemPrompt } = await import('../src/ask/system-prompt.ts');

    const config = loadAskConfig(import.meta.url);
    const session = await connectMcpSession(config);

    try {
      const result = await runTurn(
        config,
        session,
        undefined,
        'List the Truss FilterQL attributes. Reply briefly.',
        getSystemPrompt('search')
      );
      const text = result.displayText;
      assert.ok(text.length > 0);
      assert.match(text.toLowerCase(), /category|filter|attribute/);
    } finally {
      await session.close();
    }
  });
});
