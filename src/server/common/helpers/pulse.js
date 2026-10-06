import { createPulse } from '@defra/nrf-library'

import { createLogger } from './logging/logger.js'

const pulse = createPulse(createLogger())

export { pulse }
