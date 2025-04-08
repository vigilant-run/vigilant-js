import { globalInstance } from '../vigilant'
import { getCurrentTime } from '../utils'
import {
  InvalidAlertTitleError,
  InvalidAttributesError,
  NotInitializedError,
} from '../messages'

export type Alert = {
  timestamp: string
  title: string
  attributes: Record<string, string>
}

export type AlertPassthroughFn = (message: string) => void

export function createAlert(
  title: string,
  attributes?: Record<string, string>,
): void {
  if (!globalInstance) throw NotInitializedError

  const alert = createAlertInstance(title, attributes)

  globalInstance.sendAlert(alert)
}

function createAlertInstance(
  title: string,
  attributes?: Record<string, string>,
): Alert {
  gateTitle(title)
  gateAttributes(attributes)
  return {
    timestamp: getCurrentTime(),
    title: title,
    attributes: attributes || {},
  }
}

function gateTitle(title: string): void {
  if (typeof title !== 'string') {
    throw InvalidAlertTitleError
  }
}

function gateAttributes(attributes?: Record<string, string>): void {
  if (attributes === undefined) return

  if (typeof attributes !== 'object' || attributes === null) {
    throw InvalidAttributesError
  }

  for (const [key, value] of Object.entries(attributes)) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw InvalidAttributesError
    }
  }
}

// Internal function to passthrough alerts to the console.
export function passthroughAlert(alert: Alert, writer: AlertPassthroughFn) {
  const { title, attributes } = alert
  const stringAttributes = Object.entries(attributes)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
  writer(`[${title}] ${stringAttributes}`)
}
