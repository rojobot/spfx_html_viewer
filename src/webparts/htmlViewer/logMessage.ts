export interface ILogUrlParts {
  host: string;
  file: string;
}

export function formatLogMessage(message: string, data?: unknown): string {
  const base = (message || '').trim();

  if (data === undefined || data === null) {
    return base.substring(0, 100);
  }

  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    return `${base} ${serialized}`.substring(0, 100);
  } catch {
    return base.substring(0, 100);
  }
}

export function sanitizeUrlForLog(url: string): ILogUrlParts {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);

    return {
      host: parsed.host,
      file: segments.length ? segments[segments.length - 1] : ''
    };
  } catch {
    return {
      host: '',
      file: ''
    };
  }
}
