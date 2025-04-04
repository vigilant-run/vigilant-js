import { LogLevel, LogPassthroughFn } from './logs'
import { LogProvider } from './provider'

// NoopLogProvider is a log provider that does nothing.
// This log provider will not redirect any logs to the caller.
export class NoopLogProvider implements LogProvider {
  enable = (): void => {}

  disable = (): void => {}

  setLogFn = (): void => {}

  getPassthroughFn = (level: LogLevel): LogPassthroughFn => {
    switch (level) {
      case LogLevel.error:
        return (message: string) => console.error(message)
      default:
        return (message: string) => console.log(message)
    }
  }
}
