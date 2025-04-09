import { Request } from 'express'

// Helper function to parse the route from the request
export function parseRoute(req: Request): string {
  const truncatedPath = req.route?.path?.split(':')[0]
  if (truncatedPath === '/') {
    return req.url?.split('?')[0]
  }
  const prefix = req.url?.split(truncatedPath ?? '')[0]
  return prefix + req.route?.path
}
