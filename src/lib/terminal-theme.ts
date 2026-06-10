import pc from 'picocolors';

export type ColorMode = 'auto' | 'always' | 'never';
export type ThemeRole =
  | 'prompt'
  | 'user'
  | 'assistant'
  | 'offer'
  | 'filterql'
  | 'toolCall'
  | 'toolOk'
  | 'toolError'
  | 'hint'
  | 'header'
  | 'meta'
  | 'id'
  | 'error';

let envMode: ColorMode = parseColorMode(process.env.TRUSS_MCP_COLOR);
let runtimeOverride: ColorMode | undefined;

export function parseColorMode(value: string | undefined): ColorMode {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'always' || normalized === 'never') return normalized;
  return 'auto';
}

export function initColorFromEnv(): void {
  envMode = parseColorMode(process.env.TRUSS_MCP_COLOR);
}

export function setRuntimeColorMode(mode: ColorMode | undefined): void {
  runtimeOverride = mode;
}

export function getEffectiveColorMode(): ColorMode {
  if (runtimeOverride) return runtimeOverride;
  return envMode;
}

export function isColorEnabled(): boolean {
  if (process.env.NO_COLOR != null && process.env.NO_COLOR !== '') return false;
  const mode = getEffectiveColorMode();
  if (mode === 'never') return false;
  if (mode === 'always') return true;
  return Boolean(process.stdout.isTTY);
}

export function style(role: ThemeRole, text: string): string {
  if (!isColorEnabled()) return text;

  switch (role) {
    case 'prompt':
    case 'hint':
    case 'meta':
      return pc.dim(text);
    case 'user':
      return text;
    case 'assistant':
      return pc.cyan(text);
    case 'offer':
      return pc.bold(pc.yellow(text));
    case 'filterql':
      return pc.magenta(text);
    case 'toolCall':
      return pc.blue(text);
    case 'toolOk':
      return pc.green(text);
    case 'toolError':
    case 'error':
      return pc.red(text);
    case 'header':
      return pc.bold(text);
    case 'id':
      return pc.cyan(text);
    default:
      return text;
  }
}

export function describeColorSetting(): string {
  const effective = isColorEnabled() ? 'on' : 'off';
  const mode = getEffectiveColorMode();
  const source = runtimeOverride ? 'runtime' : 'env/TTY';
  return `${effective} (mode: ${mode}, source: ${source})`;
}

/** Strip ANSI escape codes for test assertions. */
export function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}
