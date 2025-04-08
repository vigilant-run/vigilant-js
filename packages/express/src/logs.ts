import { v4 } from 'uuid'
import { addAttributes, logInfo } from '@vigilant-js/core'
import {
  Express,
  NextFunction,
  Request,
  Response,
  RequestHandler,
} from 'express'

/**
 * Express middleware for logging and tracing requests
 *
 * This middleware is used to log incoming requests and outgoing responses,
 * and to add tracing attributes to incoming requests.
 *
 * Available middleware features (all are default enabled):
 *
 * - tracing: Adds a trace ID to incoming requests
 * - logging: Logs incoming requests and outgoing responses
 * - timing: Logs the time it takes to process requests
 */

/**
 * Configuration for the Vigilant middleware
 *
 * Use this to configure the middleware
 *
 * Each parameter is optional and all middleware is enabled by default
 * */
export type LoggingMiddlewareConfig = {
  /**
   * Whether to add tracing attributes to incoming requests
   *
   * @default true
   */
  withTracing?: boolean

  /**
   * The header name to use for the trace ID, only used if withTracing is true
   *
   * @default undefined
   */
  traceIdHeader?: string

  /**
   * Whether to log incoming requests and outgoing responses
   *
   * @default true
   */
  withIncomingLogs?: boolean

  /**
   * Whether to log outgoing responses
   *
   * @default true
   */
  withOutgoingLogs?: boolean
}

/**
 * Adds Vigilant middleware to the Express app
 *
 * See the MiddlewareConfig for more information on all the options.
 *
 * Only use this once in your app at the top of your server file.
 *
 * @example
 * addLogging(app)
 *
 */
export function addLoggingMiddleware(
  app: Express,
  userConfig?: LoggingMiddlewareConfig,
): void {
  const config = createConfig(userConfig)

  if (config.withTracing) {
    app.use(createTracingMiddleware(config))
  }

  if (config.withIncomingLogs) {
    app.use(createRequestLogger())
  }

  if (config.withOutgoingLogs) {
    app.use(createResponseLogger())
  }
}

type tracingMiddlwareConfig = {
  traceIdHeader?: string
}

// Creates a middleware function that adds tracing attributes to incoming requests
function createTracingMiddleware(
  config: tracingMiddlwareConfig,
): RequestHandler {
  return (req: Request, _: Response, next: NextFunction): void => {
    const header = config.traceIdHeader ?? 'x-trace-id'
    let traceId = ''
    if (req.headers[header] && typeof req.headers[header] === 'string') {
      traceId = req.headers[header] as string
    } else {
      traceId = v4()
    }
    addAttributes({ 'trace.id': traceId }, next)
  }
}

// Creates a middleware function that logs incoming requests
function createRequestLogger(): RequestHandler {
  return (req: Request, _: Response, next: NextFunction): void => {
    logInfo(`Incoming request for ${req.url}, method: ${req.method}`, {
      'request.url': req.url,
      'request.method': req.method,
      'request.body': JSON.stringify(req.body, null, 2),
    })
    next()
  }
}

// Creates a middleware function that logs outgoing responses
function createResponseLogger(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime()
    res.on('finish', () => {
      const endTime = process.hrtime(startTime)
      const duration = endTime[0] * 1000 + endTime[1] / 1e6
      logInfo(
        `Outgoing response for ${req.url}, method: ${req.method}, status: ${res.statusCode}`,
        {
          'request.url': req.url,
          'request.method': req.method,
          'request.body': JSON.stringify(req.body, null, 2),
          'response.status': res.statusCode.toString(),
          'response.duration': `${duration}ms`,
        },
      )
    })
    next()
  }
}

// Creates the final logging middleware config from the user config
// All of the middleware options are enabled by default
function createConfig(
  userConfig?: LoggingMiddlewareConfig,
): LoggingMiddlewareConfig {
  return {
    withIncomingLogs: true,
    withOutgoingLogs: true,
    withTracing: true,
    ...userConfig,
  }
}
