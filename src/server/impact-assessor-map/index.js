import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import routes, { routePath } from './routes.js'

const logger = createLogger()

export const impactAssessorMap = {
  plugin: {
    name: 'impact-assessor-map',
    register(server) {
      logger.info(
        `Impact assessor map proxy registered at ${routePath} -> ${config.get('map.impactAssessorBaseUrl')}`
      )

      server.route(routes)
    }
  }
}
