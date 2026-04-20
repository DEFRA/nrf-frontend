import joi from 'joi'

import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { checkBoundaryHandler, saveBoundaryHandler } from './controller.js'

const routeId = 'draw-boundary'
export const routePath = '/quote/draw-boundary'
export const checkPath = '/quote/draw-boundary/check'
export const savePath = '/quote/draw-boundary/save'

export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: checkPath,
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
    path: savePath,
    options: {
      plugins: {
        crumb: { restful: true }
      },
      validate: {
        payload: joi.object({
          boundaryGeojson: joi.object().required()
        })
      }
    },
    handler: saveBoundaryHandler
  }
]
