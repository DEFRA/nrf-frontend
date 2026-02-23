import crumb from '@hapi/crumb'

import { config } from '../../../config/config.js'

export const csrf = {
  plugin: crumb,
  options: {
    key: 'csrfToken',
    size: 43,
    cookieOptions: {
      isSecure: config.get('isProduction')
    },
    skip: () => config.get('isTest')
  }
}
