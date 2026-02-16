import inert from '@hapi/inert'

import { config } from '../config/config.js'
import { home } from './home/index.js'
import { about } from './about/index.js'
import { health } from './health/index.js'
import { auth } from './auth/index.js'
import { profile } from './profile/index.js'
import { rlbUpload } from './rlb-upload/index.js'
import { mockUploader } from './rlb-upload/mock-uploader.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Application specific routes, add your own routes here
      await server.register([home, about, rlbUpload, auth, profile])

      // Mock CDP Uploader for local development only
      if (config.get('cdpUploader.useMock')) {
        await server.register([mockUploader])
      }

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
