import { createRequestLogger } from '@defra/nrf-library'

import { loggerOptions } from './logger-options.js'

export const requestLogger = createRequestLogger(loggerOptions)
