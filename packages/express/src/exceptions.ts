import { logError, createAlert } from '@vigilant-js/core'
import {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
  Express,
} from 'express'
import { parseRoute } from './utils'

/**
 * Express middleware for catching unhandled exceptions
 *
 * This middleware is used to catch unhandled exceptions and log them.
 *
 * Available middleware features (all are default enabled):
 *
 * - exceptions: Captures unhandled exceptions and logs them
 * - alerts: Creates an alert for unhandled exceptions
 */

/**
 * Configuration for the Vigilant exception middleware
 *
 * Use this to configure the middleware
 *
 * Each parameter is optional and all middleware is enabled by default
 * */
export type ExceptionMiddlewareConfig = {
  /**
   * Whether to catch unhandled exceptions
   *
   * @default true
   */
  withExceptions?: boolean

  /**
   * Whether to rethrow unhandled exceptions, only used if withExceptions is true
   *
   * @default false
   */
  rethrowExceptions?: boolean

  /**
   * The status code to send when an unhandled exception is caught
   *
   * @default 500
   */
  statusCode?: number

  /**
   * Whether to add the error message to the response body
   *
   * @default true
   */
  addMessage?: boolean

  /**
   * Whether to create an alert for an unhandled exception
   *
   * @default true
   */
  createAlert?: boolean
}

/**
 * Adds Vigilant middleware to the Express app
 *
 * See the ExceptionMiddlewareConfig for more information on all the options.
 *
 * Only use this once in your app after all of your routes are defined.
 *
 * @example
 * addExceptionMiddleware(app, { withExceptions: false })
 *
 */
export function addExceptionMiddleware(
  app: Express,
  userConfig?: ExceptionMiddlewareConfig,
): void {
  const config = createConfig(userConfig)

  if (config.withExceptions) {
    app.use(createExceptionMiddleware(config))
  }
}

// Creates a middleware function that captures unhandled exceptions
function createExceptionMiddleware(
  config: ExceptionMiddlewareConfig,
): ErrorRequestHandler {
  return (err: any, req: Request, res: Response, next: NextFunction): void => {
    const attributes: Record<string, string> = {
      'request.url': req.url,
      'request.route': parseRoute(req),
      'request.method': req.method,
      'request.headers': JSON.stringify(req.headers ?? {}, null, 2),
      ...(err instanceof Error && {
        'error.name': err.name,
        'error.message': err.message,
        'error.stack': err.stack ?? 'No stack trace',
      }),
    }

    try {
      attributes['request.body'] = JSON.stringify(req.body ?? {}, null, 2)
    } catch (error) {}

    logError(
      `Caught an unhandled exception for ${req.url}, method: ${req.method}, error: ${err}`,
      attributes,
    )

    if (config.createAlert) {
      createAlert(
        `Unhandled exception for route ${parseRoute(req)}`,
        attributes,
      )
    }

    if (!res.headersSent) {
      if (config.statusCode) {
        res.status(config.statusCode)
      } else {
        res.status(500)
      }

      if (config.addMessage) {
        res.send({ error: err.message ?? 'Unknown error' })
      } else {
        res.send()
      }
    }

    if (config.rethrowExceptions) {
      next(err)
    }
  }
}

// Creates the final middleware config from the user config
// All of the middleware options are enabled by default
function createConfig(
  userConfig?: ExceptionMiddlewareConfig,
): ExceptionMiddlewareConfig {
  return {
    withExceptions: true,
    statusCode: 500,
    createAlert: true,
    ...userConfig,
  }
}
