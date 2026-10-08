import { createMetricsCounter } from '@defra/nrf-library'

import { config } from '../../../config/config.js'
import { createLogger } from './logging/logger.js'

const metricsCounter = createMetricsCounter({
  isEnabled: () => config.get('isMetricsEnabled'),
  logger: createLogger()
})

export { metricsCounter }
