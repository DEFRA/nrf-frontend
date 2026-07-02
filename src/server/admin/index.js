import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'

import Boom from '@hapi/boom'

import { config } from '../../config/config.js'
import { clearTileCache } from '../common/services/tile-cache.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

function validateApiKey(request) {
  const expected = config.get('adminApiKey')
  if (!expected) {
    throw Boom.internal('Admin API key not configured')
  }
  const provided = request.headers['x-api-key'] ?? ''
  const expectedBuf = Buffer.from(expected, 'utf8')
  const providedBuf = Buffer.from(provided, 'utf8')
  if (
    expectedBuf.length !== providedBuf.length ||
    !timingSafeEqual(expectedBuf, providedBuf)
  ) {
    throw Boom.unauthorized('Invalid API key')
  }
}

/**
 * @openapi
 * /admin/tile-cache:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Clear the map tile Redis cache
 *     description: Deletes all tile:* keys from Redis. Requires a valid x-api-key header (FRONTEND_API_KEY).
 *     security:
 *       - apiKey: []
 *     responses:
 *       204:
 *         description: Cache cleared successfully
 *       401:
 *         description: Missing or invalid API key
 */
export const admin = {
  plugin: {
    name: 'admin',
    register(server) {
      server.route({
        method: 'DELETE',
        path: '/admin/tile-cache',
        options: {
          auth: false
        },
        async handler(request, h) {
          validateApiKey(request)
          const count = await clearTileCache()
          logger.info(
            { count },
            'Admin tile cache clear: %d keys deleted',
            count
          )
          return h.response({ count }).code(200)
        }
      })
    }
  }
}
