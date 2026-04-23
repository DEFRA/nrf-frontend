import path from 'node:path'
import { readFileSync, statSync } from 'node:fs'

import { config } from '../../config.js'
import { buildNavigation } from './build-navigation.js'
import { gitHash } from '../../../server/common/helpers/git-hash.js'
import { createLogger } from '../../../server/common/helpers/logging/logger.js'

const logger = createLogger()
const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)
const isProduction = config.get('isProduction')

let webpackManifest
let webpackManifestMtimeMs

export function context(request) {
  const shouldReload =
    !webpackManifest ||
    (!isProduction && statSync(manifestPath).mtimeMs !== webpackManifestMtimeMs)

  if (shouldReload) {
    try {
      const stats = statSync(manifestPath)
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      webpackManifestMtimeMs = stats.mtimeMs
    } catch (error) {
      logger.error(error, `Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  const isAuthenticated = request?.auth?.credentials?.isAuthenticated || false
  const user = isAuthenticated ? request?.auth?.credentials : null

  return {
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    serviceVersion: gitHash,
    serviceUrl: '/',
    phaseBanner: {
      feedbackUrl: config.get('phaseBanner.feedbackUrl')
    },
    breadcrumbs: [],
    navigation: buildNavigation(request),
    isAuthenticated,
    user,
    getAssetPath(asset) {
      const webpackAssetPath = webpackManifest?.[asset]
      return `${assetPath}/${webpackAssetPath ?? asset}`
    }
  }
}
