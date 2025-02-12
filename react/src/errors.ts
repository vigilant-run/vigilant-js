import { Attributes } from './attributes'
import axios from 'axios'

var globalErrorHandler: ErrorHandler | null = null

export interface ErrorHandlerOptions {
  name?: string
  token?: string
  endpoint?: string
  insecure?: boolean
  noop?: boolean
}

export function initErrorHandler(options: ErrorHandlerOptions) {
  globalErrorHandler = new ErrorHandler(options)
}

export async function shutdownErrorHandler() {
  if (!globalErrorHandler) return
  await globalErrorHandler.shutdown()
}

export function captureError(error: Error, attrs: Attributes = {}) {
  if (!globalErrorHandler) return
  globalErrorHandler.captureError(error, attrs)
}

class ErrorHandler {
  private name: string
  private endpoint: string
  private token: string
  private insecure: boolean
  private noop: boolean

  private errorsQueue: CapturedError[] = []
  private batchStop = false
  private batcherPromise: Promise<void> | null = null
  private batchInterval = 100
  private maxBatchSize = 100

  constructor(options: ErrorHandlerOptions) {
    this.name = options.name ?? 'sample-app'
    this.token = options.token ?? 'tk_1234567890'
    this.endpoint = options.endpoint ?? 'ingress.vigilant.run'
    this.insecure = options.insecure ?? false
    this.noop = options.noop ?? false

    this.startBatcher()
  }

  captureError(error: Error, attrs: Attributes = {}): void {
    if (this.noop) return
    this.capture(error, {
      ...attrs,
      'service.name': this.name,
    })
  }

  async shutdown(): Promise<void> {
    this.batchStop = true
    if (this.batcherPromise) {
      await this.batcherPromise
    }
  }

  private capture(error: Error, attrs: Attributes = {}): void {
    this.errorsQueue.push({
      timestamp: getNowTimestamp(),
      details: getErrorDetails(error),
      location: getErrorLocation(error),
      attributes: attrs,
    })
  }

  private startBatcher() {
    this.batcherPromise = new Promise<void>((resolve) => {
      const runBatcher = async () => {
        while (!this.batchStop) {
          await this.flushBatch()
          await new Promise((r) => setTimeout(r, this.batchInterval))
        }
        await this.flushBatch(true)
        resolve()
      }
      runBatcher()
    })
  }

  private async flushBatch(force = false) {
    if (this.errorsQueue.length === 0) return

    while (this.errorsQueue.length > 0) {
      const batch = this.errorsQueue.splice(0, this.maxBatchSize)
      await this.sendBatch(batch)
      if (!force) break
    }
  }

  private async sendBatch(batch: CapturedError[]) {
    if (batch.length === 0 || this.noop) return

    const payload: MessageBatch = {
      token: this.token,
      type: 'errors',
      errors: batch,
    }

    try {
      const endpoint = formatEndpoint(this.endpoint, this.insecure)
      await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {}
  }
}

function formatEndpoint(endpoint: string, insecure: boolean): string {
  if (endpoint === '') {
    return 'ingress.vigilant.run/api/message'
  } else if (insecure) {
    return `http://${endpoint}/api/message`
  } else {
    return `https://${endpoint}/api/message`
  }
}

function getNowTimestamp(): string {
  return new Date().toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
}

function getErrorDetails(error: Error): ErrorDetails {
  return {
    type: error.name,
    message: error.message,
    stacktrace: error.stack ?? '',
  }
}

function getErrorLocation(error: Error): ErrorLocation {
  const stack = error.stack ?? ''
  const lines = stack.split('\n')

  const locationLine = lines
    .slice(1)
    .find((line) => line.trim().startsWith('at'))
  if (!locationLine) {
    return { function: 'anonymous', file: '', line: 0 }
  }

  const trimmed = locationLine.trim()
  const funcRegex = /^at (.+?) \((.*?):(\d+):(\d+)\)$/
  const matchFunc = trimmed.match(funcRegex)
  if (matchFunc) {
    return {
      function: matchFunc[1] || 'anonymous',
      file: matchFunc[2] || '',
      line: parseInt(matchFunc[3]) || 0,
    }
  }

  const fileRegex = /^at (.*?):(\d+):(\d+)$/
  const matchFile = trimmed.match(fileRegex)
  if (matchFile) {
    return {
      function: 'anonymous',
      file: matchFile[1] || '',
      line: parseInt(matchFile[2]) || 0,
    }
  }

  return {
    function: 'anonymous',
    file: trimmed.replace(/^at\s+/, ''),
    line: 0,
  }
}

type ErrorDetails = {
  type: string
  message: string
  stacktrace: string
}

type ErrorLocation = {
  function: string
  file: string
  line: number
}

type CapturedError = {
  timestamp: string
  details: ErrorDetails
  location: ErrorLocation
  attributes: Attributes
}

type MessageBatchType = 'errors'

type MessageBatch = {
  token: string
  type: MessageBatchType
  errors: CapturedError[]
}
