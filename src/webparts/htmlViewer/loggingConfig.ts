import { LogLevel } from '@pnp/logging';

/**
 * Logging configuration for the HTML Viewer web part.
 * Subscribe additional listeners in initializeViewerLogger for App Insights or other sinks.
 */
export const LOG_SOURCE = 'HtmlViewer';

export const loggingConfig = {
  activeLogLevel: process.env.NODE_ENV === 'production' ? LogLevel.Info : LogLevel.Verbose
};
