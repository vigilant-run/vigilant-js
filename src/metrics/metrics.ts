import {
  InvalidMetricNameError,
  InvalidTagsError,
  NotInitializedError,
} from '../messages'
import { globalInstance } from '../vigilant'

export enum GaugeMode {
  Inc = 'inc',
  Dec = 'dec',
  Set = 'set',
}

/**
 * Creates a counter metric.
 *
 * @param {string} name - The name of the metric.
 * @param {number} value - The value of the metric.
 * @param {Record<string, string>} [tags] - The tags of the metric.
 */
export function metricCounter(
  name: string,
  value: number,
  tags?: Record<string, string>,
): void {
  if (!globalInstance) throw NotInitializedError

  const metric = createCounterEvent(name, value, tags)

  globalInstance.sendCounter(metric)
}

/**
 * Creates a gauge metric.
 *
 * @param {string} name - The name of the metric.
 * @param {number} value - The value of the metric.
 * @param {GaugeMode} mode - The mode of the metric.
 * @param {Record<string, string>} [tags] - The tags of the metric.
 */
export function metricGauge(
  name: string,
  value: number,
  mode?: GaugeMode,
  tags?: Record<string, string>,
): void {
  if (!globalInstance) throw NotInitializedError

  const metric = createGaugeEvent(name, value, mode, tags)

  globalInstance.sendGauge(metric)
}

/**
 * Creates a histogram metric.
 *
 * @param {string} name - The name of the metric.
 * @param {number} value - The value of the metric.
 * @param {Record<string, string>} [tags] - The tags of the metric.
 */
export function metricHistogram(
  name: string,
  value: number,
  tags?: Record<string, string>,
): void {
  if (!globalInstance) throw NotInitializedError

  const metric = createHistogramEvent(name, value, tags)

  globalInstance.sendHistogram(metric)
}

function gateName(name: string): void {
  if (typeof name !== 'string') {
    throw InvalidMetricNameError
  }
}

function gateTags(tags?: Record<string, string>): void {
  if (tags === undefined) return

  if (typeof tags !== 'object' || tags === null) {
    throw InvalidTagsError
  }

  for (const [key, value] of Object.entries(tags)) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw InvalidTagsError
    }
  }
}

export function createCounterEvent(
  name: string,
  value: number,
  tags?: Record<string, string>,
): CounterEvent {
  gateName(name)
  gateTags(tags)
  return {
    name: name,
    value: value,
    tags: tags || {},
  }
}

export function createGaugeEvent(
  name: string,
  value: number,
  mode?: GaugeMode,
  tags?: Record<string, string>,
): GaugeEvent {
  gateName(name)
  gateTags(tags)
  return {
    name: name,
    value: value,
    mode: mode || GaugeMode.Inc,
    tags: tags || {},
  }
}

export function createHistogramEvent(
  name: string,
  value: number,
  tags?: Record<string, string>,
): HistogramEvent {
  gateName(name)
  gateTags(tags)
  return {
    name: name,
    value: value,
    tags: tags || {},
  }
}

export type CounterEvent = {
  name: string
  value: number
  tags: Record<string, string>
}

export type GaugeEvent = {
  name: string
  value: number
  mode: GaugeMode
  tags: Record<string, string>
}

export type HistogramEvent = {
  name: string
  value: number
  tags: Record<string, string>
}

export type CounterSeries = {
  name: string
  value: number
  tags: Record<string, string>
}

export type GaugeSeries = {
  name: string
  value: number
  tags: Record<string, string>
}

export type HistogramSeries = {
  name: string
  values: number[]
  tags: Record<string, string>
}

export type CounterMessage = {
  timestamp: string
  metric_name: string
  value: number
  tags: Record<string, string>
}

export type GaugeMessage = {
  timestamp: string
  metric_name: string
  value: number
  tags: Record<string, string>
}

export type HistogramMessage = {
  timestamp: string
  metric_name: string
  values: number[]
  tags: Record<string, string>
}

export type AggregatedMetrics = {
  counter: CounterMessage[]
  gauge: GaugeMessage[]
  histogram: HistogramMessage[]
}
