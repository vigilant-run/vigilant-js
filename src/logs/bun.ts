import { LogFn, LogLevel, LogPassthroughFn } from './logs'
import { LogProvider } from './provider'

// BunLogProvider is a log provider for Bun.
// This provider allows you to automatically capture logs from within the Bun runtime.
// These logs are forwarded to the caller.
export class BunLogProvider implements LogProvider {
  private logFn: LogFn | null

  private stdout: typeof Bun.stdout.write | null
  private stderr: typeof Bun.stderr.write | null

  private consoleLog: typeof console.log | null
  private consoleError: typeof console.error | null
  private consoleWarn: typeof console.warn | null
  private consoleInfo: typeof console.info | null
  private consoleDebug: typeof console.debug | null
  private consoleTrace: typeof console.trace | null

  constructor() {
    this.logFn = null
    this.stdout = Bun.stdout.write.bind(Bun.stdout)
    this.stderr = Bun.stderr.write.bind(Bun.stderr)
    this.consoleLog = console.log.bind(console)
    this.consoleError = console.error.bind(console)
    this.consoleWarn = console.warn.bind(console)
    this.consoleInfo = console.info.bind(console)
    this.consoleDebug = console.debug.bind(console)
    this.consoleTrace = console.trace.bind(console)
  }

  // Checks if Bun is the current runtime.
  static isAllowed = (): boolean => {
    return (
      process.versions.bun !== null &&
      typeof Bun !== 'undefined' &&
      typeof Bun.stdout !== 'undefined' &&
      typeof Bun.stderr !== 'undefined'
    )
  }

  // Enables the log provider.
  enable = () => {
    this.redirectStdout()
    this.redirectStderr()
    this.redirectConsoleLog()
  }

  // Disables the log provider.
  disable = () => {
    if (this.stdout) Bun.stdout.write = this.stdout
    if (this.stderr) Bun.stderr.write = this.stderr
    if (this.consoleLog) console.log = this.consoleLog
    if (this.consoleError) console.error = this.consoleError
    if (this.consoleWarn) console.warn = this.consoleWarn
    if (this.consoleInfo) console.info = this.consoleInfo
    if (this.consoleDebug) console.debug = this.consoleDebug
    if (this.consoleTrace) console.trace = this.consoleTrace
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
    Bun.stdout.write = function (chunk: string): Promise<number> {
      loggerInfo(chunk.trimEnd())
      return Promise.resolve(chunk.length)
    }
  }

  // Redirects the stderr to the log function.
  private redirectStderr = () => {
    const loggerError = this.logError.bind(this)
    Bun.stderr.write = function (chunk: string): Promise<number> {
      loggerError(chunk.trimEnd())
      return Promise.resolve(chunk.length)
    }
  }

  // Redirects the console log to the log function.
  private redirectConsoleLog = () => {
    console.log = this.logInfo.bind(this)
    console.error = this.logError.bind(this)
    console.warn = this.logWarn.bind(this)
    console.info = this.logInfo.bind(this)
    console.trace = this.logTrace.bind(this)
    console.debug = this.logDebug.bind(this)
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
    return this.getLogLevelFunc(LogLevel.error)(message)
  }

  // Logs a warning message.
  private logWarn = (message: string): void => {
    return this.getLogLevelFunc(LogLevel.warn)(message)
  }

  // Logs a debug message.
  private logDebug = (message: string): void => {
    return this.getLogLevelFunc(LogLevel.debug)(message)
  }

  // Logs a trace message.
  private logTrace = (message: string): void => {
    return this.getLogLevelFunc(LogLevel.trace)(message)
  }

  // Returns the log level function for the given log level.
  private getLogLevelFunc = (level: LogLevel): ((message: string) => void) => {
    return (message: string) => {
      const logFn = this.logFn
      if (!logFn) return
      logFn({
        timestamp: new Date().toISOString(),
        level: level,
        body: message,
        attributes: {},
      })
    }
  }
}
