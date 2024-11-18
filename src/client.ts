interface VigilantLoggerOptions {
  apiKey: string
  baseUrl: string
}

class VigilantLogger {
  private config: VigilantLoggerOptions

  constructor(options: VigilantLoggerOptions) {
    this.config = options
  }

  info = (event: string) => {
    console.log(`[INFO] ${event}`)
  }

  warn = (event: string) => {
    console.log(`[WARN] ${event}`)
  }

  error = (event: string) => {
    console.log(`[ERROR] ${event}`)
  }
}

export { VigilantLogger }
