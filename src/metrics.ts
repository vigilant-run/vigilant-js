import { Attributes } from './attributes'
import { getAttributes } from './storage'
import axios from 'axios'

var globalMetricsHandler: MetricsHandler | null = null

export interface MetricsHandlerOptions {
  name?: string
  token?: string
  endpoint?: string
  insecure?: boolean
  noop?: boolean
}

export function initMetricsHandler(options: MetricsHandlerOptions) {
  globalMetricsHandler = new MetricsHandler(options)
}

export async function shutdownMetricsHandler() {
  if (!globalMetricsHandler) return
  await globalMetricsHandler.shutdown()
}

export function emitMetric(
  name: string,
  value: number,
  attrs: Attributes = {},
) {
  if (!globalMetricsHandler) return
  globalMetricsHandler.emitMetric(name, value, attrs)
}

class MetricsHandler {
  private name: string
  private endpoint: string
  private token: string
  private insecure: boolean
  private noop: boolean

  private metricsQueue: CapturedMetric[] = []
  private batchStop = false
  private batcherPromise: Promise<void> | null = null
  private batchInterval = 100
  private maxBatchSize = 100

  constructor(options: MetricsHandlerOptions) {
    this.name = options.name ?? 'sample-app'
    this.token = options.token ?? 'tk_1234567890'
    this.endpoint = options.endpoint ?? 'ingress.vigilant.run'
    this.insecure = options.insecure ?? false
    this.noop = options.noop ?? false

    this.startBatcher()
  }

  emitMetric(name: string, value: number, attrs: Attributes = {}): void {
    if (this.noop) return
    this.capture(name, value, {
      ...this.getStoredAttributes(),
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

  private capture(name: string, value: number, attrs: Attributes = {}): void {
    const capturedMetric: CapturedMetric = {
      timestamp: getNowTimestamp(),
      name: name,
      value: value,
      attributes: attrs,
    }

    if (shouldIgnoreMetric(capturedMetric)) {
      return
    }

    this.metricsQueue.push(capturedMetric)
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
    if (this.metricsQueue.length === 0) return

    while (this.metricsQueue.length > 0) {
      const batch = this.metricsQueue.splice(0, this.maxBatchSize)
      await this.sendBatch(batch)
      if (!force) break
    }
  }

  private async sendBatch(batch: CapturedMetric[]) {
    if (batch.length === 0 || this.noop) return

    const payload: MessageBatch = {
      token: this.token,
      type: 'metrics',
      metrics: batch,
    }

    try {
      const endpoint = formatEndpoint(this.endpoint, this.insecure)
      await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {}
  }

  private getStoredAttributes(): Attributes {
    return getAttributes()
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

function shouldIgnoreMetric(capturedMetric: CapturedMetric): boolean {
  return capturedMetric.name === ''
}

type CapturedMetric = {
  timestamp: string
  name: string
  value: number
  attributes: Attributes
}

type MessageBatchType = 'metrics'

type MessageBatch = {
  token: string
  type: MessageBatchType
  metrics: CapturedMetric[]
}
