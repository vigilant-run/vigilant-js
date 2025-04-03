import { Batcher, createBatcher } from './batcher'
import { AgentConfig, gateConfig } from './config'
import { Log, passthroughLog } from './logs'
import { AgentNotInitializedError } from './errors'

export var globalAgent: Agent | null = null

export function init(config: AgentConfig) {
  gateConfig(config)
  globalAgent = new Agent(config)
}

export async function shutdown() {
  if (!globalAgent) throw AgentNotInitializedError

  await globalAgent.shutdown()
  globalAgent = null
}

// Agent is a class used to send logs, alerts, and metrics to Vigilant.
// It can be configured to be a noop, which will prevent it from sending any data to Vigilant.
// It requires a name, endpoint, and token to be configured properly.
export class Agent {
  private name: string
  private endpoint: string
  private token: string
  private noop: boolean
  private passthrough: boolean
  private passthroughWriter: (message: string) => void

  private logsBatcher: Batcher<Log>

  constructor(config: AgentConfig) {
    this.name = config.name
    this.endpoint = createFormattedEndpoint(config.endpoint, config.insecure)
    this.token = config.token
    this.noop = config.noop
    this.passthrough = config.passthrough
    this.passthroughWriter = config.passthroughWriter

    this.logsBatcher = createLogBatcher(this.endpoint, this.token)
  }

  // Start the agent. This will start the event batchers.
  start = () => {
    this.logsBatcher.start()
  }

  // Shutdown the agent. This will shutdown the event batchers.
  shutdown = async () => {
    await this.logsBatcher.shutdown()
  }

  // Queues a log to be sent.
  sendLog = (log: Log) => {
    if (this.passthrough) {
      passthroughLog(log, this.passthroughWriter)
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
