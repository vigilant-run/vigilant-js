import { Attributes } from '@opentelemetry/api'
import { LogAttributes, Logger as OTELLogger } from '@opentelemetry/api-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import { credentials } from '@grpc/grpc-js'

interface LoggerOptions {
  name?: string
  attributes?: LogAttributes
  url?: string
  token?: string
  passthrough?: boolean
  insecure?: boolean
  otelLogger?: OTELLogger
}

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

class Logger {
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
    const record = {
      severity: this.getSeverity(level),
      body: message,
      timestamp: new Date(),
      attributes: attrs,
    }

    if (error) {
      record.attributes = { ...record.attributes, error: error.message }
    }

    this.otelLogger.emit(record)
  }

  private getSeverity(level: LogLevel): number {
    switch (level) {
      case LogLevel.INFO:
        return 9
      case LogLevel.WARN:
        return 13
      case LogLevel.ERROR:
        return 17
      case LogLevel.DEBUG:
        return 5
      default:
        return 9
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
    url = 'otel.vigilant.run:4317',
    token = 'tk_1234567890',
    name = 'example',
    insecure = false,
  } = config

  const exporter = new OTLPLogExporter({
    url,
    credentials: insecure
      ? credentials.createInsecure()
      : credentials.createSsl(),
    headers: {
      'x-vigilant-token': token,
    },
  })

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: name,
  })

  const loggerProvider = new LoggerProvider({
    resource,
  })

  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(exporter))

  return loggerProvider.getLogger(name)
}

export { Logger, LoggerOptions, LogLevel }
