import { credentials } from '@grpc/grpc-js'
import { Metadata } from '@grpc/grpc-js'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc'
import { Resource } from '@opentelemetry/resources'
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

interface OTELConfig {
  url?: string
  token?: string
  name?: string
  insecure?: boolean
}

export function createOTELProvider(config: OTELConfig): LoggerProvider {
  const {
    url = 'log.vigilant.run:4317',
    token = 'tk_1234567890',
    name = 'example',
    insecure = false,
  } = config

  const metadata = new Metadata()
  metadata.set('x-vigilant-token', token)

  const exporter = new OTLPLogExporter({
    url: url,
    metadata: metadata,
    credentials: insecure ? credentials.createInsecure() : undefined,
    concurrencyLimit: 10,
    timeoutMillis: 10000,
  })

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: name,
  })

  const loggerProvider = new LoggerProvider({
    resource,
  })

  loggerProvider.addLogRecordProcessor(
    new BatchLogRecordProcessor(exporter, {
      scheduledDelayMillis: 0,
      maxExportBatchSize: 1000,
      exportTimeoutMillis: 1000,
      maxQueueSize: 1000,
    }),
  )

  return loggerProvider
}
