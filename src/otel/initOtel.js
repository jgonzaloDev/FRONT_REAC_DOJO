import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'

let trace = null

try {
  const provider = new WebTracerProvider()
  provider.register()
  trace = provider.getTracer('example-app-tracer')
} catch (e) {
  trace = null
}

export { trace }
