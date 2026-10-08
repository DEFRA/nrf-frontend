import { createRequestTracing } from '@defra/nrf-library'

import { config } from '../../../config/config.js'

export const requestTracing = createRequestTracing(config.get('tracing.header'))
