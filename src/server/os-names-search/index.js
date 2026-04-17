import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import routes, { routePath } from './routes.js'

const logger = createLogger()

export const osNamesSearch = {
  plugin: {
    name: 'os-names-search',
    register(server) {
      const osApiKey = config.get('map.osApiKey')
      if (osApiKey) {
        logger.info(
          `OS Names proxy registered at ${routePath} → api.os.uk/search/names`
        )
      } else {
        logger.warn(
          'OS API key (OS_API_KEY) is not set — OS Names search will fail'
        )
      }

      server.route(routes)
    }
  }
}
