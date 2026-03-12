import { createLogger } from '../../common/helpers/logging/logger.js'
import { saveQuoteDataToCache } from '../helpers/get-quote-session/index.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../helpers/form-validation-session/index.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import getViewModel from './get-view-model.js'

const logger = createLogger()

export function handler(request, h) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')

  if (!boundaryGeojson) {
    logger.info('check-boundary-result - no boundary data in session')
    return h.redirect(uploadBoundaryPath)
  }

  const flash = getValidationFlashFromCache(request)
  let validationErrors
  if (flash) {
    validationErrors = flash.validationErrors
    clearValidationFlashFromCache(request)
  }

  const viewModel = getViewModel(boundaryGeojson)

  return h.view('quote/check-boundary-result/index', {
    ...viewModel,
    formSubmitData: flash?.formSubmitData ?? {},
    validationErrors
  })
}

export function postHandler(request, h) {
  const { boundaryCorrect } = request.payload

  if (boundaryCorrect === 'no') {
    request.yar.clear('boundaryGeojson')
    return h.redirect(uploadBoundaryPath)
  }

  const boundaryGeojson = request.yar.get('boundaryGeojson')
  if (!boundaryGeojson) {
    return h.redirect(uploadBoundaryPath)
  }

  saveQuoteDataToCache(request, { boundaryGeojson })
  request.yar.clear('boundaryGeojson')
  logger.info('check-boundary-result - boundary confirmed, saved to quote data')

  return h.redirect('/quote/development-types')
}
