import { LogFn, LogPassthroughFn } from '../logs'
import { LogLevel } from '../logs'
import { NodeLogProvider } from './node'
import { NoopLogProvider } from './noop'
import { BunLogProvider } from './bun'

export interface LogProvider {
  enable: () => void
  disable: () => void
  setLogFn: (logFn: LogFn) => void
  getPassthroughFn: (level: LogLevel) => LogPassthroughFn
}

export class LogProviderFactory {
  static create(enabled: boolean): LogProvider {
    if (enabled && BunLogProvider.isAllowed()) {
      const bunLogProvider = new BunLogProvider()
      return bunLogProvider
    } else if (enabled && NodeLogProvider.isAllowed()) {
      const nodeLogProvider = new NodeLogProvider()
      return nodeLogProvider
    } else {
      return new NoopLogProvider()
    }
  }
}
