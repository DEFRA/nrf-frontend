import inert from '@hapi/inert'

import { about } from './about/index.js'
import { health } from './health/index.js'
import { auth } from './auth/index.js'
import { profile } from './profile/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { quote } from './quote/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Application specific routes, add your own routes here
      await server.register([about, auth, profile, quote])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
