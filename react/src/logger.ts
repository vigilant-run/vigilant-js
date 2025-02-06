import { Attributes } from './attributes'
import axios from 'axios'

export interface LoggerOptions {
  name?: string
  endpoint?: string
  token?: string
  insecure?: boolean
  passthrough?: boolean
}

export class Logger {
  private consoleLog: typeof console.log = console.log.bind(console)
  private consoleInfo: typeof console.info = console.info.bind(console)
  private consoleWarn: typeof console.warn = console.warn.bind(console)
  private consoleError: typeof console.error = console.error.bind(console)
  private consoleDebug: typeof console.debug = console.debug.bind(console)
  private consoleTrace: typeof console.trace = console.trace.bind(console)

  private passthrough: boolean
  private name: string
  private endpoint: string
  private token: string
  private insecure: boolean

  private logsQueue: log[] = []
  private batchStop = false
  private batcherPromise: Promise<void> | null = null
  private batchInterval = 100
  private maxBatchSize = 100

  constructor(options: LoggerOptions) {
    this.passthrough = options.passthrough ?? true
    this.name = options.name ?? 'sample-app'
    this.endpoint = options.endpoint ?? 'ingress.vigilant.run'
    this.token = options.token ?? 'tk_1234567890'
    this.insecure = options.insecure ?? false

    this.startBatcher()
  }

  debug(message: string, attrs: Attributes = {}): void {
    this.log(logLevel.DEBUG, message, attrs)
    this.consoleLogPassthrough(message)
  }

  info(message: string, attrs: Attributes = {}): void {
    this.log(logLevel.INFO, message, attrs)
    this.consoleLogPassthrough(message)
  }

  warn(message: string, attrs: Attributes = {}): void {
    this.log(logLevel.WARNING, message, attrs)
    this.consoleLogPassthrough(message)
  }

  error(
    message: string,
    error: Error | null = null,
    attrs: Attributes = {},
  ): void {
    this.log(logLevel.ERROR, message, attrs, error)
    this.stdErrPassthrough(message)
  }

  autocapture_enable() {
    this.redirectConsoleLog()
    this.redirectConsoleInfo()
    this.redirectConsoleWarn()
    this.redirectConsoleError()
    this.redirectConsoleDebug()
    this.redirectConsoleTrace()
  }

  autocapture_disable() {
    console.log = this.consoleLog
    console.info = this.consoleInfo
    console.warn = this.consoleWarn
    console.error = this.consoleError
    console.debug = this.consoleDebug
    console.trace = this.consoleTrace
  }

  async shutdown(): Promise<void> {
    this.batchStop = true
    if (this.batcherPromise) {
      await this.batcherPromise
    }
  }

  private log(
    level: logLevel,
    message: string,
    attrs: Attributes,
    error: Error | null = null,
  ): void {
    if (error) {
      attrs = { ...attrs, error: error.message }
    }

    attrs = { ...attrs, 'service.name': this.name }

    this.logsQueue.push({
      timestamp: getNowTimestamp(),
      body: message,
      level: level,
      attributes: attrs,
    })
  }

  private startBatcher() {
    this.batcherPromise = new Promise<void>((resolve) => {
      const runBatcher = async () => {
        while (!this.batchStop) {
          await this.flushBatch()
          await new Promise((r) => setTimeout(r, this.batchInterval))
        }
        await this.flushBatch(true)
        resolve()
      }
      runBatcher()
    })
  }

  private async flushBatch(force = false) {
    if (this.logsQueue.length === 0) return

    while (this.logsQueue.length > 0) {
      const batch = this.logsQueue.splice(0, this.maxBatchSize)
      await this.sendBatch(batch)
      if (!force) break
    }
  }

  private async sendBatch(batch: log[]) {
    if (batch.length === 0) return

    const payload: messageBatch = {
      token: this.token,
      type: 'logs',
      logs: batch,
    }

    try {
      const endpoint = formatEndpoint(this.endpoint, this.insecure)
      await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {}
  }

  private redirectConsoleLog() {
    console.log = (...args: any[]) => {
      const message = args.map(formatArg).join(' ')
      this.log(logLevel.INFO, message, {})
      this.consoleLogPassthrough(message)
    }
  }

  private redirectConsoleInfo() {
    console.info = (...args: any[]) => {
      const message = args.map(formatArg).join(' ')
      this.log(logLevel.INFO, message, {})
      this.consoleInfoPassthrough(message)
    }
  }

  private redirectConsoleWarn() {
    console.warn = (...args: any[]) => {
      const message = args.map(formatArg).join(' ')
      this.log(logLevel.WARNING, message, {})
      this.consoleWarnPassthrough(message)
    }
  }

  private redirectConsoleError() {
    console.error = (...args: any[]) => {
      const message = args.map(formatArg).join(' ')
      this.log(logLevel.ERROR, message, {})
      this.stdErrPassthrough(message)
    }
  }

  private redirectConsoleDebug() {
    console.debug = (...args: any[]) => {
      const message = args.map(formatArg).join(' ')
      this.log(logLevel.DEBUG, message, {})
      this.consoleDebugPassthrough(message)
    }
  }

  private redirectConsoleTrace() {
    console.trace = (...args: any[]) => {
      const message = args.map(formatArg).join(' ')
      this.log(logLevel.DEBUG, message, {})
      this.consoleTracePassthrough(message)
    }
  }

  private consoleLogPassthrough(message: string): void {
    if (!this.passthrough) return
    this.consoleLog(message)
  }

  private consoleInfoPassthrough(message: string): void {
    if (!this.passthrough) return
    this.consoleInfo(message)
  }

  private consoleWarnPassthrough(message: string): void {
    if (!this.passthrough) return
    this.consoleWarn(message)
  }

  private stdErrPassthrough(message: string): void {
    if (!this.passthrough) return
    this.consoleError(message)
  }

  private consoleDebugPassthrough(message: string): void {
    if (!this.passthrough) return
    this.consoleDebug(message)
  }

  private consoleTracePassthrough(message: string): void {
    if (!this.passthrough) return
    this.consoleTrace(message)
  }
}

function formatEndpoint(
  endpoint: string | undefined,
  insecure: boolean | undefined,
): string {
  if (endpoint == '') {
    return 'ingress.vigilant.run/api/message'
  } else if (insecure) {
    return `http://${endpoint}/api/message`
  } else {
    return `https://${endpoint}/api/message`
  }
}

function getNowTimestamp(): string {
  return new Date().toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
}

enum logLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

type log = {
  timestamp: string
  body: string
  level: logLevel
  attributes: Attributes
}

type messageBatchType = 'logs'

type messageBatch = {
  token: string
  type: messageBatchType
  logs: log[]
}

function formatArg(arg: any): string {
  if (arg instanceof Error) {
    return arg.stack || arg.message
  }
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg)
    } catch {
      return Object.prototype.toString.call(arg)
    }
  }
  return String(arg)
}
