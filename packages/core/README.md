# Vigilant Core

This is the core library for Vigilant (https://vigilant.run).

## Installation

```bash
npm install @vigilant-js/core
```

## Generate a token

You can generate a token by going to the [Vigilant Dashboard](https://dashboard.vigilant.run/settings/project/api) and clicking the "Create Token" button.

## Usage (Logging)

Vigilant automatically captures console statements and sends them to the Vigilant API.
You can also log messages with the logging functions directly.

```ts
import { init, logInfo } from '@vigilant-js/core'

init({
  name: 'backend',
  token: 'generated-token-here',
})

console.log('Hello, world!')
logInfo('Hello, world!')
```

## Usage (Alerting)

Vigilant allows you to create alerts for specific events.
You will get notified when an alert is created.

```ts
import { init, createAlert } from '@vigilant-js/core'

init({
  name: 'backend',
  token: 'generated-token-here',
})

createAlert('db query failed', {
  query: 'SELECT * FROM users',
  error: 'Syntax error',
})
```


