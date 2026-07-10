import {
  analyticsInternalController,
  analyticsInternalSubmitController
} from './controller.js'
import { ANALYTICS_INTERNAL_ROUTE } from '../cookies/helpers/constants.js'

export const analyticsInternal = {
  plugin: {
    name: 'analytics-internal',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ANALYTICS_INTERNAL_ROUTE,
          ...analyticsInternalController
        },
        {
          method: 'POST',
          path: ANALYTICS_INTERNAL_ROUTE,
          ...analyticsInternalSubmitController
        }
      ])
    }
  }
}
