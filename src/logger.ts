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
  private originalStdoutWrite: typeof process.stdout.write
  private originalStderrWrite: typeof process.stderr.write

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
    this.originalStdoutWrite = process.stdout.write.bind(process.stdout)
    this.originalStderrWrite = process.stderr.write.bind(process.stderr)

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
    this.redirectStdout()
    this.redirectStderr()
  }

  autocapture_disable() {
    process.stdout.write = this.originalStdoutWrite
    process.stderr.write = this.originalStderrWrite
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

  private redirectStdout() {
    const loggerInfo = this.info.bind(this)
    process.stdout.write = function (
      chunk: Uint8Array | string,
      encodingOrCallback?: BufferEncoding | ((error?: Error) => void),
      callback?: (error?: Error) => void,
    ): boolean {
      let encoding: BufferEncoding | undefined
      let cb: ((error?: Error) => void) | undefined

      if (typeof encodingOrCallback === 'function') {
        cb = encodingOrCallback
      } else {
        encoding = encodingOrCallback
        cb = callback
      }

      if (typeof chunk === 'string') {
        loggerInfo(chunk.trimEnd())
      } else {
        const message = Buffer.from(chunk).toString(encoding || 'utf8')
        loggerInfo(message.trimEnd())
      }

      if (cb) {
        cb()
      }

      return true
    }
  }

  private redirectStderr() {
    const loggerError = this.error.bind(this)
    process.stderr.write = function (
      chunk: Uint8Array | string,
      encodingOrCallback?: BufferEncoding | ((error?: Error) => void),
      callback?: (error?: Error) => void,
    ): boolean {
      let encoding: BufferEncoding | undefined
      let cb: ((error?: Error) => void) | undefined

      if (typeof encodingOrCallback === 'function') {
        cb = encodingOrCallback
      } else {
        encoding = encodingOrCallback
        cb = callback
      }

      if (typeof chunk === 'string') {
        loggerError(chunk.trimEnd())
      } else {
        const message = Buffer.from(chunk).toString(encoding || 'utf8')
        loggerError(message.trimEnd())
      }

      if (cb) {
        cb()
      }

      return true
    }
  }

  private stdOutPassthrough(message: string): void {
    if (!this.passthrough) return
    this.originalStdoutWrite(message + '\n')
  }

  private stdErrPassthrough(message: string): void {
    if (!this.passthrough) return
    this.originalStderrWrite(message + '\n')
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
