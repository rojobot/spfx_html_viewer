import { Log, type ServiceScope } from '@microsoft/sp-core-library';
import {
  ConsoleListener,
  FunctionListener,
  LogLevel,
  Logger,
  type LogEntry
} from '@pnp/logging';

import { formatLogMessage } from './logMessage';
import { LOG_SOURCE, loggingConfig } from './loggingConfig';

let initialized = false;
let serviceScope: ServiceScope | undefined;

function forwardToSpfxLog(entry: LogEntry): void {
  const message = formatLogMessage(entry.message, entry.data);

  switch (entry.level) {
    case LogLevel.Error: {
      const error = entry.data instanceof Error ? entry.data : new Error(message);
      Log.error(LOG_SOURCE, error, serviceScope);
      break;
    }
    case LogLevel.Warning:
      Log.warn(LOG_SOURCE, message, serviceScope);
      break;
    case LogLevel.Info:
      Log.info(LOG_SOURCE, message, serviceScope);
      break;
    default:
      Log.verbose(LOG_SOURCE, message, serviceScope);
  }
}

export function initializeViewerLogger(scope: ServiceScope): void {
  if (initialized) {
    return;
  }

  initialized = true;
  serviceScope = scope;
  Logger.activeLogLevel = loggingConfig.activeLogLevel;

  Logger.subscribe(new FunctionListener(forwardToSpfxLog));

  if (process.env.NODE_ENV !== 'production') {
    Logger.subscribe(new ConsoleListener());
  }
}

export function logViewerEvent(level: LogLevel, message: string, data?: unknown): void {
  Logger.log({
    level,
    message,
    data
  });
}

export function logViewerVerbose(message: string, data?: unknown): void {
  logViewerEvent(LogLevel.Verbose, message, data);
}

export function logViewerInfo(message: string, data?: unknown): void {
  logViewerEvent(LogLevel.Info, message, data);
}

export function logViewerWarning(message: string, data?: unknown): void {
  logViewerEvent(LogLevel.Warning, message, data);
}

export function logViewerError(message: string, error?: Error | unknown): void {
  logViewerEvent(LogLevel.Error, message, error);
}

/** @internal Resets logger state for unit tests. */
export function resetViewerLoggerForTests(): void {
  Logger.clearSubscribers();
  initialized = false;
  serviceScope = undefined;
}
