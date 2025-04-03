import { globalAgent } from './agent'
import {
  AgentNotInitializedError,
  InvalidAttributesError,
  InvalidMessageError,
} from './errors'

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

export function passthroughLog(log: Log, writer: (message: string) => void) {
  const { timestamp, body, level, attributes } = log
  const stringAttributes = Object.entries(attributes)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
  writer(`[${timestamp}] [${level}] ${body} ${stringAttributes}`)
}

/**
 * Logs an info message.
 *
 * @param {string} message - The message to log.
 * @param {Record<string, string>} [attributes] - Additional attributes to include in the log.
 * @example
 * logInfo('Hello, world!', { user: 'John Doe' })
 */
export function logInfo(message: string, attributes?: Record<string, string>) {
  if (!globalAgent) throw AgentNotInitializedError

  const log = createLog(LogLevel.info, message, attributes)

  globalAgent.sendLog(log)
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
  if (!globalAgent) throw AgentNotInitializedError

  const log = createLog(LogLevel.debug, message, attributes)

  globalAgent.sendLog(log)
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
  if (!globalAgent) throw AgentNotInitializedError

  const log = createLog(LogLevel.warn, message, attributes)

  globalAgent.sendLog(log)
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
  if (!globalAgent) throw AgentNotInitializedError

  const log = createLog(LogLevel.error, message, attributes)

  globalAgent.sendLog(log)
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
  if (!globalAgent) throw AgentNotInitializedError

  const log = createLog(LogLevel.trace, message, attributes)

  globalAgent.sendLog(log)
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
