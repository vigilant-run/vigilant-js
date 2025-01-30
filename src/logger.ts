import { getAttributes } from './storage.js'
import { Attributes } from './attributes.js'
import axios from 'axios'
import { inspect } from 'util'

export interface LoggerOptions {
  name?: string
  endpoint?: string
  token?: string
  insecure?: boolean
  passthrough?: boolean
}

export class Logger {
  private consoleLog: typeof console.log = console.log.bind(console)
  private consoleError: typeof console.error = console.error.bind(console)

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
    const loggerAttrs = this.getStoredAttributes()
    this.log(logLevel.DEBUG, message, { ...loggerAttrs, ...attrs })
    this.stdOutPassthrough(message)
  }

  info(message: string, attrs: Attributes = {}): void {
    const loggerAttrs = this.getStoredAttributes()
    this.log(logLevel.INFO, message, { ...loggerAttrs, ...attrs })
    this.stdOutPassthrough(message)
  }

  warn(message: string, attrs: Attributes = {}): void {
    const loggerAttrs = this.getStoredAttributes()
    this.log(logLevel.WARNING, message, { ...loggerAttrs, ...attrs })
    this.stdOutPassthrough(message)
  }

  error(
    message: string,
    error: Error | null = null,
    attrs: Attributes = {},
  ): void {
    const loggerAttrs = this.getStoredAttributes()
    this.log(logLevel.ERROR, message, { ...loggerAttrs, ...attrs }, error)
    this.stdErrPassthrough(message)
  }

  autocapture_enable() {
    this.redirectConsoleLog()
    this.redirectConsoleError()
  }

  autocapture_disable() {
    console.log = this.consoleLog
    console.error = this.consoleError
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

  private getStoredAttributes(): Attributes {
    return getAttributes()
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
      const loggerAttrs = this.getStoredAttributes()
      this.log(logLevel.INFO, message, loggerAttrs)
      this.stdOutPassthrough(message)
    }
  }

  private redirectConsoleError() {
    console.error = (...args: any[]) => {
      const message = args.map(formatArg).join(' ')
      const loggerAttrs = this.getStoredAttributes()
      this.log(logLevel.ERROR, message, loggerAttrs)
      this.stdErrPassthrough(message)
    }
  }

  private stdOutPassthrough(message: string): void {
    if (!this.passthrough) return
    this.consoleLog(message)
  }

  private stdErrPassthrough(message: string): void {
    if (!this.passthrough) return
    this.consoleError(message)
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
      return inspect(arg, { depth: Infinity, colors: false })
    }
  }
  return String(arg)
}
