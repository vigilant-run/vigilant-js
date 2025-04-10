import { ConfigNameRequiredError, ConfigTokenRequiredError } from './messages'

/**
 * Config is used to configure the Vigilant global instance when it is created.
 *
 * `name` and `token` are required, the other fields are optional.
 *
 * @example
 * const config = {
 *   name: 'my-app',
 *   token: 'my-token',
 * }
 *
 * initVigilant(config)
 */
export type Config = {
  name: string
  token: string
  endpoint?: string
  insecure?: boolean
  passthrough?: boolean
  autocapture?: boolean
  noop?: boolean
}

export function gateConfig(config: any): void {
  if (!config.name || config.name.trim() === '') {
    throw ConfigNameRequiredError
  }
  if (!config.token || config.token.trim() === '') {
    throw ConfigTokenRequiredError
  }
}
