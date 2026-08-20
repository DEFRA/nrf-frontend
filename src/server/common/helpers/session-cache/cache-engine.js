import { Engine as CatboxRedis } from '@hapi/catbox-redis'

import { createLogger } from '../logging/logger.js'
import { buildRedisClient } from '../redis-client.js'
import { config } from '../../../../config/config.js'

export function getCacheEngine() {
  const logger = createLogger()

  logger.info('Using Redis session cache')
  const client = buildRedisClient(config.get('redis'))
  return { engine: new CatboxRedis({ client }), client }
}
