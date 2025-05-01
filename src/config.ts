import {
  ConfigNameRequiredError,
  ConfigNotValidError,
  ConfigTokenRequiredError,
} from './messages'

// Config is used to configure the Vigilant global instance when it is created.
export type Config = {
  name: string
  endpoint: string
  token: string
  insecure: boolean
  passthrough: boolean
  autocapture: boolean
  noop: boolean
}

// ConfigBuilder is used to build a Config.
export class ConfigBuilder {
  private config: Config

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

  // Sets the name added to all logs.
  withName(name: string): ConfigBuilder {
    this.config.name = name
    return this
  }

  // Sets the endpoint used by Vigilant.
  withEndpoint(endpoint: string): ConfigBuilder {
    this.config.endpoint = endpoint
    return this
  }

  // Sets the token of used by Vigilant.
  withToken(token: string): ConfigBuilder {
    this.config.token = token
    return this
  }

  // Sets Vigilant to use an insecure endpoint.
  withInsecure(): ConfigBuilder {
    this.config.insecure = true
    return this
  }

  // Disables the passthrough feature of Vigilant.
  withoutPassthrough(): ConfigBuilder {
    this.config.passthrough = false
    return this
  }

  // Disables the autocapture feature of Vigilant.
  withoutAutocapture(): ConfigBuilder {
    this.config.autocapture = false
    return this
  }

  // Starts Vigilant in noop mode.
  withNoop(): ConfigBuilder {
    this.config.noop = true
    return this
  }

  // Builds the Config.
  build(): Config {
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
  if (!isConfig(config)) {
    throw ConfigNotValidError
  }
  if (config.name.trim() === '') {
    throw ConfigNameRequiredError
  }
  if (config.token.trim() === '') {
    throw ConfigTokenRequiredError
  }
}

export function isConfig(config: any): config is Config {
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
