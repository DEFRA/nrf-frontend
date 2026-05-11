import { config } from '../../../../config/config.js'
import { getTraceId } from '@defra/hapi-tracing'

export const addTracingHeader = (headers = {}) => {
  const tracingHeader = config.get('tracing.header')
  const traceId = getTraceId()
  if (traceId) {
    return { ...headers, [tracingHeader]: traceId }
  }
  return { ...headers }
}
