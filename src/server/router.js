import inert from '@hapi/inert'

import { about } from './about/index.js'
import { health } from './health/index.js'
import { version } from './version/index.js'
import { auth } from './auth/index.js'
import { profile } from './profile/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { quote } from './quote/index.js'
import { osBaseMap } from './os-base-map/index.js'
import { osNamesSearch } from './os-names-search/index.js'
import { impactAssessorMap } from './impact-assessor-map/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health, version])

      // Application specific routes, add your own routes here
      await server.register([
        about,
        auth,
        profile,
        quote,
        osBaseMap,
        osNamesSearch,
        impactAssessorMap
      ])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
