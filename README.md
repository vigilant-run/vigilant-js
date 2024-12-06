# Vigilant JS SDK

This is the JavaScript SDK for Vigilant (https://vigilant.run).

## Installation

```bash
npm install vigilant-js
```

## Usage

```typescript
import { Logger } from 'vigilant-js'

const logger = new Logger({
  name: 'my-service', // Service name for identification
  url: 'otel.vigilant.run:4317', // OTLP gRPC endpoint
  token: 'tk_1234567890', // Your Vigilant Token
  passthrough: true, // Also log to console (optional)
  attributes: {
    // Default attributes (optional)
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
  logger.error('Operation failed', error)
}

// Format string logging
logger.debugf('Processing user %s with role %s', 'john', 'admin')
```
