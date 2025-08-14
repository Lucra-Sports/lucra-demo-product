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

  public info(message: string): void {
    console.log(this.colorize("info", message));
  }

  public success(message: string): void {
    console.log(this.colorize("success", message));
  }

  public warn(message: string): void {
    console.warn(this.colorize("warn", message));
  }

  public error(message: string): void {
    console.error(this.colorize("error", message));
  }
}

export default new Logger();
