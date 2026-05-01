import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

let tracer = null
let provider = null

try {

  // 👇 AQUÍ ESTÁ TU CAMBIO IMPORTANTE
  provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'react-frontend'
    })
  })

  const exporter = new OTLPTraceExporter({
    url: "https://app-dojo.com/api/otel/v1/traces",
    headers: {},
    credentials: 'omit'
  })

  provider.addSpanProcessor(
    new BatchSpanProcessor(exporter, {
      scheduledDelayMillis: 1000,
      maxExportBatchSize: 512,
      maxQueueSize: 2048,
      exportTimeoutMillis: 30000,
    })
  )

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: /.*/,
        clearTimingResources: true,
        applyCustomAttributesOnSpan: (span) => {
          span.setAttribute('custom.frontend', 'example-app')
        }
      })
    ]
  })

  provider.register({
    propagator: new W3CTraceContextPropagator()
  })

  tracer = provider.getTracer('example-app-tracer')

  window.__otelProvider = provider

  console.log('[OTEL] SDK inicializado correctamente')

} catch (e) {
  console.error('[OTEL] Error inicializando OpenTelemetry:', e)
}

export { tracer, provider }
