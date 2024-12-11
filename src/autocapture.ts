import { Logger, LoggerOptions } from './logger.js'

export class AutocaptureLogger extends Logger {
  private originalStdoutWrite: typeof process.stdout.write
  private originalStderrWrite: typeof process.stderr.write

  constructor(options: LoggerOptions) {
    super(options)
    this.originalStdoutWrite = process.stdout.write.bind(process.stdout)
    this.originalStderrWrite = process.stderr.write.bind(process.stderr)
  }

  enable() {
    this.redirectStdout()
    this.redirectStderr()
  }

  disable() {
    process.stdout.write = this.originalStdoutWrite
    process.stderr.write = this.originalStderrWrite
  }

  protected debugPassthrough(message: string) {
    if (!this.passthrough) return
    this.originalStderrWrite(message)
  }

  protected infoPassthrough(message: string) {
    if (!this.passthrough) return
    this.originalStderrWrite(message)
  }

  protected warnPassthrough(message: string) {
    if (!this.passthrough) return
    this.originalStderrWrite(message)
  }

  protected errorPassthrough(message: string) {
    if (!this.passthrough) return
    this.originalStderrWrite(message)
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
        loggerInfo(chunk)
      } else {
        const message = Buffer.from(chunk).toString(encoding || 'utf8')
        loggerInfo(message)
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
        loggerError(chunk)
      } else {
        const message = Buffer.from(chunk).toString(encoding || 'utf8')
        loggerError(message)
      }

      if (cb) {
        cb()
      }

      return true
    }
  }
}
