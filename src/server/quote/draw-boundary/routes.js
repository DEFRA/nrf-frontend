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
          boundaryGeojson: joi
            .object({
              // Kept .unknown(true), and the overlap figures optional, so an
              // additive change to the boundary check API's EDP attributes
              // doesn't 400 users mid-journey — the view already renders each
              // overlap figure conditionally. label is nullable: it comes
              // from a shapefile attribute that is missing on some features.
              intersectingEdps: joi
                .array()
                .items(
                  joi
                    .object({
                      label: joi.string().allow(null).required(),
                      overlap_area_ha: joi.number(),
                      overlap_area_sqm: joi.number(),
                      overlap_percentage: joi.number()
                    })
                    .unknown(true)
                )
                .required(),
              intersectingExcludedAreas: joi
                .array()
                .items(joi.string())
                .required(),
              boundaryGeometryWgs84: joi.object().required(),
              boundaryMetadata: joi.object().required(),
              boundaryGeometryOriginal: joi.object().required()
            })
            .required()
        })
      }
    },
    handler: saveBoundaryHandler
  }
]
