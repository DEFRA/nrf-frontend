import { cookiesController, cookiesSubmitController } from './controller.js'
import { COOKIE_ROUTE } from './helpers/constants.js'

export const cookiesRoutes = [
  {
    method: 'GET',
    path: COOKIE_ROUTE,
    ...cookiesController
  },
  {
    method: 'POST',
    path: COOKIE_ROUTE,
    ...cookiesSubmitController
  }
]

export const cookies = {
  plugin: {
    name: 'cookies',
    register(server) {
      server.route(cookiesRoutes)
    }
  }
}
