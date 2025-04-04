import { LogLevel, LogFn, LogPassthroughFn } from './logs'
import { LogProvider } from './provider'

// NodeLogProvider is a log provider for Node.js.
// This provider allows you to automatically capture logs from within the Node.js runtime.
// These logs are forwarded to the caller.
export class NodeLogProvider implements LogProvider {
  private logFn: LogFn | null

  private stdout: typeof process.stdout.write | null
  private stderr: typeof process.stderr.write | null

  constructor() {
    this.logFn = null
    this.stdout = process.stdout.write.bind(process.stdout)
    this.stderr = process.stderr.write.bind(process.stderr)
  }

  // Checks if Node.js is the current runtime.
  static isAllowed = () => {
    return (
      typeof process !== 'undefined' &&
      process.versions != null &&
      process.versions.node != null
    )
  }

  // Enables the log provider.
  enable = () => {
    this.redirectStdout()
    this.redirectStderr()
  }

  // Disables the log provider.
  disable = () => {
    if (this.stdout) process.stdout.write = this.stdout
    if (this.stderr) process.stderr.write = this.stderr
  }

  // Sets the log function.
  setLogFn = (logFn: LogFn) => {
    this.logFn = logFn
  }

  // Returns the passthrough function for the given log level.
  getPassthroughFn = (level: LogLevel): LogPassthroughFn => {
    switch (level) {
      case LogLevel.error:
        return (message: string) => {
          if (!this.stderr) return
          this.stderr(message + '\n')
        }
      default:
        return (message: string) => {
          if (!this.stdout) return
          this.stdout(message + '\n')
        }
    }
  }

  // Redirects the stdout to the log function.
  private redirectStdout = () => {
    const loggerInfo = this.logInfo.bind(this)
    process.stdout.write = function (
      chunk: Uint8Array | string,
      encodingOrCallback?: BufferEncoding | ((error?: Error) => void),
      callback?: (error?: Error) => void,
    ): boolean {
      let encoding: BufferEncoding = 'utf8'
      let cb: ((error?: Error) => void) | undefined

      if (typeof encodingOrCallback === 'function') {
        cb = encodingOrCallback
      } else if (encodingOrCallback) {
        encoding = encodingOrCallback
        cb = callback
      }

      if (typeof chunk === 'string') {
        loggerInfo(chunk.trimEnd())
      } else {
        const message = Buffer.from(chunk).toString(encoding)
        loggerInfo(message.trimEnd())
      }

      if (cb) {
        cb()
      }

      return true
    }
  }

  // Redirects the stderr to the log function.
  private redirectStderr = (): void => {
    const loggerError = this.logError.bind(this)
    process.stderr.write = function (
      chunk: Uint8Array | string,
      encodingOrCallback?: BufferEncoding | ((error?: Error) => void),
      callback?: (error?: Error) => void,
    ): boolean {
      let encoding: BufferEncoding = 'utf8'
      let cb: ((error?: Error) => void) | undefined

      if (typeof encodingOrCallback === 'function') {
        cb = encodingOrCallback
      } else if (encodingOrCallback) {
        encoding = encodingOrCallback
        cb = callback
      }

      if (typeof chunk === 'string') {
        loggerError(chunk.trimEnd())
      } else {
        const message = Buffer.from(chunk).toString(encoding)
        loggerError(message.trimEnd())
      }

      if (cb) {
        cb()
      }

      return true
    }
  }

  // Logs an info message.
  private logInfo = (message: string): void => {
    if (!this.logFn) return
    this.logFn({
      timestamp: new Date().toISOString(),
      level: LogLevel.info,
      body: message,
      attributes: {},
    })
  }

  // Logs an error message.
  private logError = (message: string): void => {
    if (!this.logFn) return
    this.logFn({
      timestamp: new Date().toISOString(),
      level: LogLevel.error,
      body: message,
      attributes: {},
    })
  }
}
