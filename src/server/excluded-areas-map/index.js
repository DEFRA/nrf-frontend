import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import routes, { routePath } from './routes.js'

const logger = createLogger()

export const excludedAreasMap = {
  plugin: {
    name: 'excluded-areas-map',
    register(server) {
      logger.info(
        `Excluded areas map proxy registered at ${routePath} -> ${config.get('map.excludedAreasTileServerBaseUrl')}`
      )

      server.route(routes)
    }
  }
}
