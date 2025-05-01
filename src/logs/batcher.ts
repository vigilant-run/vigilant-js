import axios from 'axios'
import { BatcherInvalidTokenError, BatchInternalServerError } from '../messages'
import { Log } from './logs'

// LogBatcher is a class used to batch and event batches to Vigilant.
export class LogBatcher {
  private endpoint: string
  private token: string
  private batchInterval: number
  private maxBatchSize: number

  private batcherPromise: Promise<void> | null
  private batchStop = false
  private queue: Log[]

  constructor(
    endpoint: string,
    token: string,
    batchInterval: number,
    maxBatchSize: number,
  ) {
    this.endpoint = endpoint
    this.token = token
    this.batchInterval = batchInterval
    this.maxBatchSize = maxBatchSize

    this.batcherPromise = null
    this.queue = []
  }

  // Adds an item to the queue.
  add = (item: Log) => {
    this.queue.push(item)
    this.flushIfFull()
  }

  // Starts the batcher.
  start = () => {
    this.batcherPromise = new Promise((resolve) => {
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

  // Shuts down the batcher.
  shutdown = async () => {
    this.batchStop = true
    if (this.batcherPromise) {
      await this.batcherPromise
    }
  }

  // Flushes the queue if it is full.
  private flushIfFull = () => {
    if (this.queue.length >= this.maxBatchSize) {
      this.flushBatch()
    }
  }

  // Flushes the queue.
  private async flushBatch(force = false) {
    if (this.queue.length === 0) return
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxBatchSize)
      await this.sendBatch(batch)
      if (!force) break
    }
  }

  // Sends a batch of events to Vigilant.
  private async sendBatch(messages: Log[]): Promise<void> {
    const payload = {
      token: this.token,
      logs: messages,
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

// Creates a new log batcher with the given endpoint, token, type, and key.
// Uses default values for batch interval and max batch size.
export function createLogBatcher(endpoint: string, token: string): LogBatcher {
  return new LogBatcher(endpoint, token, 100, 1_000)
}
