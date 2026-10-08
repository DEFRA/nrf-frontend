import { buildLogger } from '@defra/nrf-library'

import { loggerOptions } from './logger-options.js'

const logger = buildLogger(loggerOptions)

function createLogger() {
  return logger
}

export { createLogger }
