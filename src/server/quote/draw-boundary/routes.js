import joi from 'joi'

import { boundaryGeojsonSchema } from '@defra/nrf-library'

import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { checkBoundaryHandler, saveBoundaryHandler } from './controller.js'
import { routePath } from './route-path.js'

const routeId = 'draw-boundary'

export { routePath }
export const checkPath = '/quote/draw-boundary/check'
export const savePath = '/quote/draw-boundary/save'

/**
 * Builds the map's two POST endpoints so the request to use change alias can
 * register them under its own prefix with a different save handler, reusing
 * this page's payload validation untouched.
 * @param {object} params
 * @param {string} params.checkPath
 * @param {string} params.savePath
 * @param {import('@hapi/hapi').Lifecycle.Method} [params.saveHandler=saveBoundaryHandler]
 * @returns {Array<object>} the check and save route configs
 */
export const createDrawBoundaryApiRoutes = ({
  checkPath: checkRoutePath = checkPath,
  savePath: saveRoutePath = savePath,
  saveHandler = saveBoundaryHandler
}) => [
  {
    method: 'POST',
    path: checkRoutePath,
    options: {
      plugins: {
        crumb: { restful: true }
      },
      validate: {
        payload: joi.object({
          geometry: joi
            .object({
              type: joi.string().valid('Polygon').required(),
              coordinates: joi
                .array()
                .min(1)
                .items(
                  joi
                    .array()
                    .min(4)
                    .items(joi.array().length(2).items(joi.number()).required())
                )
                .required()
            })
            .unknown(true)
            .required()
        })
      }
    },
    handler: checkBoundaryHandler
  },
  {
    method: 'POST',
    path: saveRoutePath,
    options: {
      plugins: {
        crumb: { restful: true }
      },
      validate: {
        payload: joi.object({
          boundaryGeojson: boundaryGeojsonSchema
        })
      }
    },
    handler: saveHandler
  }
]

export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  },
  ...createDrawBoundaryApiRoutes({ checkPath, savePath })
]
