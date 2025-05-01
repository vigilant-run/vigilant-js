import axios from 'axios'
import { BatcherInvalidTokenError, BatchInternalServerError } from '../messages'
import { AggregatedMetrics, Metric } from './metrics'

// MetricsSender is a class used to send metrics to Vigilant.
export class MetricsSender {
  private endpoint: string
  private token: string
  private senderPromise: Promise<void> | null
  private senderStop = false
  private queue: AggregatedMetrics[]

  constructor(endpoint: string, token: string) {
    this.endpoint = endpoint
    this.token = token
    this.senderPromise = null
    this.queue = []
  }

  // Adds an item to the queue.
  add = (item: AggregatedMetrics) => {
    this.queue.push(item)
    this.flush()
  }

  // Starts the sender.
  start = () => {
    this.senderPromise = new Promise((resolve) => {
      const runSender = async () => {
        while (!this.senderStop) {
          await this.flush()
          await new Promise((r) => setTimeout(r, 1_000))
        }
        await this.flush(true)
        resolve()
      }
      runSender()
    })
  }

  // Shuts down the sender.
  shutdown = async () => {
    this.senderStop = true
    if (this.senderPromise) {
      await this.senderPromise
    }
  }

  // Flushes the queue.
  private async flush(force = false) {
    if (this.queue.length === 0) return
    while (this.queue.length > 0) {
      const metrics = this.queue.splice(0, 1)[0]
      await this.sendMetrics(metrics)
      if (!force) break
    }
  }

  // Sends a batch of metrics to Vigilant.
  private async sendMetrics(metrics: AggregatedMetrics): Promise<void> {
    const payload = {
      token: this.token,
      metrics_counters: metrics.counter,
      metrics_gauges: metrics.gauge,
      metrics_histograms: metrics.histogram,
    }

    const headers = { 'Content-Type': 'application/json' }

    return axios
      .post(this.endpoint, payload, { headers })
      .catch((error) => {
        if (!error.response) throw BatchInternalServerError
        switch (error.response.status) {
          case 401:
            throw BatcherInvalidTokenError
          default:
            throw BatchInternalServerError
        }
      })
      .then(() => {})
  }
}

// Creates a new metrics sender with the given endpoint and token.
export function createMetricsSender(
  endpoint: string,
  token: string,
): MetricsSender {
  return new MetricsSender(endpoint, token)
}
