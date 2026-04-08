import joi from 'joi'

import { quoteController } from '../controller-get.js'
import getViewModel from './get-view-model.js'
import { checkBoundaryHandler } from './controller.js'

const routeId = 'draw-boundary'
export const routePath = '/quote/draw-boundary'
export const checkPath = '/quote/draw-boundary/check'

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
      validate: {
        payload: joi.object({
          geometry: joi
            .object({
              type: joi.string().valid('Polygon').required(),
              coordinates: joi.array().required()
            })
            .unknown(true)
            .required()
        })
      }
    },
    handler: checkBoundaryHandler
  }
]
