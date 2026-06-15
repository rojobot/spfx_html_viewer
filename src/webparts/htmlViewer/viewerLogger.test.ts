/// <reference types="jest" />

import { LogLevel, Logger, FunctionListener } from '@pnp/logging';

import {
  initializeViewerLogger,
  logViewerInfo,
  resetViewerLoggerForTests
} from './viewerLogger';

jest.mock('@microsoft/sp-core-library', () => ({
  Log: {
    verbose: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('viewerLogger', () => {
  beforeEach(() => {
    resetViewerLoggerForTests();
    Logger.activeLogLevel = LogLevel.Verbose;
    jest.clearAllMocks();
  });

  it('forwards info logs to subscribed listeners', () => {
    const entries: unknown[] = [];
    Logger.subscribe(new FunctionListener(entry => entries.push(entry)));

    logViewerInfo('Test message', { ok: true });

    expect(entries.length).toBe(1);
    expect((entries[0] as { level: LogLevel }).level).toBe(LogLevel.Info);
  });

  it('initializes only once', () => {
    const scope = {} as never;

    initializeViewerLogger(scope);
    const countAfterFirstInit = Logger.count;

    initializeViewerLogger(scope);

    expect(Logger.count).toBe(countAfterFirstInit);
  });
});
