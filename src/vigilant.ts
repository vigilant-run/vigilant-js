import { Batcher, createBatcher } from './batcher'
import { Config, gateConfig } from './config'
import { Log, passthroughLog } from './logs/logs'
import { NotInitializedError } from './messages'
import { LogProvider, LogProviderFactory } from './logs/provider'
import {
  AttributeProvider,
  AttributeProviderFactory,
} from './attributes/attributes'

export var globalInstance: Vigilant | null = null
var shutdownRequested = false

// Initialize the global instance with the provided configuration.
// Automatically shuts down the global instance when the process is terminated.
export function init(config: Config) {
  gateConfig(config)
  globalInstance = new Vigilant(config)
  globalInstance.start()

  process.on('exit', shutdownHook)
  process.on('SIGINT', shutdownHook)
  process.on('SIGTERM', shutdownHook)
}

// Manually shutdown the global instance.
export async function shutdown() {
  await shutdownHook()
}

// Vigilant is a class used to send logs, alerts, and metrics to Vigilant.
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

  private logsBatcher: Batcher<Log>

  constructor(config: Config) {
    this.name = config.name
    this.endpoint = createFormattedEndpoint(config.endpoint, config.insecure)
    this.token = config.token
    this.noop = config.noop
    this.passthrough = config.passthrough
    this.autocapture = config.autocapture

    this.logProvider = null
    this.attributeProvider = null

    this.logsBatcher = createLogBatcher(this.endpoint, this.token)
  }

  // Start the global instance. This will start the event batchers.
  start = () => {
    this.logsBatcher.start()

    const attributeProvider = AttributeProviderFactory.create()
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
}

function createLogBatcher(endpoint: string, token: string): Batcher<Log> {
  return createBatcher(endpoint, token, 'logs', 'logs')
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

async function shutdownHook() {
  if (shutdownRequested) return
  shutdownRequested = true

  if (!globalInstance) throw NotInitializedError
  await globalInstance.shutdown()

  globalInstance = null
}
