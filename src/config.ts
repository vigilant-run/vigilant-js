import {
  ConfigNameRequiredError,
  ConfigNotValidError,
  ConfigTokenRequiredError,
} from './messages'

// UserConfig is used to configure the Vigilant global instance when it is created.
export type UserConfig = {
  name: string
  endpoint: string
  token: string
  insecure: boolean
  passthrough: boolean
  autocapture: boolean
  noop: boolean
}

// Config is the internal configuration used by the Vigilant global instance.
export type Config = {
  name: string
  endpoint: string
  token: string
  insecure: boolean
  passthrough: boolean
  autocapture: boolean
  noop: boolean
}

const defaultConfig: Config = {
  name: '',
  token: '',
  endpoint: 'ingress.vigilant.run',
  insecure: false,
  passthrough: true,
  autocapture: true,
  noop: false,
}

export function mergeConfig(userConfig: UserConfig): Config {
  return {
    ...defaultConfig,
    ...userConfig,
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
