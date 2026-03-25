import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import routes, { routePath } from './routes.js'

const logger = createLogger()

// Serves Ordnance Survey base map resources (vector tiles, sprites, and style metadata)
export const osBaseMap = {
  plugin: {
    name: 'os-base-map',
    register(server) {
      const osApiKey = config.get('map.osApiKey')
      if (!osApiKey) {
        logger.warn(
          'OS API key (OS_API_KEY) is not set — map proxy requests will fail'
        )
      } else {
        logger.info(
          `Map proxy registered at ${routePath} → api.os.uk (API key: ${osApiKey.slice(0, 4)}...)`
        )
      }

      server.route(routes)
    }
  }
}
