import { logInfo } from '@vigilant-js/core'
import { Request, Response, NextFunction, RequestHandler } from 'express'
import { v4 } from 'uuid'
import { addAttributes } from '@vigilant-js/core'

// Configuration for the middleware
export type MiddlewareConfig = {
  // Whether to log incoming requests and outgoing responses
  // Default: true
  withLogging?: boolean

  // Whether to add tracing attributes to incoming requests
  // Default: true
  withTracing?: boolean

  // The header name to use for the trace ID
  // Only used if withTracing is true
  // Default: undefined
  traceIdHeader?: string
}

// Creates a middleware function that logs incoming requests, adds tracing attributes, and logs outgoing responses
// If withLogging is true, it will log the incoming request and the outgoing response
// If withTracing is true, it will add the trace ID to the request headers
// If withLogging and withTracing are both false, it will not do anything
// Example usage:
// app.use(createMiddleware())
export function createMiddleware(
  userConfig?: MiddlewareConfig,
): RequestHandler {
  const config = createConfig(userConfig)

  const middlewares: RequestHandler[] = []

  if (config.withTracing) {
    middlewares.push(createTracingMiddleware(config))
  }

  if (config.withLogging) {
    middlewares.push(createRequestLogger())
    middlewares.push(createResponseLogger())
  }

  return chainMiddleware(middlewares)
}

// Creates a middleware function that logs incoming requests
function createRequestLogger(): RequestHandler {
  return (req: Request, _: Response, next: NextFunction): void => {
    logInfo(`[${req.method}] ${req.url}: Request received`, {
      url: req.url,
      method: req.method,
    })
    next()
  }
}

// Creates a middleware function that logs outgoing responses
function createResponseLogger(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      logInfo(`[${req.method}] ${req.url}: ${res.statusCode}`, {
        url: req.url,
        method: req.method,
        status: res.statusCode.toString(),
      })
    })
    next()
  }
}

// Creates a middleware function that adds tracing attributes to incoming requests
type tracingMiddlwareConfig = {
  traceIdHeader?: string
}

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

// Creates a middleware function that chains multiple middleware functions together
function chainMiddleware(middlewares: RequestHandler[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    let index = 0

    function runNextMiddleware(err?: any) {
      if (err) {
        return next(err)
      }
      if (index < middlewares.length) {
        const currentMiddleware = middlewares[index]
        index++
        currentMiddleware(req, res, runNextMiddleware)
      } else {
        next()
      }
    }

    runNextMiddleware()
  }
}

function createConfig(userConfig?: MiddlewareConfig): MiddlewareConfig {
  return {
    withLogging: true,
    withTracing: true,
    traceIdHeader: undefined,
    ...userConfig,
  }
}
