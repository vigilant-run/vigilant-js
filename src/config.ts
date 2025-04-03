import {
  ConfigNameRequiredError,
  ConfigNotValidError,
  ConfigTokenRequiredError,
} from './errors'

// AgentConfig is used to configure the Vigilant Agent when it is created.
export type AgentConfig = {
  name: string
  endpoint: string
  token: string
  insecure: boolean
  passthrough: boolean
  autocapture: boolean
  noop: boolean
}

// AgentConfigBuilder is used to build an AgentConfig.
export class AgentConfigBuilder {
  private config: AgentConfig

  constructor() {
    this.config = {
      name: '',
      token: '',
      endpoint: 'ingress.vigilant.run',
      insecure: false,
      passthrough: true,
      autocapture: true,
      noop: false,
    }
  }

  // Sets the name of the agent.
  withName(name: string): AgentConfigBuilder {
    this.config.name = name
    return this
  }

  // Sets the endpoint of the agent.
  withEndpoint(endpoint: string): AgentConfigBuilder {
    this.config.endpoint = endpoint
    return this
  }

  // Sets the token of the agent.
  withToken(token: string): AgentConfigBuilder {
    this.config.token = token
    return this
  }

  // Sets the insecure flag of the agent.
  withInsecure(): AgentConfigBuilder {
    this.config.insecure = true
    return this
  }

  // Disables the passthrough feature of the agent.
  withoutPassthrough(): AgentConfigBuilder {
    this.config.passthrough = false
    return this
  }

  // Disables the autocapture feature of the agent.
  withoutAutocapture(): AgentConfigBuilder {
    this.config.autocapture = false
    return this
  }

  // Sets the agent to noop mode.
  withNoop(): AgentConfigBuilder {
    this.config.noop = true
    return this
  }

  // Builds the AgentConfig.
  build(): AgentConfig {
    if (this.config.token === '') {
      throw ConfigTokenRequiredError
    }
    if (this.config.name === '') {
      throw ConfigNameRequiredError
    }
    return this.config
  }
}

export function gateConfig(config: any): void {
  if (!isAgentConfig(config)) {
    throw ConfigNotValidError
  }
  if (config.name.trim() === '') {
    throw ConfigNameRequiredError
  }
  if (config.token.trim() === '') {
    throw ConfigTokenRequiredError
  }
}

export function isAgentConfig(config: any): config is AgentConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.name === 'string' &&
    config.name.trim() !== '' &&
    typeof config.token === 'string' &&
    config.token.trim() !== '' &&
    typeof config.endpoint === 'string' &&
    config.endpoint.trim() !== '' &&
    typeof config.insecure === 'boolean' &&
    typeof config.noop === 'boolean' &&
    typeof config.passthrough === 'boolean' &&
    typeof config.autocapture === 'boolean'
  )
}
