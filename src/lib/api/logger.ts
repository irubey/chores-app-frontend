// frontend/src/lib/api/logger.ts

type LogLevel = "debug" | "info" | "warn" | "error";
type LogMetadata = Record<string, unknown>;

interface LogEntry {
  message: string;
  metadata?: LogMetadata;
  timestamp: string;
  level: LogLevel;
}

class Logger {
  private formatMetadata(metadata?: LogMetadata): string {
    if (!metadata) return "";
    try {
      return Object.entries(metadata)
        .map(([key, value]) => `\n  ${key}: ${JSON.stringify(value)}`)
        .join("");
    } catch (error) {
      return "\n  [Unable to stringify metadata]";
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): LogEntry {
    return {
      message,
      metadata,
      timestamp: new Date().toISOString(),
      level,
    };
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata) {
    const entry = this.createLogEntry(level, message, metadata);
    const formattedMeta = this.formatMetadata(metadata);

    const logMessage = `[${
      entry.timestamp
    }] [${level.toUpperCase()}] ${message}${formattedMeta}`;

    switch (level) {
      case "debug":
        console.debug(logMessage);
        break;
      case "info":
        console.info(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      case "error":
        console.error(logMessage);
        break;
    }

    // You could add here additional logging targets (e.g., LogRocket, remote logging, etc.)
  }

  debug(message: string, metadata?: LogMetadata) {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: LogMetadata) {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: LogMetadata) {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: LogMetadata) {
    this.log("error", message, metadata);
  }

  // Specific API logging methods
  logAPIRequest(config: { method?: string; url?: string; params?: any }) {
    this.info("API Request", {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
    });
  }

  logAPIResponse(response: { config: any; status: number; data: any }) {
    this.info("API Response", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
  }

  logAPIError(error: any) {
    this.error("API Error", {
      message: error.message,
      status: error.status,
      type: error.type,
      data: error.data,
    });
  }
}

export const logger = new Logger();
