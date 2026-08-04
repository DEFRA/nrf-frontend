import crumb from '@hapi/crumb'

import { config } from '../../../config/config.js'

// @hapi/crumb still runs generate() on routes that opt out via
// plugins.crumb: false (autoGenerate applies regardless), and since those
// routes never read the existing cookie into request.plugins.crumb, it
// looks unset and a brand new crumb is minted — silently invalidating the
// real cookie the client is still holding. Using skip() bypasses crumb's
// cookie read/generate logic entirely for that route, avoiding the clobber.
const NO_CRUMB_PATHS = ['/api/browser-logs']

export const csrf = {
  plugin: crumb,
  options: {
    key: 'csrfToken',
    size: 43,
    cookieOptions: {
      isSecure: config.get('isProduction')
    },
    skip: (request) =>
      config.get('isTest') || NO_CRUMB_PATHS.includes(request.path)
  }
}
