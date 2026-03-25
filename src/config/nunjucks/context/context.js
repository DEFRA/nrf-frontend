import path from 'node:path'
import { readFileSync, statSync } from 'node:fs'

import { config } from '../../config.js'
import { buildNavigation } from './build-navigation.js'
import { gitHash } from '../../../server/common/helpers/git-hash.js'
import { createLogger } from '../../../server/common/helpers/logging/logger.js'

const logger = createLogger()
const assetPath = config.get('assetPath')
const shouldWatchWebpackManifest =
  config.get('isDevelopment') || config.get('isTest')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)

let webpackManifest
let webpackManifestMtimeMs

function loadWebpackManifest() {
  try {
    if (!shouldWatchWebpackManifest && webpackManifest) {
      return
    }

    if (shouldWatchWebpackManifest) {
      const manifestMtimeMs = statSync(manifestPath).mtimeMs

      if (webpackManifest && webpackManifestMtimeMs === manifestMtimeMs) {
        return
      }

      webpackManifestMtimeMs = manifestMtimeMs
    }

    webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  } catch (error) {
    logger.error(`Webpack ${path.basename(manifestPath)} not found`)
    webpackManifest = undefined
    webpackManifestMtimeMs = undefined
  }
}

export function context(request) {
  loadWebpackManifest()

  const isAuthenticated = request?.auth?.credentials?.isAuthenticated || false
  const user = isAuthenticated ? request?.auth?.credentials : null

  return {
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    serviceVersion: gitHash,
    serviceUrl: '/',
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
