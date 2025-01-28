# Vigilant JS SDK

This is the JavaScript SDK for Vigilant (https://vigilant.run).

## Requirements

- Node.js v16.4.0+

## Installation

```bash
npm install vigilant-js
```

## Logging Usage (Standard)
```typescript
import { Logger } from 'vigilant-js'

const logger = new Logger({
  name: 'service-name',
  endpoint: 'ingress.vigilant.run',
  token: 'tk_1234567890',
})

// Basic logging
logger.info('User logged in')
logger.warn('Rate limit approaching')
logger.error('Database connection failed')
logger.debug('Processing request')

// Logging with additional attributes
logger.info('Order processed', { orderId: '123', amount: 99.99 })

// Application shutdown
await logger.shutdown()
```

## Logging Usage (Autocapture)
```typescript
import { Logger } from 'vigilant-js'

// Create the logger
const logger = new Logger({
  name: 'service-name',
  endpoint: 'log.vigilant.run:4317',
  token: 'tk_1234567890',
})

// Enable the logger
logger.autocapture_enable()

// Log some messages to stdout and stderr
console.log('Hello, world!')
console.error('Error!')

// Application shutdown
await logger.shutdown()
```

## Logging Usage (Attributes)
Note: This is only avaiable in a Node.js environment.

```typescript
import { Logger, addAttributes, clearAttributes, removeAttributes } from 'vigilant-js'

// Create a logger
const logger = new Logger({
  name: 'service-name',
  endpoint: 'log.vigilant.run:4317',
  token: 'tk_0123456789',
})

// Enable the logger
logger.autocapture_enable()

// Add an attribute
addAttributes({ user_id: '1', another_user_id: '2' }, () => {
  console.log('Testing with two attributes')

  // Remove one attribute
  removeAttributes(['user_id'], () => {
    console.log('Testing with one attribute')

    // Clear all attributes
    clearAttributes(() => {
      console.log('Testing without attributes')
    })
  })
})

// Shutdown the logger
await logger.shutdown()
```
