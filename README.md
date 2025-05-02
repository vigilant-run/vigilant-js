# Vigilant JavaScript SDK

This is the JavaScript SDK for Vigilant.

You can learn more about Vigilant at [website](https://vigilant.run) or [docs](https://docs.vigilant.run).

## Installation

```bash
npm install vigilant-js
```

## Setup

```ts
import { initVigilant } from 'vigilant-js'

initVigilant({
  name: 'backend',
  token: 'tk_1234567890', // Generate this from the Vigilant dashboard
})
``` 

## Logs

You can learn more about logging in Vigilant in the [docs](https://docs.vigilant.run/logs).

```ts
import { logInfo, logDebug, logWarn, logError, logTrace } from 'vigilant-js'

// Vigilant will automatically capture console statements as logs
console.log('Hello, world!')  
console.error('Hello, world!')

// Log a custom message
logInfo('Log an info message')
logDebug('Log a debug message')
logWarn('Log a warning message')
logError('Log an error message')
logTrace('Log a trace message')

// Log with a custom attribute
logInfo('Log an info message', { user: '123' })
logDebug('Log a debug message', { user: '123' })
logWarn('Log a warning message', { user: '123' })
logError('Log an error message', { user: '123' })
logTrace('Log a trace message', { user: '123' })
```

## Metrics

You can learn more about metrics in Vigilant in the [docs](https://docs.vigilant.run/metrics).

```ts
import { metricCounter, metricGauge, metricHistogram, GaugeMode } from 'vigilant-js'

// Create a counter metric
metricCounter('user_login_count', 1)

// Create a counter metric with a custom attribute
metricCounter('user_login_count', 1, { "env": "prod" })

// Create a gauge metric
metricGauge('active_users', 1, GaugeMode.Set)

// Create a gauge metric with a custom attribute
metricGauge('active_users', 1, GaugeMode.Set, { "env": "prod" })

// Create a histogram metric
metricHistogram('http_request_duration', 123.4)

// Create a histogram metric with a custom attribute
metricHistogram('http_request_duration', 123.4, { "env": "prod" })
```
