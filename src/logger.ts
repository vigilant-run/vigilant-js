import {
  Logger as OTELLogger,
  LogAttributes,
  LogRecord,
  SeverityNumber,
} from '@opentelemetry/api-logs'
import { createOTELProvider } from './otel.js'
import { LoggerProvider } from '@opentelemetry/sdk-logs'
import { getAttributes } from './storage.js'
import { Attributes } from './attributes.js'

export interface LoggerOptions {
  name?: string
  attributes?: Attributes
  url?: string
  token?: string
  passthrough?: boolean
  insecure?: boolean
  internalProvider?: LoggerProvider
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export class Logger {
  protected provider: LoggerProvider
  protected logger: OTELLogger
  protected attributes: Attributes
  protected passthrough: boolean

  constructor(options: LoggerOptions) {
    this.provider = options.internalProvider || createOTELProvider(options)
    this.logger = this.provider.getLogger(options.name || 'default')
    this.attributes = options.attributes || {}
    this.passthrough = options.passthrough || true
  }

  debug(message: string, attrs: Attributes = {}): void {
    const callerAttrs = this.getCallerAttrs()
    const loggerAttrs = this.getStoredAttributes()
    this.log(LogLevel.DEBUG, message, {
      ...this.attributes,
      ...callerAttrs,
      ...loggerAttrs,
      ...attrs,
    })
    this.debugPassthrough(message)
  }

  info(message: string, attrs: Attributes = {}): void {
    const callerAttrs = this.getCallerAttrs()
    const loggerAttrs = this.getStoredAttributes()
    this.log(LogLevel.INFO, message, {
      ...this.attributes,
      ...callerAttrs,
      ...loggerAttrs,
      ...attrs,
    })
    this.infoPassthrough(message)
  }

  warn(message: string, attrs: Attributes = {}): void {
    const callerAttrs = this.getCallerAttrs()
    const loggerAttrs = this.getStoredAttributes()
    this.log(LogLevel.WARN, message, {
      ...this.attributes,
      ...callerAttrs,
      ...loggerAttrs,
      ...attrs,
    })
    this.warnPassthrough(message)
  }

  error(
    message: string,
    attrs: Attributes = {},
    error: Error | null = null,
  ): void {
    const callerAttrs = this.getCallerAttrs()
    const loggerAttrs = this.getStoredAttributes()
    this.log(
      LogLevel.ERROR,
      message,
      {
        ...this.attributes,
        ...callerAttrs,
        ...loggerAttrs,
        ...attrs,
      },
      error,
    )
    this.errorPassthrough(message)
  }

  async shutdown(): Promise<void> {
    await this.provider.shutdown()
  }

  protected debugPassthrough(message: string): void {
    if (!this.passthrough) return
    console.debug(message)
  }

  protected infoPassthrough(message: string): void {
    if (!this.passthrough) return
    console.log(message)
  }

  protected warnPassthrough(message: string): void {
    if (!this.passthrough) return
    console.warn(message)
  }

  protected errorPassthrough(message: string): void {
    if (!this.passthrough) return
    console.error(message)
  }

  private log(
    level: LogLevel,
    message: string,
    attrs: LogAttributes,
    error: Error | null = null,
  ): void {
    const record: LogRecord = {
      timestamp: Date.now(),
      severityNumber: this.getSeverity(level),
      severityText: level,
      body: message,
      attributes: attrs,
    }

    if (error) {
      record.attributes = { ...record.attributes, error: error.message }
    }

    this.logger.emit(record)
  }

  private getSeverity(level: LogLevel): SeverityNumber {
    switch (level) {
      case LogLevel.DEBUG:
        return SeverityNumber.DEBUG
      case LogLevel.INFO:
        return SeverityNumber.INFO
      case LogLevel.WARN:
        return SeverityNumber.WARN
      case LogLevel.ERROR:
        return SeverityNumber.ERROR
      default:
        return SeverityNumber.INFO
    }
  }

  private getCallerAttrs(): Attributes {
    const error = new Error()
    const stack = error.stack?.split('\n')[3]
    const match = stack?.match(/at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/)

    if (!match) return {}

    return {
      'caller.function': match[1] || '',
      'caller.file': match[2] || '',
      'caller.line': parseInt(match[3] || '0', 10),
    }
  }

  private getStoredAttributes(): Attributes {
    return getAttributes()
  }
}
