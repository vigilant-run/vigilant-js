import { globalInstance } from '../vigilant'
import {
  NotInitializedError,
  InvalidLogMessageWarning,
  InvalidAttributesWarning,
} from '../messages'
import { getCurrentTime } from '../utils'

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
 *
 * @example
 * logInfo('Hello, world!', { user: 'John Doe' })
 */
export function logInfo(message: string, attributes?: Record<string, string>) {
  if (!globalInstance) throw NotInitializedError

  const log = createLogInstance(LogLevel.info, message, attributes)
  if (!log) return

  globalInstance.sendLog(log)
}

/**
 * Logs a debug message.
 *
 * @param {string} message - The message to log.
 * @param {Record<string, string>} [attributes] - Additional attributes to include in the log.
 *
 * @example
 * logDebug('Hello, world!', { user: 'John Doe' })
 */
export function logDebug(message: string, attributes?: Record<string, string>) {
  if (!globalInstance) throw NotInitializedError

  const log = createLogInstance(LogLevel.debug, message, attributes)
  if (!log) return

  globalInstance.sendLog(log)
}

/**
 * Logs a warning message.
 *
 * @param {string} message - The message to log.
 * @param {Record<string, string>} [attributes] - Additional attributes to include in the log.
 *
 * @example
 * logWarn('Hello, world!', { user: 'John Doe' })
 */
export function logWarn(message: string, attributes?: Record<string, string>) {
  if (!globalInstance) throw NotInitializedError

  const log = createLogInstance(LogLevel.warn, message, attributes)
  if (!log) return

  globalInstance.sendLog(log)
}

/**
 * Logs an error message.
 *
 * @param {string} message - The message to log.
 * @param {Record<string, string>} [attributes] - Additional attributes to include in the log.
 *
 * @example
 * logError('Hello, world!', { user: 'John Doe' })
 */
export function logError(message: string, attributes?: Record<string, string>) {
  if (!globalInstance) throw NotInitializedError

  const log = createLogInstance(LogLevel.error, message, attributes)
  if (!log) return

  globalInstance.sendLog(log)
}

/**
 * Logs a trace message.
 *
 * @param {string} message - The message to log.
 * @param {Record<string, string>} [attributes] - Additional attributes to include in the log.
 *
 * @example
 * logTrace('Hello, world!', { user: 'John Doe' })
 */
export function logTrace(message: string, attributes?: Record<string, string>) {
  if (!globalInstance) throw NotInitializedError

  const log = createLogInstance(LogLevel.trace, message, attributes)
  if (!log) return

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

function createLogInstance(
  level: LogLevel,
  message: string,
  attributes?: Record<string, string>,
): Log | null {
  if (!gateInvalidMessage(message)) return null
  return {
    timestamp: getCurrentTime(),
    body: message,
    level: level,
    attributes: filterInvalidAttributes(attributes ?? {}),
  }
}

// Returns null if the message is invalid.
function gateInvalidMessage(message: string): string | null {
  if (typeof message !== 'string') {
    logWarn(InvalidLogMessageWarning(message))
    return null
  }
  return message
}

// Filters out invalid attributes from the attributes map.
function filterInvalidAttributes(
  attributes: Record<string, string>,
): Record<string, string> {
  const validAttributes: Record<string, string> = {}
  const invalidAttributes: Record<string, string> = {}
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      invalidAttributes[key] = value
    } else {
      validAttributes[key] = value
    }
  }
  if (Object.keys(invalidAttributes).length > 0) {
    logWarn(InvalidAttributesWarning(invalidAttributes))
  }
  return validAttributes
}
