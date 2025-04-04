# Vigilant JS SDK

This is the JavaScript SDK for Vigilant (https://vigilant.run).

## Installation

```bash
npm install @vigilant-js/core
```

## Usage

### Standard Usage

```ts
import { init, ConfigBuilder, logInfo } from '@vigilant-js/core'

const config = new ConfigBuilder()
  .withName('backend-server')
  .withToken('generated-token-here')
  .build()

init(config)

console.log('Hello, world!')
```

### Logging with attributes

```ts
import { init, ConfigBuilder, logInfo } from '@vigilant-js/core'

const config = new ConfigBuilder()
  .withName('backend-server')
  .withToken('generated-token-here')
  .build()

init(config)

logInfo('Hello, world!', { user: 'John Doe', userId: '1234567890' })
```

### Logging with context attributes

```ts
import { init, ConfigBuilder, logInfo, addAttributes } from '@vigilant-js/core'

const config = new ConfigBuilder()
  .withName('backend-server')
  .withToken('generated-token-here')
  .build()

init(config)

addAttributes({ user: 'John Doe', userId: '1234567890' }, () => {
  logDebug('Hello, world with attributes!')
  logInfo('Hello, world with attributes!')
})
```
