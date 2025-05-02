import { LogBatcher, createLogBatcher } from './logs/batcher'
import { gateConfig, mergeConfig, UserConfig } from './config'
import { Log, passthroughLog } from './logs/logs'
import { NotInitializedError } from './messages'
import { LogProvider, LogProviderFactory } from './logs/provider'
import {
  AttributeProvider,
  AttributeProviderFactory,
} from './attributes/attributes'
import { CounterEvent, GaugeEvent, HistogramEvent } from './metrics/metrics'
import { createMetricsCollector, MetricCollector } from './metrics/collector'

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
  private metricsCollector: MetricCollector

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
    this.metricsCollector = createMetricsCollector(this.endpoint, this.token)
  }

  // Start the global instance. This will start the event batchers.
  start = () => {
    this.logsBatcher.start()
    this.metricsCollector.start()

    const attributeProvider = AttributeProviderFactory.create(this.name)
    this.attributeProvider = attributeProvider

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
    await this.metricsCollector.shutdown()
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

  // Queues a counter metric to be sent.
  sendCounter = (metric: CounterEvent) => {
    if (this.noop) return
    this.metricsCollector.addCounter(metric)
  }

  // Queues a gauge metric to be sent.
  sendGauge = (metric: GaugeEvent) => {
    if (this.noop) return
    this.metricsCollector.addGauge(metric)
  }

  // Queues a histogram metric to be sent.
  sendHistogram = (metric: HistogramEvent) => {
    if (this.noop) return
    this.metricsCollector.addHistogram(metric)
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
