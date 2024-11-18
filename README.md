# Vigilant JS SDK

This is the JavaScript SDK for Vigilant (https://github.com/vigilant-run/vigilant).

## Installation

```bash
npm install vigilant-js
```

## Usage

```javascript
import { VigilantLogger } from "vigilant-js";

const vigilant = new VigilantLogger({
  apiKey: "YOUR_API_KEY",
  endpoint: "https://api.vigilant.run/v1/log",
});

// Log an event
vigilant.info("event_name");
vigilant.warn("event_name");
vigilant.error("event_name");
```
