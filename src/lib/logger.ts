/**
 * Structured Logger for Theralgo
 *
 * Lightweight structured logging for Vercel serverless environments.
 * Outputs JSON in production, readable format in development.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private context: LogContext;
  private isDevelopment: boolean;

  constructor(context?: LogContext) {
    this.context = context || {};
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  child(additionalContext: LogContext): Logger {
    const mergedContext = { ...this.context, ...additionalContext };
    return new Logger(mergedContext);
  }

  private formatOutput(level: LogLevel, message: string, data?: LogContext): string | object {
    const output = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(data && { data }),
    };

    if (this.isDevelopment) {
      const contextStr = Object.keys(this.context).length > 0
        ? ` [${Object.entries(this.context).map(([k, v]) => `${k}=${v}`).join(', ')}]`
        : '';
      const dataStr = data ? ` ${JSON.stringify(data)}` : '';
      return `[${output.timestamp}] ${level.toUpperCase()}${contextStr}: ${message}${dataStr}`;
    }

    return output;
  }

  debug(message: string, data?: LogContext): void {
    const formatted = this.formatOutput('debug', message, data);
    if (this.isDevelopment) {
      console.log(formatted);
    } else {
      console.debug(JSON.stringify(formatted));
    }
  }

  info(message: string, data?: LogContext): void {
    const formatted = this.formatOutput('info', message, data);
    console.log(this.isDevelopment ? formatted : JSON.stringify(formatted));
  }

  warn(message: string, data?: LogContext): void {
    const formatted = this.formatOutput('warn', message, data);
    console.warn(this.isDevelopment ? formatted : JSON.stringify(formatted));
  }

  error(message: string, error?: Error | unknown, data?: LogContext): void {
    let errorData: Record<string, unknown> = {};

    if (error instanceof Error) {
      errorData = {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack?.split('\n').slice(0, 5), // First 5 lines of stack
      };
    } else if (typeof error === 'string') {
      errorData = { error_message: error };
    } else if (error) {
      errorData = { error: String(error) };
    }

    const output = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...this.context,
      ...errorData,
      ...(data && { data }),
    };

    if (this.isDevelopment) {
      const contextStr = Object.keys(this.context).length > 0
        ? ` [${Object.entries(this.context).map(([k, v]) => `${k}=${v}`).join(', ')}]`
        : '';
      const errorStr = error ? `\n  ${error instanceof Error ? error.message : String(error)}` : '';
      const dataStr = data ? ` ${JSON.stringify(data)}` : '';
      console.error(`[${output.timestamp}] ERROR${contextStr}: ${message}${errorStr}${dataStr}`);
    } else {
      console.error(JSON.stringify(output));
    }
  }
}

// Default logger instance with service context
export const logger = new Logger({ service: 'theralgo' });
