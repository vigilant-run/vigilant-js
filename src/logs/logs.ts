import { globalInstance } from '../vigilant'
import {
  NotInitializedError,
  InvalidAttributesError,
  InvalidMessageError,
} from '../messages'

export enum LogLevel {
  error = 'ERROR',
  warn = 'WARN',
  info = 'INFO',
  debug = 'DEBUG',
  trace = 'TRACE',
}

export type Log = {
  timestamp: string
  body: string
  level: LogLevel
  attributes: Record<string, string>
}

export type LogPassthroughFn = (message: string) => void

export type LogFn = (log: Log) => void

/**
 * Logs an info message.
 *
 * @param {string} message - The message to log.
 * @param {Record<string, string>} [attributes] - Additional attributes to include in the log.
 * @example
 * logInfo('Hello, world!', { user: 'John Doe' })
 */
export function logInfo(message: string, attributes?: Record<string, string>) {
  if (!globalInstance) throw NotInitializedError

  const log = createLog(LogLevel.info, message, attributes)

  globalInstance.sendLog(log)
}

/**
 * Logs a debug message.
 *
 * @param {string} message - The message to log.
 * @param {Record<string, string>} [attributes] - Additional attributes to include in the log.
 * @example
 * logDebug('Hello, world!', { user: 'John Doe' })
 */
export function logDebug(message: string, attributes?: Record<string, string>) {
  if (!globalInstance) throw NotInitializedError

  const log = createLog(LogLevel.debug, message, attributes)

  globalInstance.sendLog(log)
}

/**
 * Logs a warning message.
 *
 * @param {string} message - The message to log.
 * @param {Record<string, string>} [attributes] - Additional attributes to include in the log.
 * @example
 * logWarn('Hello, world!', { user: 'John Doe' })
 */
export function logWarn(message: string, attributes?: Record<string, string>) {
  if (!globalInstance) throw NotInitializedError

  const log = createLog(LogLevel.warn, message, attributes)

  globalInstance.sendLog(log)
}

/**
 * Logs an error message.
 *
 * @param {string} message - The message to log.
 * @param {Record<string, string>} [attributes] - Additional attributes to include in the log.
 * @example
 * logError('Hello, world!', { user: 'John Doe' })
 */
export function logError(message: string, attributes?: Record<string, string>) {
  if (!globalInstance) throw NotInitializedError

  const log = createLog(LogLevel.error, message, attributes)

  globalInstance.sendLog(log)
}

/**
 * Logs a trace message.
 *
 * @param {string} message - The message to log.
 * @param {Record<string, string>} [attributes] - Additional attributes to include in the log.
 * @example
 * logTrace('Hello, world!', { user: 'John Doe' })
 */
export function logTrace(message: string, attributes?: Record<string, string>) {
  if (!globalInstance) throw NotInitializedError

  const log = createLog(LogLevel.trace, message, attributes)

  globalInstance.sendLog(log)
}

// Internal function to passthrough logs to the console.
export function passthroughLog(log: Log, writer: LogPassthroughFn) {
  const { body, level, attributes } = log
  const stringAttributes = Object.entries(attributes)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
  writer(`[${level}] ${body} ${stringAttributes}`)
}

function createLog(
  level: LogLevel,
  message: string,
  attributes?: Record<string, string>,
): Log {
  gateMessage(message)
  gateAttributes(attributes)
  return {
    timestamp: new Date().toISOString(),
    body: message,
    level: level,
    attributes: attributes || {},
  }
}

function gateMessage(message: string): void {
  if (typeof message !== 'string') {
    throw InvalidMessageError
  }
}

function gateAttributes(attributes?: Record<string, string>): void {
  if (attributes === undefined) return

  if (typeof attributes !== 'object' || attributes === null) {
    throw InvalidAttributesError
  }

  for (const [key, value] of Object.entries(attributes)) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw InvalidAttributesError
    }
  }
}
