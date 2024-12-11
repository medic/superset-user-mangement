import chalk from 'chalk';

export enum LogLevel {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

type LogContext = Record<string, any>;

export class Logger {
  private static formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] ${level}: ${message}`;
    if (context) {
      formattedMessage += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }
    return formattedMessage;
  }

  static info(message: string, context?: LogContext): void {
    console.log(chalk.blue(this.formatMessage(LogLevel.INFO, message, context)));
  }

  static success(message: string, context?: LogContext): void {
    console.log(chalk.green(this.formatMessage(LogLevel.SUCCESS, message, context)));
  }

  static warning(message: string, context?: LogContext): void {
    console.log(chalk.yellow(this.formatMessage(LogLevel.WARNING, message, context)));
  }

  static error(message: string | Error, context?: LogContext): void {
    const errorMessage = message instanceof Error ? message.message : message;
    const errorContext = message instanceof Error 
      ? { ...context, stack: message.stack }
      : context;
    
    console.error(chalk.red(this.formatMessage(LogLevel.ERROR, errorMessage, errorContext)));
  }

  static table(data: any[]): void {
    if (data.length > 0) {
      console.table(data);
    }
  }
}
