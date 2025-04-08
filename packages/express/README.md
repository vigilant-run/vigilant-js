# Vigilant Express

This is the Express middleware for Vigilant (https://vigilant.run).

## Installation

```bash
npm install @vigilant-js/core @vigilant-js/express
```

## Generate a token

You can generate a token by going to the [Vigilant Dashboard](https://dashboard.vigilant.run/settings/project/api) and clicking the "Create Token" button.

## Usage (Middleware)

Vigilant Express provides two middleware functions:
- `addLoggingMiddleware` - Logs all requests and responses
- `addExceptionMiddleware` - Logs all unhandled exceptions

Use these to monitor your Express application.

```ts
import { init } from '@vigilant-js/core'
import { addExceptionMiddleware, addLoggingMiddleware } from '@vigilant-js/express'

init({
  name: 'backend',
  token: 'generated-token-here',
})

addLoggingMiddleware(app)

app.get('/', (req, res) => {
  res.send('Hello, world!')
})

addExceptionMiddleware(app)

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
```
