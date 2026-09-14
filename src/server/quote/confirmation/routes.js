import Boom from '@hapi/boom'
import joi from 'joi'
import { confirmationGetController } from './controller-get.js'
import getViewModel from './get-view-model.js'
import { referenceParam } from '../../common/validation/reference.js'

const routeId = 'confirmation'
export const routePath = `/quote/${routeId}`

// A missing or malformed reference can't correspond to a real quote, so fail
// with a 404 before the backend is called — otherwise an empty reference would
// request /quotes/ and fetch every quote (NRF2-1066).
const invalidReferenceFailAction = () => {
  throw Boom.notFound()
}

export default [
  {
    method: 'GET',
    path: routePath,
    options: {
      validate: {
        query: joi.object({ reference: referenceParam }),
        failAction: invalidReferenceFailAction
      }
    },
    ...confirmationGetController({ routeId, getViewModel })
  }
]
