import { Attributes } from './attributes'
import { getAttributes } from './storage'
import axios from 'axios'
import util from 'util'

export interface LoggerOptions {
  name?: string
  endpoint?: string
  token?: string
  insecure?: boolean
  passthrough?: boolean
}

export class Logger {
  private consoleLog: typeof console.log | null = null
  private consoleError: typeof console.error | null = null
  private proccessStdoutWrite: typeof process.stdout.write | null = null
  private proccessStderrWrite: typeof process.stderr.write | null = null
  private bunStdoutWrite: typeof Bun.stdout.write | null = null
  private bunStderrWrite: typeof Bun.stderr.write | null = null

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

    if (this.isBun()) this.initBun()
    this.consoleLog = console.log.bind(console.log)
    this.consoleError = console.error.bind(console.error)
    this.proccessStdoutWrite = process.stdout.write.bind(process.stdout)
    this.proccessStderrWrite = process.stderr.write.bind(process.stderr)

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
    if (this.isBun()) this.enableBunAutocapture()
    this.redirectConsoleLog()
    this.redirectConsoleError()
    this.redirectProcessStdout()
    this.redirectProcessStderr()
  }

  autocapture_disable() {
    if (this.isBun()) this.disableBunAutocapture()
    if (this.consoleLog) console.log = this.consoleLog
    if (this.consoleError) console.error = this.consoleError
    if (this.proccessStdoutWrite)
      process.stdout.write = this.proccessStdoutWrite
    if (this.proccessStderrWrite)
      process.stderr.write = this.proccessStderrWrite
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
    this.logsQueue.push({
      timestamp: getNowTimestamp(),
      body: message,
      level: level,
      attributes: {
        ...this.getStoredAttributes(),
        ...attrs,
        ...(error ? { error: error.message } : {}),
        'service.name': this.name,
      },
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
    const loggerInfo = this.info.bind(this)
    console.log = (...args: any[]) => {
      if (args.length === 0) {
        loggerInfo('')
        return
      }
      const message = util.format(...args)
      loggerInfo(message)
    }
  }

  private redirectConsoleError() {
    const loggerError = this.error.bind(this)
    console.error = (...args: any[]) => {
      if (args.length === 0) {
        loggerError('')
        return
      }
      const message = util.format(...args)
      loggerError(message)
    }
  }

  private redirectProcessStdout() {
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

  private redirectProcessStderr() {
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

  private isBun() {
    return typeof Bun !== 'undefined'
  }

  private initBun() {
    this.bunStdoutWrite = Bun.stdout.write.bind(Bun.stdout)
    this.bunStderrWrite = Bun.stderr.write.bind(Bun.stderr)
  }

  private enableBunAutocapture() {
    this.redirectBunStdout()
    this.redirectBunStderr()
  }

  private disableBunAutocapture() {
    if (this.bunStdoutWrite) Bun.stdout.write = this.bunStdoutWrite
    if (this.bunStderrWrite) Bun.stderr.write = this.bunStderrWrite
  }

  private redirectBunStdout() {
    const loggerInfo = this.info.bind(this)
    Bun.stdout.write = function (chunk: string): Promise<number> {
      loggerInfo(chunk.trimEnd())
      return Promise.resolve(chunk.length)
    }
  }

  private redirectBunStderr() {
    const loggerError = this.error.bind(this)
    Bun.stderr.write = function (chunk: string): Promise<number> {
      loggerError(chunk.trimEnd())
      return Promise.resolve(chunk.length)
    }
  }

  private stdOutPassthrough(message: string): void {
    if (!this.passthrough) return
    if (this.proccessStdoutWrite) {
      this.proccessStdoutWrite(message + '\n')
    } else if (this.bunStdoutWrite) {
      this.bunStdoutWrite(message + '\n')
    }
  }

  private stdErrPassthrough(message: string): void {
    if (!this.passthrough) return
    if (this.proccessStderrWrite) {
      this.proccessStderrWrite(message + '\n')
    } else if (this.bunStderrWrite) {
      this.bunStderrWrite(message + '\n')
    }
  }

  private getStoredAttributes(): Attributes {
    return getAttributes()
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
