import { createLogger } from '../../common/helpers/logging/logger.js'
import { saveQuoteDataToCache } from '../helpers/get-quote-session/index.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache,
  saveValidationFlashToCache
} from '../helpers/form-validation-session/index.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import getViewModel from './get-view-model.js'

const selfPath = '/quote/map'

const logger = createLogger()

export function handler(request, h) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')

  if (!boundaryGeojson) {
    logger.info('map - no boundary data in session')
    return h.redirect(uploadBoundaryPath)
  }

  const flash = getValidationFlashFromCache(request)
  let validationErrors
  if (flash) {
    validationErrors = flash.validationErrors
    clearValidationFlashFromCache(request)
  }

  const viewModel = getViewModel(boundaryGeojson)

  return h.view('quote/map/index', {
    ...viewModel,
    formSubmitData: flash?.formSubmitData ?? {},
    validationErrors
  })
}

export function postHandler(request, h) {
  const { boundaryCorrect } = request.payload
  const boundaryGeojson = request.yar.get('boundaryGeojson')

  if (!boundaryGeojson) {
    return h.redirect(uploadBoundaryPath)
  }

  const intersectsEdp = boundaryGeojson?.intersects_edp ?? false

  if (!intersectsEdp && !boundaryCorrect) {
    const validationErrors = {
      summary: [
        { text: 'Select if the boundary is correct', href: '#boundaryCorrect' }
      ],
      messagesByFormField: {
        boundaryCorrect: { text: 'Select if the boundary is correct' }
      }
    }
    saveValidationFlashToCache(request, {
      validationErrors,
      formSubmitData: request.payload
    })
    return h.redirect(selfPath)
  }

  if (boundaryCorrect === 'no') {
    request.yar.clear('boundaryGeojson')
    return h.redirect(uploadBoundaryPath)
  }

  saveQuoteDataToCache(request, { boundaryGeojson })
  request.yar.clear('boundaryGeojson')
  logger.info('map - boundary confirmed, saved to quote data')

  return h.redirect('/quote/development-types')
}
