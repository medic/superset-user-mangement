import chalk from 'chalk';

export enum LogLevel {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export class Logger {
  private static formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level}: ${message}`;
  }

  static info(message: string): void {
    console.log(chalk.blue(this.formatMessage(LogLevel.INFO, message)));
  }

  static success(message: string): void {
    console.log(chalk.green(this.formatMessage(LogLevel.SUCCESS, message)));
  }

  static warning(message: string): void {
    console.log(chalk.yellow(this.formatMessage(LogLevel.WARNING, message)));
  }

  static error(message: string | Error): void {
    const errorMessage = message instanceof Error ? message.message : message;
    console.error(chalk.red(this.formatMessage(LogLevel.ERROR, errorMessage)));
    if (message instanceof Error && message.stack) {
      console.error(chalk.red(message.stack));
    }
  }

  static table(data: any[]): void {
    if (data.length > 0) {
      console.table(data);
    }
  }
}
