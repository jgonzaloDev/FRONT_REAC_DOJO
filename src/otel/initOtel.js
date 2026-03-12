import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { propagation } from '@opentelemetry/api'

let tracer = null
try {
  const provider = new WebTracerProvider()
  provider.register()

  // Configurar el propagador W3C Trace Context globalmente
  propagation.setGlobalPropagator(new W3CTraceContextPropagator())

  // Instrumentación automática de fetch para que inyecte headers automáticamente
  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: /.*/, // Propagar headers a todas las URLs
        clearTimingResources: true,
        applyCustomAttributesOnSpan: (span) => {
          span.setAttribute('custom.frontend', 'example-app')
        }
      })
    ]
  })

  tracer = provider.getTracer('example-app-tracer')
} catch (e) {
  console.error('[OTEL] Error inicializando OpenTelemetry:', e)
}

export { tracer }
