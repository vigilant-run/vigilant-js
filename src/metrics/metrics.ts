import {
  InvalidMetricNameError,
  InvalidMetricAttributesError,
  NotInitializedError,
} from '../messages'
import { globalInstance } from '../vigilant'

export type Metric = {
  timestamp: string
  name: string
  value: number
  attributes: Record<string, string>
}

/**
 * Creates a metric event.
 *
 * @param {string} name - The name of the metric.
 * @param {number} value - The value of the metric.
 * @param {Record<string, string>} [attributes] - The attributes of the metric.
 * @example
 * metricEvent('my_metric', 1, { user: '123' })
 */
export function metricEvent(
  name: string,
  value: number,
  attributes?: Record<string, string>,
): void {
  if (!globalInstance) throw NotInitializedError

  const metric = createMetricEvent(name, value, attributes)

  globalInstance.sendMetric(metric)
}

export function createMetricEvent(
  name: string,
  value: number,
  attributes?: Record<string, string>,
): Metric {
  gateName(name)
  gateAttributes(attributes)
  return {
    timestamp: new Date().toISOString(),
    name: name,
    value: value,
    attributes: attributes || {},
  }
}

function gateName(name: string): void {
  if (typeof name !== 'string') {
    throw InvalidMetricNameError
  }
}

function gateAttributes(attributes?: Record<string, string>): void {
  if (attributes === undefined) return

  if (typeof attributes !== 'object' || attributes === null) {
    throw InvalidMetricAttributesError
  }

  for (const [key, value] of Object.entries(attributes)) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw InvalidMetricAttributesError
    }
  }
}
