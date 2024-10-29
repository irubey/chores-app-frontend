// frontend/src/lib/api/logger.ts
import LogRocket from "logrocket";

class Logger {
  public log(message: string, meta?: any) {
    console.log(message, meta);
    LogRocket.log(message, meta);
  }

  public error(message: string, meta?: any) {
    console.error(message, meta);
    LogRocket.error(message, meta);
  }
}

export const logger = new Logger();
