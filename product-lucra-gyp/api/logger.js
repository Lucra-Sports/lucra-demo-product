class Logger {
  constructor() {
    this.colors = {
      reset: "\x1b[0m",
      info: "\x1b[36m", // cyan
      success: "\x1b[32m", // green
      warn: "\x1b[33m", // yellow
      error: "\x1b[31m", // red
    };
  }

  colorize(type, message) {
    const color = this.colors[type] || this.colors.reset;
    return `${color}${message}${this.colors.reset}`;
  }

  info(message) {
    console.log(this.colorize("info", message));
  }

  success(message) {
    console.log(this.colorize("success", message));
  }

  warn(message) {
    console.warn(this.colorize("warn", message));
  }

  error(message) {
    console.error(this.colorize("error", message));
  }
}

module.exports = new Logger();
