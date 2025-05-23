import { LogBatcher, createLogBatcher } from './logs/batcher'
import { gateConfig, mergeConfig, UserConfig } from './config'
import { Log, passthroughLog } from './logs/logs'
import { NotInitializedError } from './messages'
import { LogProvider, LogProviderFactory } from './logs/provider'
import {
  AttributeProvider,
  AttributeProviderFactory,
} from './attributes/attributes'
import { Metric } from './metrics/metrics'
import { createMetricBatcher, MetricBatcher } from './metrics/batcher'

export var globalInstance: Vigilant | null = null

// Initialize the global instance with the provided configuration.
// Automatically shuts down the global instance when the process is terminated.
export function initVigilant(config: UserConfig) {
  const mergedConfig = mergeConfig(config)
  gateConfig(mergedConfig)
  globalInstance = new Vigilant(mergedConfig)
  globalInstance.start()
  addShutdownListeners()
}

// Manually shutdown the global instance.
export async function shutdownVigilant() {
  await handleShutdown()
}

// Vigilant is a class used to send logs and metrics to Vigilant.
// It can be configured to be a noop, which will prevent it from sending any data to Vigilant.
// It requires a name, endpoint, and token to be configured properly.
export class Vigilant {
  private name: string
  private endpoint: string
  private token: string
  private noop: boolean
  private passthrough: boolean
  private autocapture: boolean

  private logProvider: LogProvider | null
  private attributeProvider: AttributeProvider | null

  private logsBatcher: LogBatcher
  private metricsBatcher: MetricBatcher

  constructor(config: UserConfig) {
    this.name = config.name
    this.endpoint = createFormattedEndpoint(config.endpoint, config.insecure)
    this.token = config.token
    this.noop = config.noop
    this.passthrough = config.passthrough
    this.autocapture = config.autocapture

    this.logProvider = null
    this.attributeProvider = null

    this.logsBatcher = createLogBatcher(this.endpoint, this.token)
    this.metricsBatcher = createMetricBatcher(this.endpoint, this.token)

    const attributes = { service: this.name, ...config.attributes }
    const attributeProvider = AttributeProviderFactory.create(attributes)
    this.attributeProvider = attributeProvider
  }

  // Start the global instance. This will start the event batchers.
  start = () => {
    this.logsBatcher.start()
    this.metricsBatcher.start()

    const enabled = this.autocapture && !this.noop
    const logProvider = LogProviderFactory.create(enabled)
    this.logProvider = logProvider
    this.logProvider.setLogFn(this.sendLog)
    this.logProvider.enable()
  }

  // Shutdown the global instance. This will shutdown the event batchers.
  shutdown = async () => {
    this.logProvider?.disable()
    await this.logsBatcher.shutdown()
    await this.metricsBatcher.shutdown()
  }

  // Queues a log to be sent.
  sendLog = (log: Log) => {
    if (this.attributeProvider) {
      this.attributeProvider.update(log.attributes)
    }

    if (this.passthrough && this.logProvider) {
      passthroughLog(log, this.logProvider.getPassthroughFn(log.level))
    }

    if (this.noop) return

    this.logsBatcher.add(log)
  }

  // Queues a metric to be sent.
  sendMetric = (metric: Metric) => {
    if (this.noop) return

    this.metricsBatcher.add(metric)
  }
}

function createFormattedEndpoint(endpoint: string, insecure: boolean): string {
  let prefix: string
  if (insecure) {
    prefix = 'http://'
  } else {
    prefix = 'https://'
  }
  return prefix + endpoint + '/api/message'
}

var shutdownRequested = false

async function handleShutdown() {
  if (shutdownRequested) return
  shutdownRequested = true

  try {
    if (!globalInstance) throw NotInitializedError
    await globalInstance.shutdown()
  } catch (error) {
    console.error('Error during shutdown:', error)
  } finally {
    globalInstance = null
    removeShutdownListeners()
  }
}

async function addShutdownListeners() {
  process.on('exit', handleShutdown)
  process.on('SIGINT', handleShutdown)
  process.on('SIGTERM', handleShutdown)
}

async function removeShutdownListeners() {
  process.removeListener('exit', handleShutdown)
  process.removeListener('SIGINT', handleShutdown)
  process.removeListener('SIGTERM', handleShutdown)
}
