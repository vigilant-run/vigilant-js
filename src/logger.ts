import { Attributes } from '@opentelemetry/api'
import {
  Logger as OTELLogger,
  LogAttributes,
  LogRecord,
  SeverityNumber,
} from '@opentelemetry/api-logs'
import { createOTELLogger } from './otel.js'

export interface LoggerOptions {
  name?: string
  attributes?: LogAttributes
  url?: string
  token?: string
  passthrough?: boolean
  insecure?: boolean
  otelLogger?: OTELLogger
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export class Logger {
  protected otelLogger: OTELLogger
  protected attributes: LogAttributes
  protected passthrough: boolean

  constructor(options: LoggerOptions) {
    this.otelLogger = options.otelLogger || createOTELLogger(options)
    this.attributes = options.attributes || {}
    this.passthrough = options.passthrough || true
  }

  debug(message: string, attrs: Attributes = {}) {
    const callerAttrs = this.getCallerAttrs()
    this.log(LogLevel.DEBUG, message, {
      ...this.attributes,
      ...callerAttrs,
      ...attrs,
    })
    this.debugPassthrough(message)
  }

  info(message: string, attrs: Attributes = {}) {
    const callerAttrs = this.getCallerAttrs()
    this.log(LogLevel.INFO, message, {
      ...this.attributes,
      ...callerAttrs,
      ...attrs,
    })
    this.infoPassthrough(message)
  }

  warn(message: string, attrs: Attributes = {}) {
    const callerAttrs = this.getCallerAttrs()
    this.log(LogLevel.WARN, message, {
      ...this.attributes,
      ...callerAttrs,
      ...attrs,
    })
    this.warnPassthrough(message)
  }

  error(message: string, attrs: Attributes = {}, error: Error | null = null) {
    const callerAttrs = this.getCallerAttrs()
    this.log(
      LogLevel.ERROR,
      message,
      {
        ...this.attributes,
        ...callerAttrs,
        ...attrs,
      },
      error,
    )
    this.errorPassthrough(message)
  }

  protected debugPassthrough(message: string) {
    if (!this.passthrough) return
    console.debug(message)
  }

  protected infoPassthrough(message: string) {
    if (!this.passthrough) return
    console.log(message)
  }

  protected warnPassthrough(message: string) {
    if (!this.passthrough) return
    console.warn(message)
  }

  protected errorPassthrough(message: string) {
    if (!this.passthrough) return
    console.error(message)
  }

  private log(
    level: LogLevel,
    message: string,
    attrs: LogAttributes,
    error: Error | null = null,
  ) {
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

    this.otelLogger.emit(record)
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
}
