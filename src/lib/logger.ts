export type LogLevel = 'info' | 'warn' | 'error';

/** Uma linha JSON por evento. Nunca passe segredos (tokens, chaves) em `fields`. */
export function log(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
