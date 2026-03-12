try {
  const { WebTracerProvider } = require('@opentelemetry/sdk-trace-web')
  const { W3CTraceContextPropagator } = require('@opentelemetry/core')
  const { registerInstrumentations } = require('@opentelemetry/instrumentation')
  const { FetchInstrumentation } = require('@opentelemetry/instrumentation-fetch')
  const { propagation } = require('@opentelemetry/api')

  const provider = new WebTracerProvider()
  provider.register()

  // Configurar el propagador W3C Trace Context globalmente
  propagation.setGlobalPropagator(new W3CTraceContextPropagator())

  // Instrumentación automática de fetch para que inyecte headers automáticamente
  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: /.*/,  // Propagar headers a todas las URLs
        clearTimingResources: true,
        applyCustomAttributesOnSpan: (span) => {
          span.setAttribute('custom.frontend', 'example-app')
        }
      })
    ]
  })

  module.exports = {
    tracer: provider.getTracer('example-app-tracer')
  }
} catch (e) {
  console.error('[OTEL] Error inicializando OpenTelemetry:', e)
  module.exports = {
    tracer: null
  }
}
