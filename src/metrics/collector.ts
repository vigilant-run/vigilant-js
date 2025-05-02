import {
  AggregatedMetrics,
  CounterEvent,
  CounterSeries,
  GaugeEvent,
  GaugeSeries,
  HistogramEvent,
  HistogramSeries,
} from './metrics'
import { createMetricsSender, MetricsSender } from './sender'

// MetricCollector is a class that collects metrics and flushes them to the metrics sender.
export class MetricCollector {
  private interval: number
  private processInterval: number

  private counterQueue: CounterEvent[]
  private gaugeQueue: GaugeEvent[]
  private histogramQueue: HistogramEvent[]

  private counterSeries: Record<string, CounterSeries>
  private gaugeSeries: Record<string, GaugeSeries>
  private histogramSeries: Record<string, HistogramSeries>

  private processorInterval: ReturnType<typeof setInterval> | null
  private tickerTimeoutId: ReturnType<typeof setTimeout> | null
  private tickerIntervalId: ReturnType<typeof setInterval> | null
  private collectorStop = false

  private sender: MetricsSender

  constructor(
    interval: number,
    processInterval: number,
    sender: MetricsSender,
  ) {
    this.interval = interval
    this.processInterval = processInterval

    this.counterQueue = []
    this.gaugeQueue = []
    this.histogramQueue = []

    this.counterSeries = {}
    this.gaugeSeries = {}
    this.histogramSeries = {}

    this.processorInterval = null
    this.tickerTimeoutId = null
    this.tickerIntervalId = null
    this.collectorStop = false

    this.sender = sender
  }

  // Adds a counter metric to the collector.
  addCounter = (metric: CounterEvent) => {
    this.counterQueue.push(metric)
  }

  // Adds a gauge metric to the collector.
  addGauge = (metric: GaugeEvent) => {
    this.gaugeQueue.push(metric)
  }

  // Adds a histogram metric to the collector.
  addHistogram = (metric: HistogramEvent) => {
    this.histogramQueue.push(metric)
  }

  // Starts the collector's processing loop and the interval ticker.
  start = () => {
    this.collectorStop = false
    this.startTicker()
    this.startProcessor()
    this.sender.start()
  }

  // Shuts down the collector.
  shutdown = async () => {
    this.collectorStop = true
    this.shutdownTicker()
    this.shutdownProcessor()
    this.sendAfterShutdown()
    await this.sender.shutdown()
  }

  // Starts the interval ticker.
  private startTicker = () => {
    const now = new Date()
    const start = new Date(now.getTime() - (now.getTime() % this.interval))
    const next = new Date(start.getTime() + this.interval)
    const firstTriggerTime = next.getTime() + 1000

    let durationUntilFirstTrigger = firstTriggerTime - now.getTime()
    if (durationUntilFirstTrigger < 0) {
      durationUntilFirstTrigger += this.interval
    }

    this.tickerTimeoutId = setTimeout(() => {
      if (this.collectorStop) return
      const firstTickTime = new Date(firstTriggerTime)
      this.processTick(firstTickTime)
      this.tickerIntervalId = setInterval(() => {
        if (this.collectorStop) {
          if (this.tickerIntervalId) clearInterval(this.tickerIntervalId)
          return
        }
        this.processTick(new Date())
      }, this.interval)
    }, durationUntilFirstTrigger)
  }

  // Shuts down the interval ticker.
  private shutdownTicker = () => {
    if (this.tickerTimeoutId) {
      clearTimeout(this.tickerTimeoutId)
      this.tickerTimeoutId = null
    }
    if (this.tickerIntervalId) {
      clearInterval(this.tickerIntervalId)
      this.tickerIntervalId = null
    }
  }

  // Starts the processor.
  private startProcessor = () => {
    this.processorInterval = setInterval(() => {
      if (this.collectorStop) {
        if (this.processorInterval) clearInterval(this.processorInterval)
        this.processorInterval = null
        return
      }
      this.processQueues()
    }, this.processInterval)
  }

  // Shuts down the processor.
  private shutdownProcessor = () => {
    if (this.processorInterval) {
      clearInterval(this.processorInterval)
      this.processorInterval = null
    }
  }

  // Processes metrics for the interval ending *before* the given tickTime.
  private processTick = (tickTime: Date): void => {
    const timeMillis = tickTime.getTime()
    const startMillis = Math.floor(timeMillis / this.interval) * this.interval
    const previousMillis = startMillis - this.interval
    const intervalISO = new Date(previousMillis).toISOString()
    this.sendMetricsForInterval(intervalISO)
  }

  // Processes the queues.
  private processQueues = (): void => {
    const counters = this.counterQueue.splice(0, this.counterQueue.length)
    const gauges = this.gaugeQueue.splice(0, this.gaugeQueue.length)
    const histograms = this.histogramQueue.splice(0, this.histogramQueue.length)

    counters.forEach(this.processCounter)
    gauges.forEach(this.processGauge)
    histograms.forEach(this.processHistogram)
  }

  // Processes a counter metric.
  private processCounter = (metric: CounterEvent): void => {
    const identifier = this.getIdentifer(metric)
    const counter = this.counterSeries[identifier]
    if (!counter) {
      this.counterSeries[identifier] = {
        name: metric.name,
        value: metric.value,
        tags: metric.tags,
      }
    } else {
      counter.value += metric.value
    }
  }

  // Processes a gauge metric.
  private processGauge = (metric: GaugeEvent): void => {
    const identifier = this.getIdentifer(metric)
    const gauge = this.gaugeSeries[identifier]
    if (!gauge) {
      this.gaugeSeries[identifier] = {
        name: metric.name,
        value: metric.value,
        tags: metric.tags,
      }
    } else {
      gauge.value = metric.value
    }
  }

  // Processes a previously queued histogram metric.
  private processHistogram = (metric: HistogramEvent): void => {
    const identifier = this.getIdentifer(metric)
    const histogram = this.histogramSeries[identifier]
    if (!histogram) {
      this.histogramSeries[identifier] = {
        name: metric.name,
        values: [metric.value],
        tags: metric.tags,
      }
    } else {
      histogram.values.push(metric.value)
    }
  }

  // Gets the identifier for a metric.
  private getIdentifer = (
    metric: CounterEvent | GaugeEvent | HistogramEvent,
  ): string => {
    const tags = Object.entries(metric.tags).sort((a, b) =>
      a[0].localeCompare(b[0]),
    )
    return `${metric.name}_${tags.map(([key, value]) => `${key}_${value}`).join(',')}`
  }

  // Sends after shutdown.
  private sendAfterShutdown = (): void => {
    this.processQueues()
    const now = new Date()
    const intervalISO = new Date(
      Math.floor(now.getTime() / this.interval) * this.interval,
    ).toISOString()
    this.sendMetricsForInterval(intervalISO)
  }

  // Sends the captured metrics for the provided interval timestamp string.
  private sendMetricsForInterval = (intervalISO: string): void => {
    const metrics = this.aggregateMetrics(intervalISO)
    this.resetCapturedMetrics()
    this.sender.add(metrics)
  }

  // Aggregates captured metrics.
  private aggregateMetrics = (intervalISO: string): AggregatedMetrics => {
    const counters = Object.values(this.counterSeries)
    const gauges = Object.values(this.gaugeSeries)
    const histograms = Object.values(this.histogramSeries)

    return {
      counter: counters.map((counter) => ({
        timestamp: intervalISO,
        metric_name: counter.name,
        value: counter.value,
        tags: counter.tags,
      })),
      gauge: gauges.map((gauge) => ({
        timestamp: intervalISO,
        metric_name: gauge.name,
        value: gauge.value,
        tags: gauge.tags,
      })),
      histogram: histograms.map((histogram) => ({
        timestamp: intervalISO,
        metric_name: histogram.name,
        values: histogram.values,
        tags: histogram.tags,
      })),
    }
  }

  // Resets the captured metrics.
  private resetCapturedMetrics = (): void => {
    for (const key in this.counterSeries) {
      this.counterSeries[key].value = 0
    }
    for (const key in this.histogramSeries) {
      this.histogramSeries[key].values = []
    }
  }
}

// Creates a new metrics collector.
export function createMetricsCollector(
  endpoint: string,
  token: string,
): MetricCollector {
  const sender = createMetricsSender(endpoint, token)
  return new MetricCollector(60_000, 1_000, sender)
}

type CapturedMetrics = {
  counter: Record<string, CapturedCounter>
  gauge: Record<string, CapturedGauge>
  histogram: Record<string, CapturedHistogram>
}

type CapturedCounter = {
  name: string
  value: number
  tags: Record<string, string>
}

type CapturedGauge = {
  name: string
  value: number
  tags: Record<string, string>
}

type CapturedHistogram = {
  name: string
  values: number[]
  tags: Record<string, string>
}
