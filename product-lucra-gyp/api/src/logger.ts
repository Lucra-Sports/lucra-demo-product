interface Colors {
  reset: string;
  info: string;
  success: string;
  warn: string;
  error: string;
}

class Logger {
  private colors: Colors;

  constructor() {
    this.colors = {
      reset: "\x1b[0m",
      info: "\x1b[36m", // cyan
      success: "\x1b[32m", // green
      warn: "\x1b[33m", // yellow
      error: "\x1b[31m", // red
    };
  }

  private colorize(type: keyof Colors, message: string): string {
    const color = this.colors[type] || this.colors.reset;
    return `${color}${message}${this.colors.reset}`;
  }

  public info(message: string, params?: unknown): void {
    if (params !== undefined) {
      console.log(this.colorize("info", message), params);
    } else {
      console.log(this.colorize("info", message));
    }
  }

  public success(message: string, params?: unknown): void {
    if (params !== undefined) {
      console.log(this.colorize("success", message), params);
    } else {
      console.log(this.colorize("success", message));
    }
  }

  public warn(message: string, params?: unknown): void {
    if (params !== undefined) {
      console.warn(this.colorize("warn", message), params);
    } else {
      console.warn(this.colorize("warn", message));
    }
  }

  public error(message: string, params?: object): void {
    if (params !== undefined) {
      console.error(this.colorize("error", message), params);
    } else {
      console.error(this.colorize("error", message));
    }
  }
}

export default new Logger();
