import { logError } from '@vigilant-js/core'
import { createAlert } from '@vigilant-js/core/dist/types/alerts/alerts'
import {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
  Express,
} from 'express'

/**
 * Express middleware for catching unhandled exceptions
 *
 * This middleware is used to catch unhandled exceptions and log them.
 *
 * Available middleware options (all are default enabled):
 *
 * - exceptions: Captures unhandled exceptions and logs them
 */

/**
 * Configuration for the Vigilant middleware
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
}

/**
 * Adds Vigilant middleware to the Express app
 *
 * See the MiddlewareConfig for more information on all the options.
 *
 * Only use this once in your app after all of your routes are defined.
 *
 * @example
 * addExceptionCapture(app, { withExceptions: false })
 *
 */
export function addExceptionCapture(
  app: Express,
  userConfig?: ExceptionMiddlewareConfig,
): void {
  const config = createConfig(userConfig)

  if (config.withExceptions) {
    app.use(createExceptionCapture(config))
  }
}

type exceptionCaptureConfig = {
  rethrowExceptions?: boolean
  statusCode?: number
  addMessage?: boolean
}

// Creates a middleware function that captures unhandled exceptions
function createExceptionCapture(
  config: exceptionCaptureConfig,
): ErrorRequestHandler {
  return (err: any, req: Request, res: Response, next: NextFunction): void => {
    logError(
      `Caught an unhandled exception for ${req.url}, method: ${req.method}, error: ${err}`,
      {
        url: req.url,
        method: req.method,
        error: err instanceof Error ? err.message : 'Unknown error message',
      },
    )

    if (!res.headersSent) {
      if (config.statusCode) {
        res.status(config.statusCode)
      } else {
        res.status(500)
      }

      if (config.addMessage) {
        res.send({
          error: err.message ?? 'Unknown error',
        })
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
    ...userConfig,
  }
}
