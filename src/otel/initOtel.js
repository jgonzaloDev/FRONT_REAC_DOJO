import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'


let tracer = null
let provider = null  // ← sacar del try para acceso global

try {
  provider = new WebTracerProvider()

  // const exporter = new OTLPTraceExporter({
  //   url: "http://localhost:8080/api/otel/v1/traces"
  // })

 

  const exporter = new OTLPTraceExporter({
    url: "https://app-dojo.com/api/otel/v1/traces",
    headers: {},
    credentials: 'omit'  // ← agregar esto
})

//   provider.addSpanProcessor(
//     new SimpleSpanProcessor(exporter)
// )

 provider.addSpanProcessor(
    new BatchSpanProcessor(exporter, {
      scheduledDelayMillis: 1000,  // flush cada 5 segundos
      maxExportBatchSize: 512,     // máximo 512 spans por batch
      maxQueueSize: 2048,          // máximo spans en cola
      exportTimeoutMillis: 30000,  // timeout de exportación
    })
  )

  registerInstrumentations({
    tracerProvider: provider,      // ← pasar provider explícitamente
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

  // ← exponer al window para debugging
  window.__otelProvider = provider

  console.log('[OTEL] SDK inicializado correctamente')

} catch (e) {
  console.error('[OTEL] Error inicializando OpenTelemetry:', e)
}

export { tracer, provider }
