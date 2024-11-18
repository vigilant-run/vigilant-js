# Vigilant JS SDK

This is the JavaScript SDK for Vigilant (https://github.com/vigilant-run/vigilant).

## Installation

```bash
npm install vigilant-js
```

## Usage

```javascript
import { VigilantLogger } from 'vigilant-js'

const vigilant = new VigilantLogger({
  apiKey: 'YOUR_API_KEY',
  endpoint: 'https://api.vigilant.run/v1/log',
})

// Log an event
vigilant.info('a message')
vigilant.warn('a warning')
vigilant.error('an error')
```
