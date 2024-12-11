# Vigilant JS SDK

This is the JavaScript SDK for Vigilant (https://vigilant.run).

## Installation

```bash
npm install vigilant-js
```

## Usage (Standard)
The standard logger is a wrapper around the OpenTelemetry logger. It allows you to log messages with attributes and metadata. The logs are sent to Vigilant and viewable in the dashboard.

```typescript
import { Logger } from 'vigilant-js'

const logger = new Logger({
  name: 'service-name',         // Service name for identification
  url: 'log.vigilant.run:4317', // OTLP gRPC endpoint
  token: 'tk_1234567890',       // Your Vigilant Token
  passthrough: true,            // Also log to console (optional)
  attributes: {                 // Default attributes (optional)
    environment: 'production',
  },
})

// Basic logging
logger.info('User logged in')
logger.warn('Rate limit approaching')
logger.error('Database connection failed')
logger.debug('Processing request')

// Logging with additional attributes
logger.info('Order processed', {
  orderId: '123',
  amount: 99.99,
})

// Error logging with error object
try {
  // ... some code that might throw
} catch (error) {
  logger.error('Operation failed', {}, error)
}

// Application shutdown
await logger.shutdown()
```

## Usage (Autocapture)
There is an additional logger that captures stdout and stderr and logs it to Vigilant. This is allow you to capture logs without using the logger. There is no metadata or attributes attached to the logs.

```typescript
import { AutocaptureLogger } from 'vigilant-js'

// Create the logger
const logger = new AutocaptureLogger({
  name: 'service-name',         // Service name for identification
  url: 'log.vigilant.run:4317', // OTLP gRPC endpoint
  token: 'tk_1234567890',       // Your Vigilant Token
  passthrough: true,            // Also log to console (optional)
  attributes: {                 // Default attributes (optional)
    environment: 'production',
  },
})

// Enable the logger
logger.enable()

// Log some messages 
console.log('Hello, world!')
console.error('Error!')

// Application shutdown
await logger.shutdown()
```
