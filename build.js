const esbuild = require('esbuild')
const path = require('path')

esbuild
  .build({
    entryPoints: [path.resolve(__dirname, 'src/index.ts')],
    outfile: path.resolve(__dirname, 'dist/cjs/index.js'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    sourcemap: true,
    external: [
      '@opentelemetry/api',
      '@opentelemetry/api-logs',
      '@opentelemetry/exporter-logs-otlp-grpc',
      '@opentelemetry/resources',
      '@opentelemetry/semantic-conventions',
      '@opentelemetry/sdk-logs',
      '@grpc/grpc-js',
    ],
  })
  .catch(() => process.exit(1))
