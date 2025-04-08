import { Batcher, createBatcher } from './batcher'
import { Config, gateConfig } from './config'
import { Log, LogLevel, passthroughLog } from './logs/logs'
import { Alert, passthroughAlert } from './alerts/alerts'
import { NotInitializedError } from './messages'
import { LogProvider, LogProviderFactory } from './logs/provider'
import {
  AttributeProvider,
  AttributeProviderFactory,
} from './attributes/attributes'

const defaultConfig: VigilantConfig = {
  name: 'backend',
  token: 'generated-token-here',
  endpoint: 'ingress.vigilant.run',
  insecure: false,
  passthrough: false,
  autocapture: true,
  noop: false,
}

type VigilantConfig = {
  name: string
  token: string
  endpoint: string
  insecure: boolean
  passthrough: boolean
  autocapture: boolean
  noop: boolean
}

export var globalInstance: Vigilant | null = null

// Initialize the global instance with the provided configuration.
// Automatically shuts down the global instance when the process is terminated.
export function init(config: Config) {
  gateConfig(config)
  globalInstance = new Vigilant({ ...defaultConfig, ...config })
  globalInstance.start()
  addShutdownListeners()
}

// Manually shutdown the global instance.
export async function shutdown() {
  await handleShutdown()
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
  private alertsBatcher: Batcher<Alert>

  constructor(config: VigilantConfig) {
    this.name = config.name
    this.endpoint = createFormattedEndpoint(config.endpoint, config.insecure)
    this.token = config.token
    this.noop = config.noop
    this.passthrough = config.passthrough
    this.autocapture = config.autocapture

    this.logProvider = null
    this.attributeProvider = null

    this.logsBatcher = createLogBatcher(this.endpoint, this.token)
    this.alertsBatcher = createAlertBatcher(this.endpoint, this.token)
  }

  // Start the global instance. This will start the event batchers.
  start = () => {
    this.logsBatcher.start()
    this.alertsBatcher.start()

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
    await Promise.all([
      this.alertsBatcher.shutdown(),
      this.logsBatcher.shutdown(),
    ])
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

  // Queues an alert to be sent.
  sendAlert = (alert: Alert) => {
    if (this.attributeProvider) {
      this.attributeProvider.update(alert.attributes)
    }

    if (this.passthrough && this.logProvider) {
      passthroughAlert(alert, this.logProvider.getPassthroughFn(LogLevel.error))
    }

    if (this.noop) return

    this.alertsBatcher.add(alert)
  }
}

function createLogBatcher(endpoint: string, token: string): Batcher<Log> {
  return createBatcher(endpoint, token, 'logs', 'logs')
}

function createAlertBatcher(endpoint: string, token: string): Batcher<Alert> {
  return createBatcher(endpoint, token, 'alerts', 'alerts')
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
}

async function removeShutdownListeners() {
  process.removeListener('exit', handleShutdown)
}
