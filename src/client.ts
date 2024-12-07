import { Attributes } from '@opentelemetry/api'
import {
  LogAttributes,
  LogRecord,
  Logger as OTELLogger,
  SeverityNumber,
} from '@opentelemetry/api-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import { credentials, Metadata } from '@grpc/grpc-js'

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
  private otelLogger: OTELLogger
  private attributes: LogAttributes
  private passthrough: boolean

  constructor(options: LoggerOptions) {
    this.otelLogger = options.otelLogger || this.getOtelLogger(options)
    this.attributes = options.attributes || {}
    this.passthrough = options.passthrough || false
  }

  debug(message: string, attrs: Attributes = {}) {
    const callerAttrs = this.getCallerAttrs()
    this.log(LogLevel.DEBUG, message, {
      ...this.attributes,
      ...callerAttrs,
      ...attrs,
    })
    if (this.passthrough) {
      console.log(message)
    }
  }

  info(message: string, attrs: Attributes = {}) {
    const callerAttrs = this.getCallerAttrs()
    this.log(LogLevel.INFO, message, {
      ...this.attributes,
      ...callerAttrs,
      ...attrs,
    })
    if (this.passthrough) {
      console.log(message)
    }
  }

  warn(message: string, attrs: Attributes = {}) {
    const callerAttrs = this.getCallerAttrs()
    this.log(LogLevel.WARN, message, {
      ...this.attributes,
      ...callerAttrs,
      ...attrs,
    })
    if (this.passthrough) {
      console.warn(message)
    }
  }

  error(message: string, attrs: Attributes = {}) {
    const callerAttrs = this.getCallerAttrs()
    this.log(LogLevel.ERROR, message, {
      ...this.attributes,
      ...callerAttrs,
      ...attrs,
    })
    if (this.passthrough) {
      console.error(message)
    }
  }

  private log(
    level: LogLevel,
    message: string,
    attrs: LogAttributes,
    error: Error | null = null
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

  private getOtelLogger(options: LoggerOptions): OTELLogger {
    return createOTELLogger(options)
  }
}

interface OTELConfig {
  url?: string
  token?: string
  name?: string
  insecure?: boolean
}

function createOTELLogger(config: OTELConfig): OTELLogger {
  const {
    url = 'log.vigilant.run:4317',
    token = 'tk_1234567890',
    name = 'example',
    insecure = false,
  } = config

  const metadata = new Metadata()
  metadata.set('x-vigilant-token', token)

  const exporter = new OTLPLogExporter({
    url: url,
    metadata: metadata,
    credentials: insecure ? credentials.createInsecure() : undefined,
    timeoutMillis: 10000,
    concurrencyLimit: 10,
  })

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: name,
  })

  const loggerProvider = new LoggerProvider({
    resource,
  })

  loggerProvider.addLogRecordProcessor(
    new BatchLogRecordProcessor(exporter, {
      maxExportBatchSize: 512,
      scheduledDelayMillis: 5000,
      exportTimeoutMillis: 30000,
    })
  )

  return loggerProvider.getLogger(name)
}
